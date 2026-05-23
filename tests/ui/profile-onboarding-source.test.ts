import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const layoutSource = readFileSync('app/dashboard/layout.tsx', 'utf8');
const profileRouteSource = readFileSync('app/api/profile/me/route.ts', 'utf8');

describe('profile onboarding source policy', () => {
  it('shows mandatory personal-data modal with logout only escape', () => {
    expect(layoutSource).toContain('Lengkapi Data Pribadi');
    expect(layoutSource).toContain('Nomor HP');
    expect(layoutSource).toContain('Alamat lengkap');
    expect(layoutSource).toContain('Simpan Data');
    expect(layoutSource).toContain('Keluar');
    expect(layoutSource).not.toContain('aria-label="Tutup"');
  });

  it('shows assignment status cards without raw null labels', () => {
    expect(layoutSource).toContain('Divisi belum ditetapkan. Hubungi Superadmin.');
    expect(layoutSource).toContain('Posisi belum ditetapkan. Hubungi Superadmin.');
    expect(layoutSource).toContain('Lokasi kerja belum tersedia. Hubungi Superadmin.');
    expect(layoutSource).toContain('Shift belum tersedia. Hubungi Superadmin.');
    expect(layoutSource).toContain('Anda belum ditetapkan ke tim. Hubungi Superadmin.');
  });

  it('forbids self-assignment fields in profile update API', () => {
    expect(profileRouteSource).toContain("'role'");
    expect(profileRouteSource).toContain("'teamId'");
    expect(profileRouteSource).toContain("'division'");
    expect(profileRouteSource).toContain("'position'");
    expect(profileRouteSource).toContain("'defaultLocationId'");
    expect(profileRouteSource).toContain("'defaultShiftId'");
    expect(profileRouteSource).toContain('PROFILE_UPDATE_FORBIDDEN_FIELD');
  });
});
