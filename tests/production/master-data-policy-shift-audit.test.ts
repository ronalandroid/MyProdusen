import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const schema = readFileSync('drizzle/schema.ts', 'utf8');
const audit = readFileSync('docs/MASTER_DATA_POLICY_SHIFT_PRODUCTION_AUDIT.md', 'utf8');

function routeExists(path: string) {
  return existsSync(path);
}

describe('master data policy shift production audit', () => {
  it('documents remaining division normalization blocker before production signoff', () => {
    expect(schema).toContain("division: text('division')");
    expect(schema).toContain("divisionId: text('divisionId')");
    expect(schema).not.toContain("pgTable('Division'");
    expect(routeExists('app/api/divisions/route.ts')).toBe(false);
    expect(audit).toContain('Division master data is not normalized.');
    expect(audit).toContain('No `/api/divisions` master-data workflow found.');
  });

  it('documents position workflow gap without changing schema', () => {
    expect(schema).toContain("export const positions = pgTable('Position'");
    expect(schema).toContain("positionId: text('positionId')");
    expect(routeExists('app/api/positions/route.ts')).toBe(false);
    expect(audit).toContain('Position workflow is schema-only.');
  });

  it('keeps existing team, shift, policy, calendar, and payroll workflow surface visible', () => {
    expect(schema).toContain("export const teams = pgTable('Team'");
    expect(schema).toContain("export const shifts = pgTable('Shift'");
    expect(schema).toContain("export const attendancePolicies = pgTable('AttendancePolicy'");
    expect(schema).toContain("export const workCalendarDays = pgTable('WorkCalendarDay'");
    expect(schema).toContain("export const payrollRules = pgTable('PayrollRule'");
    expect(routeExists('app/api/teams/route.ts')).toBe(true);
    expect(routeExists('app/api/shifts/route.ts')).toBe(true);
    expect(routeExists('app/api/attendance/policies/route.ts')).toBe(true);
    expect(routeExists('app/api/work-calendar/route.ts')).toBe(true);
    expect(routeExists('app/api/payroll/rules/route.ts')).toBe(true);
  });
});
