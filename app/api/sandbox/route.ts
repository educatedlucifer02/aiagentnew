import { NextRequest, NextResponse } from 'next/server';
import { getSandboxAgent } from '@/app/lib/sandbox';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, language, timeout, files } = body;

    if (!code || !language) {
      return NextResponse.json(
        { error: 'Code and language are required' },
        { status: 400 }
      );
    }

    const sandbox = getSandboxAgent();
    const result = await sandbox.execute({
      code,
      language,
      timeout,
      files,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Sandbox execution error:', error);
    return NextResponse.json(
      {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: 0,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const sandbox = getSandboxAgent();
  const isHealthy = await sandbox.healthCheck();

  return NextResponse.json({
    status: isHealthy ? 'ok' : 'degraded',
    service: 'sandbox-agent',
    timestamp: new Date().toISOString(),
  });
}
