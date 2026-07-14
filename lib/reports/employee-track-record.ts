import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import {
  db,
  employees,
  attendances,
  kpiResults,
  leaveRequests,
  overtimeRequests,
  auditLogs,
} from '@/lib/db';
import { PdfBuilder } from '@/lib/reports/pdf-builder';
import { removeSelfieFields } from '@/lib/reports/pdf-report';

const MAX_KPI_ROWS = 24;
const MAX_AUDIT_ROWS = 20;

function shortDate(date: Date | null | undefined): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(date);
}

function money(value: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);
}

function tenureLabel(join: Date, end: Date): string {
  const months = Math.max(0, (end.getFullYear() - join.getFullYear()) * 12 + (end.getMonth() - join.getMonth()));
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years && rem) return `${years} thn ${rem} bln`;
  if (years) return `${years} thn`;
  return `${months} bln`;
}

export interface TrackRecordResult {
  found: boolean;
  employeeName?: string;
  pdf?: Uint8Array;
}

/**
 * Per-employee offboarding track record (kebijakan owner #10): satu PDF berisi
 * riwayat kinerja karyawan — identitas, masa kerja, kehadiran, KPI, cuti,
 * lembur, dan jejak aktivitas — untuk arsip saat karyawan keluar.
 */
export async function buildEmployeeTrackRecord(employeeId: string, generatedBy: string): Promise<TrackRecordResult> {
  const [employee] = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1);
  if (!employee) return { found: false };

  const [supervisor] = employee.supervisorId
    ? await db.select({ fullName: employees.fullName }).from(employees).where(eq(employees.id, employee.supervisorId)).limit(1)
    : [undefined];

  // Attendance aggregate (all-time for this employee).
  const attendanceAgg = await db
    .select({
      status: attendances.status,
      total: sql<number>`cast(count(*) as int)`,
      lateSum: sql<number>`coalesce(sum(${attendances.lateMinutes}), 0)`,
      workSum: sql<number>`coalesce(sum(${attendances.totalWorkMinutes}), 0)`,
    })
    .from(attendances)
    .where(eq(attendances.employeeId, employeeId))
    .groupBy(attendances.status);

  const attendance = attendanceAgg.reduce(
    (acc, r) => {
      acc.total += Number(r.total);
      acc.workMinutes += Number(r.workSum);
      acc.lateMinutes += Number(r.lateSum);
      if (r.status === 'PRESENT') acc.present += Number(r.total);
      else if (r.status === 'LATE') acc.late += Number(r.total);
      else if (r.status === 'ABSENT') acc.absent += Number(r.total);
      return acc;
    },
    { total: 0, present: 0, late: 0, absent: 0, workMinutes: 0, lateMinutes: 0 },
  );

  const kpiRows = await db
    .select({ period: kpiResults.period, score: kpiResults.score, approved: kpiResults.isApproved })
    .from(kpiResults)
    .where(eq(kpiResults.employeeId, employeeId))
    .orderBy(desc(kpiResults.period))
    .limit(MAX_KPI_ROWS);
  const kpiAvg = kpiRows.length ? kpiRows.reduce((s, r) => s + r.score, 0) / kpiRows.length : 0;

  const leaveAgg = await db
    .select({ status: leaveRequests.status, total: sql<number>`cast(count(*) as int)` })
    .from(leaveRequests)
    .where(eq(leaveRequests.employeeId, employeeId))
    .groupBy(leaveRequests.status);
  const leave = leaveAgg.reduce<Record<string, number>>((acc, r) => { acc[r.status] = Number(r.total); return acc; }, {});

  const [overtimeAgg] = await db
    .select({
      hours: sql<number>`coalesce(sum(${overtimeRequests.durationHours}), 0)`,
      pay: sql<number>`coalesce(sum(${overtimeRequests.calculatedPay}), 0)`,
      total: sql<number>`cast(count(*) as int)`,
    })
    .from(overtimeRequests)
    .where(eq(overtimeRequests.employeeId, employeeId));

  const auditRows = await db
    .select({ action: auditLogs.action, entity: auditLogs.entity, createdAt: auditLogs.createdAt })
    .from(auditLogs)
    .where(and(eq(auditLogs.entity, 'Employee'), eq(auditLogs.entityId, employeeId)))
    .orderBy(desc(auditLogs.createdAt))
    .limit(MAX_AUDIT_ROWS);

  const now = new Date();
  const endRef = employee.status === 'ACTIVE' ? now : (employee.updatedAt ?? now);
  const pdf = renderTrackRecord({
    generatedBy,
    employee: removeSelfieFields({
      fullName: employee.fullName,
      nip: employee.nip,
      email: employee.email,
      phone: employee.phone,
      division: employee.division,
      position: employee.position,
      status: employee.status,
      joinDate: employee.joinDate,
      supervisor: supervisor?.fullName ?? null,
    }),
    tenure: tenureLabel(employee.joinDate, endRef),
    attendance,
    kpi: { rows: kpiRows, avg: kpiAvg },
    leave,
    overtime: { hours: Number(overtimeAgg?.hours ?? 0), pay: Number(overtimeAgg?.pay ?? 0), total: Number(overtimeAgg?.total ?? 0) },
    audit: auditRows,
  });

  return { found: true, employeeName: employee.fullName, pdf };
}

interface RenderInput {
  generatedBy: string;
  employee: {
    fullName: string; nip: string; email: string; phone: string | null; division: string | null;
    position: string | null; status: string; joinDate: Date; supervisor: string | null;
  };
  tenure: string;
  attendance: { total: number; present: number; late: number; absent: number; workMinutes: number; lateMinutes: number };
  kpi: { rows: { period: string; score: number; approved: boolean }[]; avg: number };
  leave: Record<string, number>;
  overtime: { hours: number; pay: number; total: number };
  audit: { action: string; entity: string; createdAt: Date }[];
}

function renderTrackRecord(input: RenderInput): Uint8Array {
  const e = input.employee;
  const builder = new PdfBuilder({
    title: 'Track Record Karyawan',
    subtitle: `Track Record — ${e.fullName}`,
    generatedBy: input.generatedBy,
    generatedAt: new Date(),
  });

  builder.coverIntro(
    `NIP ${e.nip} · ${e.division || 'Tanpa divisi'}`,
    `Dokumen arsip kinerja karyawan untuk keperluan offboarding / evaluasi. Status saat ini: ${e.status}.`,
  );

  builder.sectionHeader('Identitas & Masa Kerja');
  builder.table(
    [
      { header: 'Field', width: 1.2 },
      { header: 'Nilai', width: 2.8 },
    ],
    [
      ['Nama Lengkap', e.fullName],
      ['NIP', e.nip],
      ['Email', e.email || '—'],
      ['Nomor HP', e.phone || '—'],
      ['Divisi', e.division || '—'],
      ['Jabatan', e.position || '—'],
      ['Atasan', e.supervisor || '—'],
      ['Tanggal Masuk', shortDate(e.joinDate)],
      ['Masa Kerja', input.tenure],
      ['Status', e.status],
    ],
  );

  const a = input.attendance;
  const rate = a.total ? `${Math.round(((a.present + a.late) / a.total) * 100)}%` : '—';
  builder.sectionHeader('Ringkasan Kehadiran', 'Akumulasi seluruh riwayat absensi karyawan.');
  builder.statCards([
    { label: 'Total Absensi', value: String(a.total) },
    { label: 'Tingkat Kehadiran', value: rate, tone: 'good' },
    { label: 'Hadir', value: String(a.present) },
    { label: 'Terlambat', value: String(a.late), tone: a.late ? 'warn' : 'default' },
    { label: 'Alpha', value: String(a.absent), tone: a.absent ? 'warn' : 'default' },
    { label: 'Total Jam Kerja', value: `${Math.round(a.workMinutes / 60)} jam` },
    { label: 'Akumulasi Telat', value: `${a.lateMinutes} mnt` },
    { label: 'Lembur', value: `${input.overtime.hours.toFixed(1)} jam` },
  ]);

  builder.sectionHeader('Riwayat KPI', `Rata-rata skor: ${input.kpi.avg.toFixed(1)} dari ${input.kpi.rows.length} periode.`);
  if (input.kpi.rows.length) {
    builder.barChart('Skor KPI per periode', input.kpi.rows.slice(0, 12).reverse().map((r) => ({ label: r.period, value: Number(r.score.toFixed(1)), display: r.score.toFixed(1) })));
    builder.table(
      [
        { header: 'Periode', width: 2 },
        { header: 'Skor', width: 1, align: 'right' },
        { header: 'Status', width: 1.4 },
      ],
      input.kpi.rows.map((r) => [r.period, r.score.toFixed(1), r.approved ? 'Disetujui' : 'Menunggu']),
    );
  } else {
    builder.paragraph('Belum ada data KPI untuk karyawan ini.');
  }

  builder.sectionHeader('Cuti & Lembur');
  builder.table(
    [
      { header: 'Kategori', width: 2.2 },
      { header: 'Jumlah', width: 1.8, align: 'right' },
    ],
    [
      ['Cuti Disetujui', String(input.leave.APPROVED ?? 0)],
      ['Cuti Menunggu', String(input.leave.PENDING ?? 0)],
      ['Cuti Ditolak', String(input.leave.REJECTED ?? 0)],
      ['Total Pengajuan Lembur', String(input.overtime.total)],
      ['Total Jam Lembur', `${input.overtime.hours.toFixed(1)} jam`],
      ['Nilai Lembur Tercatat', money(input.overtime.pay)],
    ],
  );

  builder.sectionHeader('Jejak Aktivitas Terakhir');
  if (input.audit.length) {
    builder.table(
      [
        { header: 'Tanggal', width: 1.6 },
        { header: 'Aksi', width: 1.6 },
        { header: 'Entitas', width: 1.2 },
      ],
      input.audit.map((r) => [shortDate(r.createdAt), r.action, r.entity]),
    );
  } else {
    builder.paragraph('Tidak ada jejak aktivitas administratif tercatat pada entitas karyawan ini.');
  }

  builder.sectionHeader('Catatan');
  builder.paragraph('Dokumen ini dihasilkan otomatis dari data langsung MyProdusen sebagai arsip kinerja karyawan. Gaji dibayar tunai; angka lembur adalah nilai tercatat berdasarkan persetujuan Superadmin.');
  builder.paragraph('Foto selfie absensi tidak disertakan demi privasi. Dokumen bersifat RAHASIA untuk internal TBM Group.');

  return builder.build();
}
