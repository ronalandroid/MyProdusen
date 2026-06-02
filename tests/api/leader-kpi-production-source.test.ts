import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const route = readFileSync('app/api/leader/kpi-production/route.ts', 'utf8');
const service = readFileSync('src/services/leader/leader.service.ts', 'utf8');

describe('leader KPI production RBAC source contract', () => {
  it('accepts authenticated LEADER only and supports entries/direct array/single object payloads', () => {
    expect(route).toContain("user.role !== 'LEADER'");
    expect(route).toContain('Array.isArray(body)');
    expect(route).toContain('Array.isArray(body.entries)');
    expect(route).toContain('[body]');
  });

  it('normalizes employee user id to employee profile id without weakening team scope', () => {
    expect(service).toMatch(/employees\.id} = \$\{data\.employeeId\} OR \$\{employees\.userId\} = \$\{data\.employeeId\}/);
    expect(service).toContain('targetEmployee.id');
    expect(service).toContain('canonicalTeamId');
    expect(service).toContain('assignedRows.some');
    expect(service).toContain('this.requireLeaderTeam(leaderUserId, teamId)');
  });

  it('keeps outside-team and self-KPI blocked by default', () => {
    expect(service).toContain('EMPLOYEE_NOT_IN_LEADER_TEAM');
    expect(service).toContain("process.env.ALLOW_LEADER_SELF_KPI_INPUT !== 'true'");
    expect(service).toContain('Leader tidak dapat menginput KPI sendiri');
    expect(service).toContain('getLeaderEmployeeId');
    expect(service).toContain("process.env.ALLOW_LEADER_SELF_KPI_INPUT === 'true' ? null : await this.getLeaderEmployeeId(leaderUserId)");
    expect(service).toContain('sql`${employees.id} <> ${leaderEmployeeId}`');
  });

  it('supports packs alias while preserving quantity validation', () => {
    expect(service).toContain('data.quantity ?? data.packs');
    expect(service).toContain('KPI_QUANTITY_INVALID');
  });
});
