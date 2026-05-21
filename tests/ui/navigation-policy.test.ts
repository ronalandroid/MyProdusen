import { describe, expect, it } from 'vitest';
import { getPrimaryNavigationForRole } from '@/lib/navigation/role-navigation';

describe('responsive primary navigation policy', () => {
  it('keeps Superadmin mobile nav to five items', () => {
    expect(getPrimaryNavigationForRole('SUPERADMIN').map((item) => item.name)).toEqual([
      'Beranda',
      'Cabang',
      'Approval',
      'Pengguna',
      'Akun',
    ]);
  });

  it('keeps Employee mobile nav to five items', () => {
    expect(getPrimaryNavigationForRole('EMPLOYEE').map((item) => item.name)).toEqual([
      'Beranda',
      'Absensi',
      'Cuti',
      'KPI',
      'Akun',
    ]);
  });
});
