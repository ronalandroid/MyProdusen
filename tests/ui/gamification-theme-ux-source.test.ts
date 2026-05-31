import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const dashboard = readFileSync('app/dashboard/page.tsx', 'utf8');
const leader = readFileSync('src/components/dashboard/LeaderBeranda.tsx', 'utf8');
const settings = readFileSync('app/dashboard/settings/page.tsx', 'utf8');
const globals = readFileSync('app/globals.css', 'utf8');

describe('gamification, theme, and optimistic UX source safeguards', () => {
  it('renders gamification surfaces for leader and superadmin screens', () => {
    expect(dashboard).toContain('SuperadminGamificationHub');
    expect(dashboard).toContain('Company Quest Board');
    expect(leader).toContain('Leader Quest Board');
    expect(globals).toContain('.gamification-hub');
    expect(globals).toContain('.progress-track');
  });

  it('keeps theme color wheel in superadmin settings', () => {
    expect(settings).toContain('theme-color-wheel-panel');
    expect(settings).toContain('type="color"');
    expect(settings).toContain('Theme color wheel');
    expect(globals).toContain('conic-gradient(red, yellow, lime, cyan, blue, magenta, red)');
  });

  it('keeps skeleton/progress/optimistic UX primitives in source', () => {
    expect(globals).toContain('.skeleton-card');
    expect(globals).toContain('@keyframes skeleton-shimmer');
    expect(leader).toContain('setKpiRows((previousRows)');
    expect(leader).toContain('Progress leaderboard diperbarui');
  });
});
