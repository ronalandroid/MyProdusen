import { describe, expect, it } from 'vitest';
import { buildDashboardActions } from '@/lib/dashboard/action-cards';

describe('buildDashboardActions', () => {
  it('prioritizes HR action queues for Superadmin and Admin HR', () => {
    const actions = buildDashboardActions('ADMIN_HR', {
      pendingLeaves: 3,
      pendingKpiApprovals: 2,
      lateToday: 1,
      absentToday: 4,
      unreadNotifications: 5,
    });

    expect(actions.map((action) => action.label)).toEqual([
      'Cuti Menunggu',
      'KPI Menunggu Review',
      'Karyawan Terlambat',
      'Karyawan Absen',
      'Notifikasi Belum Dibaca',
    ]);
    expect(actions[0]).toMatchObject({ href: '/dashboard/leave?status=PENDING', tone: 'warning' });
  });

  it('keeps employee dashboard focused on personal daily work', () => {
    const actions = buildDashboardActions('EMPLOYEE', {
      pendingLeaves: 1,
      pendingKpiApprovals: 9,
      lateToday: 2,
      absentToday: 3,
      unreadNotifications: 0,
    });

    expect(actions.map((action) => action.label)).toEqual([
      'Absensi Saya',
      'Pengajuan Saya',
      'KPI Saya',
    ]);
  });
});
