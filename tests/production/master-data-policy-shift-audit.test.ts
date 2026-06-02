import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const schema = readFileSync('drizzle/schema.ts', 'utf8');
const audit = readFileSync('docs/MASTER_DATA_POLICY_SHIFT_PRODUCTION_AUDIT.md', 'utf8');

function routeExists(path: string) {
  return existsSync(path);
}

describe('master data policy shift production audit', () => {
  it('documents division normalization resolved through TBM payroll master data', () => {
    expect(schema).toContain("division: text('division')");
    expect(schema).toContain("divisionId: text('divisionId')");
    expect(schema).toContain("pgTable('Division'");
    expect(routeExists('app/api/payroll/tbm/divisions/route.ts')).toBe(true);
    expect(audit).toContain('Division master data is normalized through TBM payroll settings.');
  });

  it('documents position workflow resolved through TBM payroll master data', () => {
    expect(schema).toContain("export const positions = pgTable('Position'");
    expect(schema).toContain("positionId: text('positionId')");
    expect(routeExists('app/api/payroll/tbm/positions/route.ts')).toBe(true);
    expect(audit).toContain('Position workflow is available through TBM payroll settings.');
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
