import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function getVersionMetadata() {
  return {
    appName: 'MyProdusen',
    status: 'ok' as const,
    appVersion: process.env.APP_VERSION || process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
    gitCommitSha: process.env.GIT_COMMIT_SHA || process.env.COOLIFY_GIT_COMMIT_SHA || 'unknown',
    buildTime: process.env.BUILD_TIME || process.env.COOLIFY_BUILD_TIME || 'unknown',
    nodeEnv: process.env.NODE_ENV || 'unknown',
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
