import type { UserRole } from '@/lib/permissions';

export interface RoleExperience {
  eyebrow: string;
  title: string;
  subtitle: string;
  heroTitle: string;
  heroDescription: string;
  quickActions: Array<{
    href: string;
    title: string;
    description: string;
    icon: 'attendance' | 'leave' | 'reports' | 'employees' | 'kpi' | 'profile';
  }>;
}

export function getRoleExperience(role: UserRole | string): RoleExperience {
  if (role === 'SUPERADMIN') {
    return {
      eyebrow: 'Dashboard Performa Perusahaan',
      title: 'Performa perusahaan hari ini',
      subtitle: 'Lihat semua kehadiran, KPI, risiko operasional, payroll, dan laporan lintas divisi.',
      heroTitle: 'Kehadiran Perusahaan',
      heroDescription: 'Semua data perusahaan terbuka untuk kontrol owner dan superadmin.',
      quickActions: [
        { href: '/dashboard/reports', title: 'Laporan Perusahaan', description: 'Ekspor performa lintas divisi', icon: 'reports' },
        { href: '/dashboard/kpi', title: 'KPI Perusahaan', description: 'Kelola template dan review skor', icon: 'kpi' },
        { href: '/dashboard/employees', title: 'Karyawan', description: 'Kelola seluruh data karyawan', icon: 'employees' },
        { href: '/dashboard/audit', title: 'Audit Log', description: 'Pantau aktivitas sensitif sistem', icon: 'profile' },
      ],
    };
  }

  return {
    eyebrow: 'Dashboard Karyawan',
    title: 'Aktivitas kerja pribadi',
    subtitle: 'Cek kehadiran, ajukan cuti, lihat KPI pribadi, payroll pribadi, dan buka notifikasi.',
    heroTitle: 'Kehadiran Saya',
    heroDescription: 'Karyawan hanya melihat data sendiri dan aksi harian yang diperlukan.',
    quickActions: [
      { href: '/dashboard/attendance', title: 'Check-in / Check-out', description: 'Absensi GPS dan selfie', icon: 'attendance' },
      { href: '/dashboard/leave', title: 'Ajukan Cuti', description: 'Cuti, izin, atau sakit', icon: 'leave' },
      { href: '/dashboard/kpi', title: 'KPI Saya', description: 'Lihat target dan hasil pribadi', icon: 'kpi' },
      { href: '/dashboard/profile', title: 'Profil Saya', description: 'Data akun dan karyawan', icon: 'profile' },
    ],
  };
}
