import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const profilePage = readFileSync('app/dashboard/profile/page.tsx', 'utf8');
const dashboardFiles = [
  'app/dashboard/page.tsx',
  'app/dashboard/layout.tsx',
  'src/components/layout/Sidebar.tsx',
  'components/layout/Sidebar.tsx',
].map((path) => readFileSync(path, 'utf8')).join('\n');

describe('account logout placement', () => {
  it('keeps the only visible logout action inside Akun/Profile', () => {
    expect(profilePage).toContain('Keluar');
    expect(profilePage).toContain('window.confirm("Keluar dari akun MyProdusen sekarang?")');
    expect(profilePage).toContain('await logout()');
    expect(dashboardFiles).not.toContain('<LogOut');
    expect(dashboardFiles).not.toContain('await logout()');
  });

  it('uses real controls for profile header icon actions', () => {
    expect(profilePage).toContain('aria-label="Kembali"');
    expect(profilePage).toContain('href="/dashboard/profile/about"');
  });
});
