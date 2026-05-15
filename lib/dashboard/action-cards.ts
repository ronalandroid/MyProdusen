import type { UserRole } from '@/lib/permissions';

export type DashboardActionTone = 'primary' | 'warning' | 'danger' | 'info' | 'success';

export interface DashboardActionInput {
  pendingLeaves: number;
  pendingKpiApprovals: number;
  lateToday: number;
  absentToday: number;
  unreadNotifications: number;
}

export interface DashboardActionCard {
  label: string;
  value: number | string;
  href: string;
  tone: DashboardActionTone;
  description: string;
}

export function buildDashboardActions(role: UserRole, input: DashboardActionInput): DashboardActionCard[] {
  if (role === 'EMPLOYEE') {
    return [
      {
        label: 'Absensi Saya',
        value: 'Hari ini',
        href: '/dashboard/attendance',
        tone: 'primary',
        description: 'Check-in, check-out, dan riwayat kehadiran pribadi.',
      },
      {
        label: 'Pengajuan Saya',
        value: input.pendingLeaves,
        href: '/dashboard/leave',
        tone: input.pendingLeaves > 0 ? 'warning' : 'success',
        description: 'Pantau status cuti, sakit, dan izin pribadi.',
      },
      {
        label: 'KPI Saya',
        value: 'Lihat',
        href: '/dashboard/kpi',
        tone: 'info',
        description: 'Lihat KPI dan hasil penilaian periode berjalan.',
      },
    ];
  }

  return [
    {
      label: 'Cuti Menunggu',
      value: input.pendingLeaves,
      href: '/dashboard/leave?status=PENDING',
      tone: input.pendingLeaves > 0 ? 'warning' : 'success',
      description: 'Pengajuan cuti/sakit/izin perlu keputusan.',
    },
    {
      label: 'KPI Menunggu Review',
      value: input.pendingKpiApprovals,
      href: '/dashboard/kpi?status=pending',
      tone: input.pendingKpiApprovals > 0 ? 'warning' : 'success',
      description: 'Hasil KPI periode ini belum disetujui.',
    },
    {
      label: 'Karyawan Terlambat',
      value: input.lateToday,
      href: '/dashboard/attendance?status=LATE',
      tone: input.lateToday > 0 ? 'danger' : 'success',
      description: 'Karyawan terlambat hari ini.',
    },
    {
      label: 'Karyawan Absen',
      value: input.absentToday,
      href: '/dashboard/attendance?status=ABSENT',
      tone: input.absentToday > 0 ? 'danger' : 'success',
      description: 'Karyawan aktif belum tercatat hadir atau cuti.',
    },
    {
      label: 'Notifikasi Belum Dibaca',
      value: input.unreadNotifications,
      href: '/dashboard/notifications',
      tone: input.unreadNotifications > 0 ? 'info' : 'success',
      description: 'Informasi operasional dan approval terbaru.',
    },
  ];
}
