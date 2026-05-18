import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';

const legacySelfieRoute = readFileSync('app/api/attendance/selfie/[...path]/route.ts', 'utf8');
const schema = readFileSync('drizzle/schema.ts', 'utf8');

describe('sensitive source hardening', () => {
  it('legacy selfie route uses no-store and audits successful privileged access', () => {
    expect(legacySelfieRoute).toContain("'Cache-Control': 'no-store, private'");
    expect(legacySelfieRoute).toContain("'SELFIE_VIEW'");
    expect(legacySelfieRoute).toContain('viewerRole: user.role');
  });

  it('schema declares required report/security indexes', () => {
    expect(schema).toContain("index('Employee_division_idx')");
    expect(schema).toContain("index('Employee_status_idx')");
    expect(schema).toContain("index('Attendance_check_in_geo_status_idx')");
    expect(schema).toContain("index('Attendance_check_out_geo_status_idx')");
    expect(schema).toContain("index('PayrollItem_employeeId_idx')");
    expect(schema).toContain("index('PayrollRun_period_idx')");
    expect(schema).toContain("index('KpiResult_employeeId_idx')");
    expect(schema).toContain("index('AuditLog_createdAt_idx')");
  });
});
