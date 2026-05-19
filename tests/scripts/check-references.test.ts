import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const SCRIPT = path.resolve('scripts/check-references.mjs');
const PROJECT_ROOT = process.cwd();

function setupRepo(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'ref-check-'));
  mkdirSync(path.join(dir, 'docs', 'references', 'screens'), { recursive: true });
  return dir;
}

function writeFakePng(target: string) {
  // 1x1 transparent PNG.
  const data = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c63600100000005000132cb030000000049454e44ae426082',
    'hex',
  );
  writeFileSync(target, data);
}

function writeChecklist(target: string) {
  writeFileSync(
    target,
    `# Design Checklist

## Brand tokens

## EMPLOYEE APP SHELL — \`screens/employee-full-ui-ux-mobile.png\`

## SUPER ADMIN APP SHELL — \`screens/super-admin-full-ui-ux-mobile.png\` and \`screens/super-admin-full-ui-ux-desktop.png\`

## EMAILING SYSTEM — \`screens/full-ui-ux-emailing-system.png\`
`,
  );
}

function writeReadme(target: string) {
  writeFileSync(target, '# Design References\n');
}

function writeEmailGuide(target: string) {
  writeFileSync(target, '# Email style guide\n');
}

function seedHappyPath(workdir: string) {
  const refsDir = path.join(workdir, 'docs', 'references');
  const screensDir = path.join(refsDir, 'screens');
  writeReadme(path.join(refsDir, 'README.md'));
  writeChecklist(path.join(refsDir, 'design-checklist.md'));
  writeEmailGuide(path.join(refsDir, 'email-style-guide.md'));
  writeFakePng(path.join(refsDir, 'myprodusen-logo.png'));
  writeFakePng(path.join(screensDir, 'employee-full-ui-ux-mobile.png'));
  writeFakePng(path.join(screensDir, 'super-admin-full-ui-ux-desktop.png'));
  writeFakePng(path.join(screensDir, 'super-admin-full-ui-ux-mobile.png'));
  writeFakePng(path.join(screensDir, 'full-ui-ux-emailing-system.png'));
}

function runIn(workdir: string) {
  return spawnSync('node', [SCRIPT], {
    cwd: workdir,
    env: { ...process.env, NO_COLOR: '1' },
    encoding: 'utf8',
  });
}

describe('check-references script', () => {
  let workdir: string;

  beforeEach(() => {
    workdir = setupRepo();
  });

  afterEach(() => {
    rmSync(workdir, { recursive: true, force: true });
  });

  it('passes with the canonical set in place', () => {
    seedHappyPath(workdir);
    const result = runIn(workdir);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Reference contract check passed');
  });

  it('errors when the screens directory is missing', () => {
    const refsDir = path.join(workdir, 'docs', 'references');
    rmSync(path.join(refsDir, 'screens'), { recursive: true, force: true });
    writeReadme(path.join(refsDir, 'README.md'));
    writeChecklist(path.join(refsDir, 'design-checklist.md'));
    writeEmailGuide(path.join(refsDir, 'email-style-guide.md'));
    writeFakePng(path.join(refsDir, 'myprodusen-logo.png'));

    const result = runIn(workdir);
    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).toContain('docs/references/screens directory');
  });

  it('errors when a required screen is missing', () => {
    seedHappyPath(workdir);
    rmSync(path.join(workdir, 'docs', 'references', 'screens', 'employee-full-ui-ux-mobile.png'));
    const result = runIn(workdir);
    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).toContain('employee-full-ui-ux-mobile.png');
  });

  it('errors when the checklist no longer references all screens', () => {
    seedHappyPath(workdir);
    writeFileSync(
      path.join(workdir, 'docs', 'references', 'design-checklist.md'),
      '# Design Checklist\n## Brand tokens\n## EMPLOYEE APP SHELL\n',
    );
    const result = runIn(workdir);
    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).toContain('super-admin-full-ui-ux-desktop.png');
  });

  it('warns about extra screens that are not part of the canonical set', () => {
    seedHappyPath(workdir);
    writeFakePng(path.join(workdir, 'docs', 'references', 'screens', 'extra.png'));
    const result = runIn(workdir);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('extra.png');
  });

  it('passes against the live project root', () => {
    if (!existsSync(path.join(PROJECT_ROOT, 'docs', 'references', 'screens'))) {
      return;
    }
    const result = spawnSync('node', [SCRIPT], {
      cwd: PROJECT_ROOT,
      env: { ...process.env, NO_COLOR: '1' },
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);
  });
});
