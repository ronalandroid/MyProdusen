import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync('app/globals.css', 'utf8');
const dashboardLayout = readFileSync('app/dashboard/layout.tsx', 'utf8');
const sidebarSource = [
  readFileSync('components/layout/Sidebar.tsx', 'utf8'),
  readFileSync('src/components/layout/Sidebar.tsx', 'utf8'),
].join('\n');
const profilePage = readFileSync('app/dashboard/profile/page.tsx', 'utf8');

describe('mobile dashboard navigation layout', () => {
  it('keeps mobile bottom nav one-row, five-column, and safe-area aware', () => {
    expect(css).toContain('--mobile-bottom-nav-height: 76px');
    expect(css).toContain('max-height: calc(84px + env(safe-area-inset-bottom))');
    expect(css).toContain('grid-template-columns: repeat(5, minmax(0, 1fr))');
    expect(css).toContain('grid-auto-rows: 1fr');
    expect(css).toContain('overflow: hidden');
    expect(css).toContain('padding-bottom: calc(96px + env(safe-area-inset-bottom))');
    expect(css).toContain('scroll-padding-bottom: calc(96px + env(safe-area-inset-bottom))');
  });

  it('does not keep mascot, marketing copy, or logout helper inside nav source', () => {
    expect(sidebarSource).not.toContain('Kontrol penuh, operasional tertata');
    expect(sidebarSource).not.toContain('Logout tersedia di menu Akun');
    expect(sidebarSource).not.toContain('animate-chef-float');
    expect(sidebarSource).not.toContain('chicken');
    expect(sidebarSource).not.toContain('mascot');
  });

  it('hides skip link by default and reveals it only on focus', () => {
    expect(dashboardLayout).toContain('className="skip-link"');
    expect(css).toContain('clip-path: inset(50%)');
    expect(css).toContain('.skip-link:focus-visible');
    expect(css).toContain('clip-path: none');
  });

  it('uses sidebar from tablet upward and removes bottom nav there', () => {
    expect(css).toContain('@media (min-width: 768px)');
    expect(css).toContain('width: var(--tablet-sidebar-width)');
    expect(css).toContain('height: 100dvh');
    expect(css).toContain('bottom: auto');
    expect(css).toContain('flex-direction: column');
  });

  it('keeps real Akun logout button and confirmation copy', () => {
    expect(profilePage).toContain('Keluar');
    expect(profilePage).toContain('title="Anda yakin ingin keluar?"');
    expect(profilePage).toContain('await logout()');
    expect(profilePage).toContain('btn-danger-outline');
  });
});
