import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const css = readFileSync('app/globals.css', 'utf8');
const sidebarSource = [
  readFileSync('components/layout/Sidebar.tsx', 'utf8'),
  readFileSync('src/components/layout/Sidebar.tsx', 'utf8'),
].join('\n');
const layoutSource = readFileSync('app/dashboard/layout.tsx', 'utf8');
const profileSource = readFileSync('app/dashboard/profile/page.tsx', 'utf8');

test.describe('mobile dashboard navigation policy source guard', () => {
  test('phone bottom nav is one row, five items, and safe-area aware', async () => {
    expect(css).toContain('grid-template-columns: repeat(5, minmax(0, 1fr))');
    expect(css).toContain('grid-auto-rows: 1fr');
    expect(css).toContain('--mobile-bottom-nav-height: 76px');
    expect(css).toContain('max-height: calc(84px + env(safe-area-inset-bottom))');
    expect(css).toContain('padding-bottom: calc(96px + env(safe-area-inset-bottom))');
  });

  test('nav source has no mascot or helper copy', async () => {
    expect(sidebarSource).not.toContain('Kontrol penuh');
    expect(sidebarSource).not.toContain('Logout tersedia');
    expect(sidebarSource).not.toContain('mascot');
    expect(sidebarSource).not.toContain('chicken');
  });

  test('skip link hidden by default and logout remains in Akun', async () => {
    expect(layoutSource).toContain('className="skip-link"');
    expect(css).toContain('clip-path: inset(50%)');
    expect(css).toContain('.skip-link:focus-visible');
    expect(profileSource).toContain('Keluar');
    expect(profileSource).toContain('title="Anda yakin ingin keluar?"');
    expect(profileSource).toContain('await logout()');
  });

  test('tablet and desktop use sidebar instead of bottom nav', async () => {
    expect(css).toContain('@media (min-width: 768px)');
    expect(css).toContain('width: var(--tablet-sidebar-width)');
    expect(css).toContain('bottom: auto');
    expect(css).toContain('height: 100dvh');
  });
});
