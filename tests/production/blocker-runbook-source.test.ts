import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

const runbookPath = 'docs/PRODUCTION_BLOCKER_RUNBOOK.md';
const drillScriptPath = 'scripts/backup-restore-drill.sh';

describe('production blocker runbook', () => {
  it('documents evidence gates that cannot be faked by automation', () => {
    expect(existsSync(runbookPath)).toBe(true);
    const runbook = readFileSync(runbookPath, 'utf8');
    expect(runbook).toContain('Real-device GPS + selfie UAT');
    expect(runbook).toContain('Payroll policy owner approval');
    expect(runbook).toContain('Backup/restore drill');
    expect(runbook).toContain('authenticated Superadmin E2E passed');
    expect(runbook).toContain('Android real-device GPS+selfie passed');
    expect(runbook).toContain('iPhone real-device GPS+selfie passed');
  });

  it('provides guarded backup drill helper and npm script', () => {
    expect(existsSync(drillScriptPath)).toBe(true);
    const script = readFileSync(drillScriptPath, 'utf8');
    const pkg = readFileSync('package.json', 'utf8');
    expect(script).toContain('STAGING_RESTORE_DATABASE_URL');
    expect(script).toContain('DRILL_CONFIRM=RESTORE_TO_STAGING');
    expect(script).toContain('Refusing restore');
    expect(pkg).toContain('"backup:drill": "bash scripts/backup-restore-drill.sh"');
  });
});
