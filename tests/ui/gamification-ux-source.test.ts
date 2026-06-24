import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const employeeDashboard = readFileSync('src/components/dashboard/EmployeeBeranda.tsx', 'utf8');
const superadminDashboard = readFileSync('features/dashboard/SuperadminDashboard.tsx', 'utf8');
const leaderDashboard = readFileSync('src/components/dashboard/LeaderBeranda.tsx', 'utf8');
const css = readFileSync('app/globals.css', 'utf8');

describe('gamification UX source contract', () => {
  it('renders employee score card with weighted breakdown and raise disclaimer', () => {
    expect(employeeDashboard).toContain('Skor Performa Saya');
    expect(employeeDashboard).toContain('Kehadiran 30%');
    expect(employeeDashboard).toContain('KPI Produksi 50%');
    expect(employeeDashboard).toContain('Perilaku Kerja 20%');
    expect(employeeDashboard).toContain('Estimasi kenaikan:');
    expect(employeeDashboard).toContain('Estimasi ini menunggu evaluasi dan persetujuan Superadmin.');
  });

  it('renders attendance streak calendar with chicken marker and today highlight', () => {
    expect(employeeDashboard).toContain('Kalender Streak Kehadiran');
    expect(employeeDashboard).toContain('data-testid="attendance-streak-calendar"');
    expect(employeeDashboard).toContain('chicken-day-marker');
    expect(employeeDashboard).toContain('streak-day-today');
    expect(employeeDashboard).toContain('🐔');
  });

  it('shows distinct attendance states and badges without payroll leakage', () => {
    expect(employeeDashboard).toContain('LEAVE');
    expect(employeeDashboard).toContain('OFF');
    expect(employeeDashboard).toContain('ABSENT');
    expect(employeeDashboard).toContain('7 hari hadir');
    expect(employeeDashboard).toContain('KPI target tercapai');
    expect(employeeDashboard).not.toContain('["Skor 100 dipertahankan"');
    expect(leaderDashboard).not.toMatch(/salary|gaji|payrollAmount/i);
  });

  it('supports reduced motion for gamification animations', () => {
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('.streak-day-attended');
    expect(css).toContain('.badge-unlock-shimmer');
  });

  it('keeps superadmin analytics separated from normal clock action', () => {
    expect(superadminDashboard).toContain('Company Quest Board');
    expect(superadminDashboard).toContain('Top & At-Risk Employees');
    expect(superadminDashboard).not.toContain('Clock In');
    expect(superadminDashboard).not.toContain('Clock Out');
  });
});
