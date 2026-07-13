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

  it('communicates instant activation instead of the old approval handoff', () => {
    expect(source).toContain('Akun Anda langsung aktif! Silakan masuk dan mulai absen hari ini juga.');
    expect(source).not.toContain('Superadmin akan menetapkan divisi, posisi, lokasi kerja, dan shift.');
    expect(source).not.toContain('status nonaktif sampai disetujui');
  });

  it('lets the newcomer self-fill workplace identity (never the system role)', () => {
    expect(source).toMatch(/name=["']fullName["']/);
    expect(source).toMatch(/name=["']division["']/);
    expect(source).toMatch(/name=["']position["']/);
    expect(source).toMatch(/name=["']supervisorId["']/);
    expect(source).toContain('/api/auth/register-options');
  });
});
