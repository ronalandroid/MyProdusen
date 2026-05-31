import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const sidebar = readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

describe('sidebar brand contrast source contract', () => {
  it('does not use primary yellow text for Produsen inside yellow brand card', () => {
    expect(sidebar).toContain('My<span');
    expect(sidebar).toContain('text-[#1f2937]');
    expect(sidebar).toContain('text-[#6b3f00]');
    expect(sidebar).not.toContain('My<span className="text-[var(--primary)]">Produsen</span>');
  });

  it('renders readable Super Admin badge and keeps nav items', () => {
    expect(sidebar).toContain('bg-[#fffdf2]');
    expect(sidebar).toContain('text-[#3f2a00]');
    expect(sidebar).toContain('Super Admin');
    expect(sidebar).toContain('navItems.map');
  });
});
