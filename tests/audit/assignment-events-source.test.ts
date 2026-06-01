import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

function read(path: string) {
  return readFileSync(path, 'utf8');
}

describe('assignment audit source contract', () => {
  it('audits leader and employee team assignment mutations', () => {
    const source = read('src/services/leader/leader.service.ts');

    expect(source).toContain("import { logAudit } from '@/lib/audit';");
    expect(source).toContain("logAudit(actorUserId, 'LEADER_ASSIGNMENT_CREATE', 'LeaderAssignment'");
    expect(source).toContain("logAudit(actorUserId, 'LEADER_ASSIGNMENT_UPDATE', 'LeaderAssignment'");
    expect(source).toContain("logAudit(actorUserId, 'EMPLOYEE_TEAM_ASSIGNMENT_CREATE', 'EmployeeTeamAssignment'");
    expect(source).toContain("logAudit(actorUserId, 'EMPLOYEE_TEAM_ASSIGNMENT_UPDATE', 'EmployeeTeamAssignment'");
  });

  it('keeps user notifications scoped to target user id', () => {
    const source = read('lib/notifications/dispatch.ts');

    expect(source).toContain('let targetUserId = payload.userId;');
    expect(source).toContain('targetUserId = employee?.userId;');
    expect(source).toContain('userId: targetUserId,');
    expect(source).toContain("scope: 'user'");
    expect(source).toContain('target: targetUserId');
  });
});
