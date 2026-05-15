export type ReportPresetId =
  | 'attendance-today'
  | 'attendance-this-month'
  | 'late-this-month'
  | 'absent-this-month'
  | 'leave-by-status'
  | 'kpi-this-month'
  | 'geo-fence-exceptions';

export type ReportType = 'attendance' | 'leave' | 'performance';

export interface ReportPreset {
  id: ReportPresetId;
  label: string;
  description: string;
  reportType: ReportType;
  status?: string;
}

export interface ResolvedReportPreset extends ReportPreset {
  startDate: string;
  endDate: string;
}

const presets: ReportPreset[] = [
  {
    id: 'attendance-today',
    label: 'Kehadiran Hari Ini',
    description: 'Rekap hadir, terlambat, absen, dan cuti hari ini.',
    reportType: 'attendance',
  },
  {
    id: 'attendance-this-month',
    label: 'Kehadiran Bulan Ini',
    description: 'Rekap bulanan untuk payroll dan evaluasi disiplin.',
    reportType: 'attendance',
  },
  {
    id: 'late-this-month',
    label: 'Terlambat Bulan Ini',
    description: 'Daftar karyawan dengan status terlambat bulan berjalan.',
    reportType: 'attendance',
    status: 'LATE',
  },
  {
    id: 'absent-this-month',
    label: 'Absen Bulan Ini',
    description: 'Daftar karyawan yang tidak hadir tanpa status hadir/cuti.',
    reportType: 'attendance',
    status: 'ABSENT',
  },
  {
    id: 'leave-by-status',
    label: 'Cuti per Status',
    description: 'Pengajuan cuti, sakit, dan izin berdasarkan status.',
    reportType: 'leave',
  },
  {
    id: 'kpi-this-month',
    label: 'KPI Bulan Ini',
    description: 'Ringkasan KPI periode berjalan.',
    reportType: 'performance',
  },
  {
    id: 'geo-fence-exceptions',
    label: 'Pengecualian Geo-fence',
    description: 'Percobaan absensi di luar radius atau butuh review HR.',
    reportType: 'attendance',
    status: 'GEOFENCE_EXCEPTION',
  },
];

export function getReportPresets(): ReportPreset[] {
  return presets;
}

export function resolveReportPreset(id: ReportPresetId, now = new Date()): ResolvedReportPreset {
  const preset = presets.find((item) => item.id === id);

  if (!preset) {
    throw new Error(`Unknown report preset: ${id}`);
  }

  const today = toDateInput(now);

  if (id === 'attendance-today') {
    return { ...preset, startDate: today, endDate: today };
  }

  const firstDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const lastDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));

  return {
    ...preset,
    startDate: toDateInput(firstDay),
    endDate: toDateInput(lastDay),
  };
}

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}
