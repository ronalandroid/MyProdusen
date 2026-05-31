import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

describe('gamification API route security source contracts', () => {
  it('wires high-risk settings and score override endpoints to audited handlers', () => {
    expect(read('app/api/settings/gamification/route.ts')).toContain('patchSettings');
    expect(read('app/api/settings/theme/route.ts')).toContain('patchTheme');
    expect(read('app/api/leader/performance/leader-score/route.ts')).toContain('leaderScore');
    expect(read('app/api/performance/scores/[employeeId]/override/route.ts')).toContain('overrideScore');
    const api = read('lib/gamification/api.ts');
    expect(api).toContain("logAudit(user.userId, 'UPDATE', 'GamificationSetting'");
    expect(api).toContain("logAudit(user.userId, 'UPDATE', 'CompanyThemeSetting'");
    expect(api).toContain("logAudit(user.userId, 'OVERRIDE', 'PerformanceScoreSummary'");
    expect(api).toContain("logAudit(user.userId, 'CREATE', 'LeaderScoreEntry'");
  });

  it('keeps leader score RBAC and private response no-store contracts', () => {
    const api = read('lib/gamification/api.ts');
    const response = read('lib/utils/response.ts');
    expect(api).toContain("if (!isLeader(user.role)) return forbiddenResponse()");
    expect(api).toContain("target.supervisorId !== leader.id");
    expect(api).toContain("target.id === leader.id");
    expect(api).toContain('validateRetroactiveScoreDate');
    expect(response).toContain('Cache-Control');
    expect(response).toContain('no-store');
  });
});
