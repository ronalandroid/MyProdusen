/**
 * Maps raw audit action codes to warm, human-readable Indonesian labels for
 * the employee-facing "Aktivitas Akun saya" view. Unknown actions fall back to
 * a titel-cased version of the code so nothing ever renders as a raw enum.
 */
const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Masuk ke akun',
  LOGOUT: 'Keluar dari akun',
  CHANGE_PASSWORD: 'Mengubah kata sandi',
  PUBLIC_REGISTER: 'Mendaftar akun',
  CHECK_IN: 'Absen masuk',
  CHECK_OUT: 'Absen pulang',
  CHECK_IN_FAILED: 'Absen masuk gagal',
  CHECK_OUT_FAILED: 'Absen pulang gagal',
  CHECK_IN_GPS_VALID: 'Absen masuk (lokasi valid)',
  CHECK_OUT_GPS_VALID: 'Absen pulang (lokasi valid)',
  CHECK_IN_GPS_PENDING_REVIEW: 'Absen masuk menunggu review lokasi',
  CHECK_IN_REJECTED_OUTSIDE_RADIUS: 'Absen masuk ditolak (di luar radius)',
  CHECK_IN_REJECTED_GPS_ACCURACY: 'Absen masuk ditolak (akurasi GPS)',
  CHECK_IN_REJECTED_SELFIE: 'Absen masuk ditolak (selfie)',
  PROFILE_COMPLETED: 'Melengkapi profil',
  UPDATE: 'Memperbarui data',
  CREATE: 'Membuat data',
  DELETE: 'Menghapus data',
  DEACTIVATE: 'Menonaktifkan',
  APPROVE: 'Menyetujui',
  APPROVED: 'Disetujui',
  REJECT: 'Menolak',
  DOWNLOAD_PDF: 'Mengunduh dokumen PDF',
  EXPORT: 'Mengekspor data',
};

const ENTITY_LABELS: Record<string, string> = {
  Attendance: 'absensi',
  LeaveRequest: 'cuti',
  OvertimeRequest: 'lembur',
  Employee: 'karyawan',
  User: 'akun',
  KpiResult: 'KPI',
  PayrollDispute: 'aduan gaji',
};

function titleCase(code: string): string {
  return code
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function humanizeAuditAction(action: string, entity?: string): string {
  const base = ACTION_LABELS[action] ?? titleCase(action);
  // Generic verbs read better with the entity appended ("Memperbarui data cuti").
  if (['UPDATE', 'CREATE', 'DELETE', 'APPROVE', 'REJECT'].includes(action) && entity) {
    const entityLabel = ENTITY_LABELS[entity];
    if (entityLabel) return `${base} ${entityLabel}`;
  }
  return base;
}
