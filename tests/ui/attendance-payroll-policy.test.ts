import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const settingsPageSource = readFileSync('app/dashboard/settings/page.tsx', 'utf8');
const employeeBerandaSource = readFileSync('src/components/dashboard/EmployeeBeranda.tsx', 'utf8');
const leaderBerandaSource = readFileSync('src/components/dashboard/LeaderBeranda.tsx', 'utf8');
const navigationSource = readFileSync('lib/navigation/role-navigation.ts', 'utf8');
const cameraSource = readFileSync('src/components/attendance/RealtimeSelfieCamera.tsx', 'utf8');

describe('Attendance and Payroll Policy UI UX contract safeguards', () => {
  it('implements attendance policy settings controls', () => {
    expect(settingsPageSource).toContain('graceMinutes');
    expect(settingsPageSource).toContain('geofenceRadiusMeters');
    expect(settingsPageSource).toContain('lateTier1Deduction');
    expect(settingsPageSource).toContain('lateTier2Deduction');
    expect(settingsPageSource).toContain('halfDayAfterMinutes');
    expect(settingsPageSource).toContain('halfDayPayFactor');
    expect(settingsPageSource).toContain('payrollSyncEnabled');
    expect(settingsPageSource).toContain('Kebijakan potongan gaji wajib mengikuti aturan perusahaan yang berlaku.');
  });

  it('implements work calendar and custom holiday multipliers', () => {
    expect(settingsPageSource).toContain('payMultiplier');
    expect(settingsPageSource).toContain('isPaidHoliday');
    expect(settingsPageSource).toContain('COMPANY_HOLIDAY');
    expect(settingsPageSource).toContain('SPECIAL_WORKDAY');
    expect(settingsPageSource).toContain('x Gaji Jika Masuk');
  });

  it('wires Clock In and Clock Out buttons to launch selfie camera flows directly', () => {
    expect(employeeBerandaSource).toContain('/dashboard/attendance?action=check-in');
    expect(employeeBerandaSource).toContain('/dashboard/attendance?action=check-out');
    expect(leaderBerandaSource).toContain('/dashboard/attendance?action=check-in');
    expect(leaderBerandaSource).toContain('/dashboard/attendance?action=check-out');
  });

  it('supports camera auto-start properties', () => {
    expect(cameraSource).toContain('autoStart');
    expect(cameraSource).toContain('autoStart, disabled, capturedPreviewUrl');
  });

  it('registers settings in the navigation policy securely', () => {
    expect(navigationSource).toContain('/dashboard/settings');
    expect(navigationSource).toContain("'settings', name: 'Kebijakan'");
  });
});
