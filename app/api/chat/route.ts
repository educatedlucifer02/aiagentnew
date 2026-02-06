import { NextRequest, NextResponse } from 'next/server';
import { getNvidiaClient } from '@/app/lib/nvidia';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, stream = true, maxTokens, temperature } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const client = getNvidiaClient();

    if (stream) {
      const encoder = new TextEncoder();

      const stream = client.streamChat({
        messages,
        maxTokens,
        temperature,
      });

      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const data = JSON.stringify(chunk);
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            console.error('Stream error:', error);
            controller.error(error);
          }
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    } else {
      const content = await client.sendMessage({
        messages,
        maxTokens,
        temperature,
      });

      return NextResponse.json({ content });
    }
  } catch (error) {
    console.error('Chat API error:', error);

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Configuration error: API key not configured' },
          { status: 500 }
        );
      }

      // Forward a more specific error when available
      if (error.message.startsWith('NVIDIA API error:')) {
        return NextResponse.json(
          { error: error.message },
          { status: 502 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    model: 'moonshotai/kimi-k2.5',
    timestamp: new Date().toISOString(),
  });
}
