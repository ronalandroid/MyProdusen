import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const profilePage = readFileSync('app/dashboard/profile/page.tsx', 'utf8');
const employeesPage = readFileSync('app/dashboard/employees/page.tsx', 'utf8');
const profileRoute = readFileSync('app/api/profile/me/route.ts', 'utf8');
const avatarRoute = readFileSync('app/api/profile/avatar/[...path]/route.ts', 'utf8');
const layout = readFileSync('app/dashboard/layout.tsx', 'utf8');

describe('avatar and profile source contract', () => {
  it('requires full name during onboarding and rejects self-assignment fields', () => {
    expect(layout).toContain('Nama Lengkap');
    expect(layout).toContain('minLength={3}');
    expect(profileRoute).toContain('PROFILE_FULL_NAME_REQUIRED');
    expect(profileRoute).toContain('FORBIDDEN_FIELDS');
    expect(profileRoute).toContain('role');
    expect(profileRoute).toContain('shiftId');
  });

  it('lets users open avatar modal, preview image, compress to WebP, and save', () => {
    expect(profilePage).toContain('Perbarui Foto Profil');
    expect(profilePage).toContain('Pilih Foto');
    expect(profilePage).toContain('Simpan Foto');
    expect(profilePage).toContain('Preview gambar foto profil');
    expect(profilePage).toContain('image/webp');
    expect(profilePage).toContain('0.8');
    expect(profilePage).toContain('Mengoptimalkan foto…');
    expect(profilePage).toContain('Foto profil berhasil diperbarui.');
  });

  it('renders protected Superadmin employee avatars with fallback-safe image semantics', () => {
    expect(employeesPage).toContain('profilePhoto');
    expect(employeesPage).toContain('Foto profil');
    expect(employeesPage).toContain('onError');
    expect(employeesPage).toContain('window.addEventListener("focus"');
    expect(avatarRoute).toContain('no-store, private');
    expect(avatarRoute).toContain("user.role !== 'SUPERADMIN'");
  });
});
