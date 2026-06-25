import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function getVersionMetadata() {
  // Public, unauthenticated endpoint — return only a benign liveness + version
  // signal. Do NOT expose infrastructure recon (nodeEnv, git commit, build time):
  // confirming prod-vs-staging and exact build is high-value to an attacker.
  return {
    appName: 'MyProdusen',
    status: 'ok' as const,
    appVersion: process.env.APP_VERSION || process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
  };
}

export async function GET() {
  return NextResponse.json(getVersionMetadata(), {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}
