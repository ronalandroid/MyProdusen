import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const prd = readFileSync('docs/prd.md', 'utf8');
const ui = readFileSync('docs/UI_UX_GUIDE.md', 'utf8');
const security = readFileSync('docs/SECURITY.md', 'utf8');
const testing = readFileSync('docs/TESTING_QA.md', 'utf8');
const gamification = readFileSync('docs/gamification/README.md', 'utf8');
const employeeDashboard = readFileSync('src/components/dashboard/EmployeeBeranda.tsx', 'utf8');
const leaderDashboard = readFileSync('src/components/dashboard/LeaderBeranda.tsx', 'utf8');
const css = readFileSync('app/globals.css', 'utf8');

describe('professional gamification product contract', () => {
  it('documents professional scope, formula, projection, and role access', () => {
    expect(prd).toContain('Professional Gamification System');
    expect(prd).toContain('Attendance / Kehadiran: 30%');
    expect(prd).toContain('Production KPI: 50%');
    expect(prd).toContain('Behavior / Perilaku Kerja: 20%');
    expect(prd).toContain('Every new employee starts at 100');
    expect(prd).toContain('Formula: `score / 10`');
    expect(prd).toContain('maximum 3–5 visible');
    expect(gamification).toContain('Professional Gamification System');
  });

  it('documents UI constraints for professional, mobile-first gamification', () => {
    expect(ui).toContain('Gamification UI/UX Standard');
    expect(ui).toContain('professional HRIS first and fun motivation second');
    expect(ui).toContain('Minimum tap target: 44px');
    expect(ui).toContain('Streak calendar must fit 320px mobile width');
    expect(ui).toContain('Always respect `prefers-reduced-motion: reduce`');
  });

  it('documents RBAC and privacy boundaries', () => {
    expect(security).toContain('Professional Gamification RBAC');
    expect(security).toContain('Employee may read own score');
    expect(security).toContain('Leader cannot read team salary, payroll amount, payslip');
    expect(security).toContain('Cache-Control: no-store, private');
  });

  it('documents QA checklist for score, calendar, privacy, and no fake data', () => {
    expect(testing).toContain('Professional Gamification QA Checklist');
    expect(testing).toContain('Score formula 30/50/20');
    expect(testing).toContain('Badges are limited to 3–5 visible items');
    expect(testing).toContain('No fake/mock score');
  });

  it('keeps implementation aligned with simple gamification scope', () => {
    expect(employeeDashboard).toContain('Skor Performa Saya');
    expect(employeeDashboard).toContain('Kalender Streak Kehadiran');
    expect(employeeDashboard).toContain('Estimasi ini menunggu evaluasi dan persetujuan Superadmin.');
    expect(employeeDashboard).toContain('🐔');
    expect(employeeDashboard).not.toContain('["Skor 100 dipertahankan"');
    expect(leaderDashboard).not.toMatch(/salary|payrollAmount|gaji tim/i);
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
