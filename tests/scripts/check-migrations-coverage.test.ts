import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const SCRIPT = path.resolve('scripts/check-migrations-coverage.mjs');

function runIn(workdir: string) {
  return spawnSync('node', [SCRIPT], {
    cwd: workdir,
    env: { ...process.env, NO_COLOR: '1' },
    encoding: 'utf8',
  });
}

function setupRepo(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'mig-cov-'));
  mkdirSync(path.join(dir, 'drizzle', 'migrations', 'meta'), { recursive: true });
  return dir;
}

function writeMigration(workdir: string, filename: string, content = '-- noop\n') {
  writeFileSync(path.join(workdir, 'drizzle', 'migrations', filename), content, 'utf8');
}

function writeJournal(workdir: string, tags: string[]) {
  const journal = {
    version: '7',
    dialect: 'postgresql',
    entries: tags.map((tag, idx) => ({
      idx,
      version: '7',
      when: 1700000000000 + idx,
      tag,
      breakpoints: true,
    })),
  };
  writeFileSync(path.join(workdir, 'drizzle', 'migrations', 'meta', '_journal.json'), JSON.stringify(journal, null, 2));
}

describe('check-migrations-coverage script', () => {
  let workdir: string;

  beforeEach(() => {
    workdir = setupRepo();
  });

  afterEach(() => {
    rmSync(workdir, { recursive: true, force: true });
  });

  it('passes when migrations and journal align', () => {
    writeMigration(workdir, '0000_init.sql');
    writeMigration(workdir, '0001_add_users.sql');
    writeJournal(workdir, ['0000_init', '0001_add_users']);

    const result = runIn(workdir);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Migration coverage check passed');
  });

  it('passes with warning when journal trails the migrations on disk', () => {
    writeMigration(workdir, '0000_init.sql');
    writeMigration(workdir, '0001_add_users.sql');
    writeMigration(workdir, '0002_add_attendance.sql');
    writeJournal(workdir, ['0000_init', '0001_add_users']);

    const result = runIn(workdir);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Journal does not list');
    expect(result.stdout).toContain('0002_add_attendance.sql');
  });

  it('warns about duplicate numeric prefixes', () => {
    writeMigration(workdir, '0000_init.sql');
    writeMigration(workdir, '0001_a.sql');
    writeMigration(workdir, '0001_b.sql');

    const result = runIn(workdir);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('duplicate prefix 0001');
  });

  it('errors when a migration file lacks the 4-digit prefix', () => {
    writeMigration(workdir, 'init.sql');

    const result = runIn(workdir);
    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).toContain('missing 4-digit prefix');
  });

  it('errors when no migrations exist', () => {
    // setupRepo created the directory but no files.
    const result = runIn(workdir);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('no SQL migrations');
  });
});
