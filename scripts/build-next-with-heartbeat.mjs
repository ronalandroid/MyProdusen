import { spawn } from 'node:child_process';
import { cp, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const heartbeatMs = Number(process.env.BUILD_HEARTBEAT_MS || 30000);
const child = spawn('npx', ['next', 'build', '--webpack'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED || '1',
  },
});

const heartbeat = setInterval(() => {
  console.log(`[build] Next.js build still running at ${new Date().toISOString()}`);
}, heartbeatMs);

async function copyStandaloneAssets() {
  if (!existsSync('.next/standalone')) {
    return;
  }

  await mkdir('.next/standalone/.next', { recursive: true });

  if (existsSync('.next/static')) {
    await cp('.next/static', '.next/standalone/.next/static', { recursive: true, force: true });
  }

  if (existsSync('public')) {
    await cp('public', '.next/standalone/public', { recursive: true, force: true });
  }
}

child.on('exit', async (code, signal) => {
  clearInterval(heartbeat);

  if (signal) {
    console.error(`[build] Next.js build stopped by signal ${signal}`);
    process.exit(1);
  }

  if (code === 0) {
    try {
      await copyStandaloneAssets();
    } catch (error) {
      console.error('[build] Failed to copy standalone assets', error);
      process.exit(1);
    }
  }

  process.exit(code ?? 1);
});
