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
      // Missing/invalid local configuration
      if (
        error.message.includes('NVIDIA_API_KEY') ||
        error.message.toLowerCase().includes('api key')
      ) {
        return NextResponse.json(
          { error: 'Configuration error: NVIDIA_API_KEY not configured' },
          { status: 500 }
        );
      }

      // Upstream NVIDIA errors
      if (error.message.startsWith('NVIDIA API error:')) {
        return NextResponse.json(
          { error: error.message },
          { status: 502 }
        );
      }

      // Default: forward message so UI can display actionable info
      return NextResponse.json(
        { error: error.message || 'Failed to process chat request' },
        { status: 500 }
      );
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
