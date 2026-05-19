#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const projects = [
  { name: 'chromium-browser', port: '3021' },
  { name: 'firefox-browser', port: '3022' },
  { name: 'webkit-browser', port: '3023' },
];

const missingBrowserPattern = /Executable doesn't exist|Please run the following command to download new browsers|browserType\.launch/i;
let failures = 0;
let skipped = 0;

for (const project of projects) {
  console.log(`\nRunning ${project.name}`);
  const result = spawnSync(
    'npx',
    ['playwright', 'test', 'tests/e2e/public-smoke.spec.ts', `--project=${project.name}`],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
      env: {
        ...process.env,
        E2E_BROWSER_MATRIX: '1',
        E2E_PORT: project.port,
      },
    },
  );

  const output = `${result.stdout || ''}${result.stderr || ''}`;
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');

  if (result.status === 0) continue;

  if (missingBrowserPattern.test(output)) {
    skipped += 1;
    console.log(`SKIP ${project.name}: Playwright browser binary is not installed. Run: npx playwright install ${project.name.split('-')[0]}`);
    continue;
  }

  failures += 1;
}

if (failures > 0) {
  console.error(`Browser smoke failed in ${failures} project(s).`);
  process.exit(1);
}

if (skipped > 0) {
  console.log(`Browser smoke completed with ${skipped} skipped browser project(s).`);
}
