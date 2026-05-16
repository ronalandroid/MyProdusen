export type SelfServiceTone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted';

export interface SelfServiceInput {
  attendanceStatus: 'not-started' | 'checked-in' | 'checked-out';
  leaveAvailable: number;
  pendingRequests: number;
  kpiScore: number | null;
  unreadNotifications: number;
}

export interface SelfServiceSection {
  title: string;
  value: string | number;
  description: string;
  href: string;
  tone: SelfServiceTone;
}

export function buildSelfServiceSections(input: SelfServiceInput): SelfServiceSection[] {
  return [
    {
      title: 'Absensi Hari Ini',
      value: formatAttendanceStatus(input.attendanceStatus),
      description: 'Check-in, check-out, dan status kehadiran pribadi.',
      href: '/dashboard/attendance',
      tone: input.attendanceStatus === 'checked-in' ? 'success' : input.attendanceStatus === 'checked-out' ? 'info' : 'warning',
    },
    {
      title: 'Saldo Cuti',
      value: `${input.leaveAvailable} hari`,
      description: 'Jatah cuti tersedia untuk tahun berjalan.',
      href: '/dashboard/leave/balance',
      tone: input.leaveAvailable > 0 ? 'success' : 'danger',
    },
    {
      title: 'Pengajuan Saya',
      value: input.pendingRequests,
      description: 'Cuti, sakit, dan izin yang masih berjalan.',
      href: '/dashboard/leave',
      tone: input.pendingRequests > 0 ? 'warning' : 'success',
    },
    {
      title: 'KPI Saya',
      value: input.kpiScore ?? 'Belum ada',
      description: 'Nilai KPI periode berjalan.',
      href: '/dashboard/kpi',
      tone: input.kpiScore === null ? 'muted' : 'primary',
    },
    {
      title: 'Notifikasi',
      value: input.unreadNotifications,
      description: 'Update approval, absensi, KPI, dan pengumuman.',
      href: '/dashboard/notifications',
      tone: input.unreadNotifications > 0 ? 'info' : 'success',
    },
    {
      title: 'Dokumen & Slip Gaji',
      value: 'Segera',
      description: 'Placeholder dokumen karyawan dan slip gaji pribadi.',
      href: '/dashboard/documents',
      tone: 'muted',
    },
  ];
}

function formatAttendanceStatus(status: SelfServiceInput['attendanceStatus']) {
  if (status === 'checked-in') return 'Sudah check-in';
  if (status === 'checked-out') return 'Selesai';
  return 'Belum mulai';
}
