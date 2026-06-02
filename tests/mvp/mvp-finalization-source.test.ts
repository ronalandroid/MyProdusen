import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');

const docs = [
  'README.md',
  'AGENTS.md',
  'docs/prd.md',
  'docs/UI_UX_GUIDE.md',
  'docs/DATABASE.md',
  'docs/SECURITY.md',
  'docs/TESTING_QA.md',
  'docs/FINAL_CHECKLIST.md',
  'docs/TEST_FIX_REPORT.md',
  'docs/CHANGELOG.md',
].map(read).join('\n');

const employeeDashboard = read('src/components/dashboard/EmployeeBeranda.tsx');
const leaderDashboard = read('src/components/dashboard/LeaderBeranda.tsx');
const dashboardPage = read('app/dashboard/page.tsx');
const attendanceRoutes = read('app/api/attendance/check-in/route.ts') + '\n' + read('app/api/attendance/check-out/route.ts');
const payrollSources = read('src/services/payroll/payroll.service.ts') + '\n' + read('src/services/payroll/simple-payroll.service.ts') + '\n' + read('app/api/payroll/me/route.ts') + '\n' + read('lib/payroll/access.ts');
const leaveSources = read('src/services/leave/leave.service.ts') + '\n' + read('features/leave/leave-balance.service.ts');
const kpiSources = read('app/api/leader/kpi-production/route.ts') + '\n' + read('src/services/leader/leader.service.ts');

describe('MyProdusen MVP finalization contract', () => {
  it('documents MVP scope and non-MVP postponements', () => {
    expect(docs).toContain('MyProdusen MVP Finalization Scope — Produsen Dimsum Medan');
    expect(docs).toContain('Absensi selfie + geotag/geofence');
    expect(docs).toContain('Payroll/gajian sederhana');
    expect(docs).toContain('KPI produksi sync');
    expect(docs).toContain('Pengajuan cuti + saldo cuti');
    expect(docs).toContain('Postponed/non-MVP');
    expect(docs).toContain('complex BPJS/tax automation');
    expect(docs).toContain('multi-company');
  });

  it('keeps attendance MVP backed by GPS, selfie, assigned shift/location, and no Superadmin normal CTA', () => {
    expect(attendanceRoutes).toMatch(/checkInSelfie|checkOutSelfie|selfie/i);
    expect(attendanceRoutes).toMatch(/latitude|longitude|gps/i);
    expect(attendanceRoutes).toMatch(/workLocation|defaultLocation|location/i);
    expect(attendanceRoutes).toMatch(/shift|defaultShift/i);
    expect(attendanceRoutes).toContain("user.role !== 'EMPLOYEE' && user.role !== 'LEADER'");
    const superadminBranch = dashboardPage.slice(dashboardPage.indexOf('stats.role === "SUPERADMIN"'));
    expect(superadminBranch).not.toMatch(/Clock In|Clock Out/);
    expect(employeeDashboard).toMatch(/Clock In|Clock Out|Absensi/i);
  });

  it('keeps payroll own-only and leader team payroll private', () => {
    expect(payrollSources).toMatch(/employeeId|employee\.id/);
    expect(payrollSources).toMatch(/SUPERADMIN/);
    expect(payrollSources).toMatch(/no-store|private/i);
    expect(leaderDashboard).not.toMatch(/salary|payrollAmount|team payroll|gaji tim/i);
    expect(docs).toContain('Leader cannot see assigned-team salary');
  });

  it('keeps KPI production scoped to leader assigned team and no default self-KPI input', () => {
    expect(kpiSources).toMatch(/LEADER/);
    expect(kpiSources).toMatch(/team|assignment|assigned/i);
    expect(kpiSources).toMatch(/ALLOW_LEADER_SELF_KPI_INPUT/);
    expect(leaderDashboard).toMatch(/KPI|Produksi|Team/i);
  });

  it('keeps leave overlap, insufficient balance code, and append-only ledger contract', () => {
    expect(leaveSources).toContain('LEAVE_BALANCE_INSUFFICIENT');
    expect(leaveSources).toMatch(/overlap/i);
    expect(leaveSources).toMatch(/ledger|LeaveBalanceLedger/i);
    expect(docs).toContain('append-only ledger');
  });
});
