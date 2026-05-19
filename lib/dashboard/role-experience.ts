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

export function getRoleExperience(role: UserRole): RoleExperience {
  if (role === 'SUPERADMIN') {
    return {
      eyebrow: 'Dashboard Performa Perusahaan',
      title: 'Performa perusahaan hari ini',
      subtitle: 'Lihat semua kehadiran, KPI, risiko operasional, dan laporan lintas divisi.',
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

  if (false) {
    return {
      eyebrow: 'Dashboard HR',
      title: 'Performa karyawan dan operasional HR',
      subtitle: 'Fokus pada data karyawan, absensi, cuti, shift, dan laporan HR.',
      heroTitle: 'Kehadiran Karyawan',
      heroDescription: 'HR melihat performa karyawan aktif dan antrian administrasi.',
      quickActions: [
        { href: '/dashboard/employees', title: 'Data Karyawan', description: 'Kelola biodata, divisi, dan jabatan', icon: 'employees' },
        { href: '/dashboard/attendance', title: 'Absensi HR', description: 'Pantau hadir, telat, dan absen', icon: 'attendance' },
        { href: '/dashboard/leave', title: 'Cuti Pending', description: 'Review pengajuan karyawan', icon: 'leave' },
        { href: '/dashboard/reports', title: 'Laporan HR', description: 'Ekspor laporan karyawan', icon: 'reports' },
      ],
    };
  }

  if (role === 'SUPERVISOR') {
    return {
      eyebrow: 'Dashboard Supervisor',
      title: 'Performa tim dan target KPI',
      subtitle: 'Lihat tim sendiri, update target KPI harian, dan review hasil produksi.',
      heroTitle: 'Kehadiran Tim',
      heroDescription: 'Supervisor hanya melihat anggota tim dan KPI bawahan langsung.',
      quickActions: [
        { href: '/dashboard/kpi', title: 'Target KPI Tim', description: 'Input target cetakan harian dan realisasi', icon: 'kpi' },
        { href: '/dashboard/employees', title: 'Tim Saya', description: 'Lihat anggota tim sendiri', icon: 'employees' },
        { href: '/dashboard/leave', title: 'Approval Cuti', description: 'Setujui atau tolak pengajuan tim', icon: 'leave' },
        { href: '/dashboard/attendance/exceptions', title: 'Exception Tim', description: 'Review kendala absensi tim', icon: 'attendance' },
      ],
    };
  }

  return {
    eyebrow: 'Dashboard Karyawan',
    title: 'Aktivitas kerja pribadi',
    subtitle: 'Cek kehadiran, ajukan cuti, lihat KPI pribadi, dan buka notifikasi.',
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
