import { spawn } from 'node:child_process';

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

child.on('exit', (code, signal) => {
  clearInterval(heartbeat);

  if (signal) {
    console.error(`[build] Next.js build stopped by signal ${signal}`);
    process.exit(1);
  }

  process.exit(code ?? 1);
});
