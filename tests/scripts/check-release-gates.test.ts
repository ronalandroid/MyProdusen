import { afterEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const SCRIPT = path.resolve('scripts/check-release-gates.mjs');

function setupRepo(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'release-gates-'));
  mkdirSync(path.join(dir, 'docs'), { recursive: true });
  writeFileSync(
    path.join(dir, 'docs', 'TESTING_QA.md'),
    [
      '# Testing & QA',
      '## Gamification/theme release gates',
      '- Gamification release gate: disabled unless product, QA, and security sign-off exists.',
      '- Theme release gate: MyProdusen yellow/black/white theme stays locked unless design sign-off exists.',
    ].join('\n'),
  );
  writeFileSync(
    path.join(dir, 'docs', 'SECURITY.md'),
    [
      '# Security',
      '## Gamification/theme release gates',
      '- Gamification must not expose private HR data, payroll, attendance, leave, KPI, or employee identifiers.',
      '- Theme changes must not weaken auth, RBAC, CSRF, private cache, or upload controls.',
    ].join('\n'),
  );
  return dir;
}

function runIn(workdir: string, env: NodeJS.ProcessEnv = {}) {
  return spawnSync('node', [SCRIPT], {
    cwd: workdir,
    env: { ...process.env, ...env, NO_COLOR: '1' },
    encoding: 'utf8',
  });
}

describe('check-release-gates script', () => {
  let workdir: string;

  afterEach(() => {
    if (workdir) rmSync(workdir, { recursive: true, force: true });
  });

  it('passes when gamification and theme experiments stay disabled with QA/security docs present', () => {
    workdir = setupRepo();
    const result = runIn(workdir);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Release gate check passed');
  });

  it('blocks enabled gamification without explicit approval', () => {
    workdir = setupRepo();
    const result = runIn(workdir, { FEATURE_GAMIFICATION_ENABLED: 'true' });

    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).toContain('FEATURE_GAMIFICATION_ENABLED');
    expect(result.stdout + result.stderr).toContain('requires GAMIFICATION_RELEASE_APPROVED=true');
  });

  it('blocks theme experiments without explicit approval', () => {
    workdir = setupRepo();
    const result = runIn(workdir, { NEXT_PUBLIC_THEME_EXPERIMENT_ENABLED: 'true' });

    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).toContain('NEXT_PUBLIC_THEME_EXPERIMENT_ENABLED');
    expect(result.stdout + result.stderr).toContain('requires THEME_RELEASE_APPROVED=true');
  });

  it('blocks missing QA/security gate docs', () => {
    workdir = setupRepo();
    writeFileSync(path.join(workdir, 'docs', 'SECURITY.md'), '# Security\n');
    const result = runIn(workdir);

    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).toContain('docs/SECURITY.md');
    expect(result.stdout + result.stderr).toContain('Gamification/theme release gates');
  });
});
