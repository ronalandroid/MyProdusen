import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const source = readFileSync('app/register/page.tsx', 'utf8');

describe('register form source policy', () => {
  it('does not expose role selection or Leader option', () => {
    expect(source).not.toMatch(/name=["']role["']/i);
    expect(source).not.toMatch(/<select[^>]+role/i);
    expect(source).not.toMatch(/value=["']LEADER["']/i);
    expect(source).not.toMatch(/SUPERADMIN/);
  });

  it('shows employee-only assignment handoff message', () => {
    expect(source).toContain('Akun berhasil dibuat sebagai Karyawan. Superadmin akan menetapkan divisi, posisi, lokasi kerja, dan shift.');
  });
});
