import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const profilePage = readFileSync('app/dashboard/profile/page.tsx', 'utf8');
const employeesPage = readFileSync('app/dashboard/employees/page.tsx', 'utf8');
const employeesApi = readFileSync('app/api/employees/route.ts', 'utf8');
const pdfRoute = readFileSync('app/api/reports/pdf/route.ts', 'utf8');

describe('work duration payroll streak projection UI/API source contracts', () => {
  it('profile exposes work duration, payroll estimate, chicken streak, and raise disclaimer copy', () => {
    expect(profilePage).toContain('Tanggal mulai kerja');
    expect(profilePage).toContain('Masa kerja');
    expect(profilePage).toContain('Estimasi payroll');
    expect(profilePage).toContain('Estimasi diterima');
    expect(profilePage).toContain('Kalender Streak Ayam');
    expect(profilePage).toContain('🐔');
    expect(profilePage).toContain('Proyeksi kenaikan ini bersifat estimasi');
  });

  it('superadmin employee list exposes synced work duration and safe payroll summary', () => {
    expect(employeesPage).toContain('Tanggal mulai kerja');
    expect(employeesPage).toContain('Masa kerja');
    expect(employeesPage).toContain('payrollStatusSummary');
    expect(employeesApi).toContain('workDurationDays');
    expect(employeesApi).toContain("user.role === 'SUPERADMIN'");
  });

  it('pdf route remains protected and private-cacheable source guarded', () => {
    expect(pdfRoute).toContain('requireAuth');
    expect(pdfRoute).toMatch(/SUPERADMIN|REPORT/);
    expect(pdfRoute).toContain('no-store');
  });
});
