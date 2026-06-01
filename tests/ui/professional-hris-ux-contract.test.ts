import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const globals = readFileSync('app/globals.css', 'utf8');
const employeeDashboard = readFileSync('src/components/dashboard/EmployeeBeranda.tsx', 'utf8');
const leaderDashboard = readFileSync('src/components/dashboard/LeaderBeranda.tsx', 'utf8');
const prd = readFileSync('docs/prd.md', 'utf8');

describe('professional HRIS UX source contract', () => {
  it('defines warm SaaS HRIS design tokens inspired by professional HR platforms', () => {
    expect(globals).toContain('--surface-warm: #FAF9F6');
    expect(globals).toContain('--border-warm: #DED7C7');
    expect(globals).toContain('--action-blue: #1D4ED8');
    expect(globals).toContain('--status-present');
    expect(globals).toContain('--status-pending');
    expect(globals).toContain('--status-critical');
    expect(globals).toContain('--focus-ring: 0 0 0 4px rgba(253, 199, 4, 0.26)');
  });

  it('upgrades cards buttons inputs and status chips for consistent mobile-first SaaS polish', () => {
    expect(globals).toContain('background: linear-gradient(180deg, var(--surface-raised), var(--bg-card))');
    expect(globals).toContain('box-shadow: var(--shadow-card)');
    expect(globals).toContain('transform: translateY(-1px) scale(1.01)');
    expect(globals).toContain('.status-chip');
    expect(globals).toContain('.approval-timeline');
    expect(globals).toContain('.metric-card');
    expect(globals).toContain('.professional-hero');
    expect(globals).toContain('min-height: 44px');
  });

  it('dashboard attendance copy matches map-first flow, not direct selfie wording', () => {
    for (const source of [employeeDashboard, leaderDashboard]) {
      expect(source).toContain('Validasi lokasi dulu, lalu ambil selfie realtime.');
      expect(source).not.toContain('Selfie dan GPS akan terbuka langsung');
      expect(source).toContain('/dashboard/attendance/clock?type=clock-in');
      expect(source).toContain('/dashboard/attendance/clock?type=clock-out');
    }
  });

  it('PRD captures Talenta-style professional UX principles synced across project features', () => {
    expect(prd).toContain('Talenta-style professional HRIS UX principles');
    expect(prd).toContain('Today-first dashboard');
    expect(prd).toContain('Admin flows as checklist');
    expect(prd).toContain('Tables on desktop, cards on mobile');
    expect(prd).toContain('status chips');
    expect(prd).toContain('approval timeline');
    expect(prd).toContain('payroll checklist');
  });
});
