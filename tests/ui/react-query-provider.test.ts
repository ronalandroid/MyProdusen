import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const providers = readFileSync('app/providers.tsx', 'utf8');
const rootLayout = readFileSync('app/layout.tsx', 'utf8');
const employeeBeranda = readFileSync('src/components/dashboard/EmployeeBeranda.tsx', 'utf8');

describe('React Query provider wiring (dashboard crash regression)', () => {
  it('exposes a client-side QueryClientProvider with a stable client', () => {
    // Must be a client component so hooks work in the browser.
    expect(providers).toMatch(/^["']use client["'];/);
    expect(providers).toContain('QueryClientProvider');
    expect(providers).toContain('new QueryClient');
    // Stable client: created once via useState initializer, never per-render.
    expect(providers).toMatch(/useState\(\s*\(\)\s*=>\s*\n?\s*new QueryClient/);
    // Guard against the anti-pattern of constructing the client inline in JSX.
    expect(providers).not.toMatch(/client=\{new QueryClient/);
  });

  it('wraps the whole app (incl. dashboard) with the provider at the root layout', () => {
    expect(rootLayout).toContain('import Providers from "./providers"');
    expect(rootLayout).toContain('<Providers>');
    expect(rootLayout).toContain('</Providers>');
    // children must render inside the provider.
    const open = rootLayout.indexOf('<Providers>');
    const close = rootLayout.indexOf('</Providers>');
    const childrenIdx = rootLayout.indexOf('{children}');
    expect(open).toBeGreaterThan(-1);
    expect(close).toBeGreaterThan(open);
    expect(childrenIdx).toBeGreaterThan(open);
    expect(childrenIdx).toBeLessThan(close);
  });

  it('dashboard widget that uses React Query hooks is covered by the provider', () => {
    // EmployeeBeranda calls useQuery; without the root provider it throws
    // "No QueryClient set". This test ties the consumer to the provider fix.
    expect(employeeBeranda).toContain("from \"@tanstack/react-query\"");
    expect(employeeBeranda).toContain('useQuery');
    // Safe rendering: data is read with null guards so a failed/empty query
    // never crashes the dashboard.
    expect(employeeBeranda).toContain('dashboardData?.heatmap ?? emptyHeatmap');
    expect(employeeBeranda).toContain('dashboardError instanceof Error');
  });
});
