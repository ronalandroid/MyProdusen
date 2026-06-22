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
    expect(read('app/api/performance/culture-score/route.ts')).toContain('cultureScore');
    expect(read('app/api/performance/culture-score/anomalies/route.ts')).toContain('anomalies');
    expect(read('app/api/performance/scores/[employeeId]/override/route.ts')).toContain('overrideScore');
    const api = read('lib/gamification/api.ts');
    expect(api).toContain("logAudit(user.userId, 'UPDATE', 'GamificationSetting'");
    expect(api).toContain("logAudit(user.userId, 'UPDATE', 'CompanyThemeSetting'");
    expect(api).toContain("logAudit(user.userId, 'OVERRIDE', 'PerformanceScoreSummary'");
    expect(api).toContain('CULTURE_SCORE_SUBMITTED');
  });

  it('keeps leader score RBAC and private response no-store contracts', () => {
    const api = read('lib/gamification/api.ts');
    const response = read('src/utils/response.ts');
    expect(api).toContain("!isLeader(user.role) && !isSuperadmin(user.role)");
    expect(api).toContain("target.supervisorId !== reviewer.id");
    expect(api).toContain("target.id === reviewer.id");
    expect(api).toContain('Leader tidak dapat override nilai final Superadmin');
    expect(api).toContain('validateRetroactiveScoreDate');
    expect(response).toContain('Cache-Control');
    expect(response).toContain('no-store');
  });
});
