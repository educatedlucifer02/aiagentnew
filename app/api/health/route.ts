import { NextResponse } from 'next/server';

export async function GET() {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      api: 'ok',
      nvidia: 'unknown',
      sandbox: 'unknown',
    },
  };

  // Check NVIDIA API
  try {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (apiKey) {
      checks.services.nvidia = 'ok';
    } else {
      checks.services.nvidia = 'missing_key';
    }
  } catch {
    checks.services.nvidia = 'error';
  }

  // Check sandbox
  try {
    const sandboxUrl = process.env.SANDBOX_URL;
    if (sandboxUrl) {
      const response = await fetch(`${sandboxUrl}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      checks.services.sandbox = response.ok ? 'ok' : 'degraded';
    } else {
      checks.services.sandbox = 'simulated';
    }
  } catch {
    checks.services.sandbox = 'unavailable';
  }

  const allOk =
    checks.services.api === 'ok' &&
    checks.services.nvidia === 'ok' &&
    ['ok', 'simulated', 'unavailable'].includes(checks.services.sandbox);

  return NextResponse.json(checks, {
    status: allOk ? 200 : 503,
  });
}
