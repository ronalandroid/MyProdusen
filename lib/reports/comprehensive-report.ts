import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import {
  db,
  attendances,
  employees,
  kpiResults,
  payrollRuns,
  leaveRequests,
  overtimeRequests,
} from '@/lib/db';
import { PdfBuilder, type StatCard } from '@/lib/reports/pdf-builder';
import { validatePdfDateRange, getPdfReportMaxRows, removeSelfieFields } from '@/lib/reports/pdf-report';

export interface ComprehensiveReportRequest {
  from?: string;
  to?: string;
  division?: string;
}

const NO_DIVISION = 'Tanpa Divisi';

function money(value: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);
}

function shortDate(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(date);
}

function pct(part: number, whole: number): string {
  if (!whole) return '0%';
  return `${Math.round((part / whole) * 100)}%`;
}

interface DivisionRow {
  division: string;
  headcount: number;
  present: number;
  late: number;
  absent: number;
  attendanceTotal: number;
  kpiAvg: number;
  kpiCount: number;
  leavePending: number;
  leaveApproved: number;
  overtimeHours: number;
}

/**
 * One comprehensive HR report in a single PDF, broken down per division
 * (kebijakan owner: "sync berdasarkan isian masing-masing user devisi").
 * Combines headcount, attendance, KPI, leave, overtime, and payroll.
 */
export async function buildComprehensiveReport(
  request: ComprehensiveReportRequest,
  generatedBy: string,
): Promise<Uint8Array> {
  const { from, to } = validatePdfDateRange(request.from, request.to);
  const maxRows = getPdfReportMaxRows();
  const fromPeriod = from.toISOString().slice(0, 7);
  const toPeriod = to.toISOString().slice(0, 7);
  const divFilter = request.division ? eq(employees.division, request.division) : undefined;

  // --- Aggregate matrices (efficient group-bys, not row dumps) ----------
  const headcountRows = await db
    .select({ division: employees.division, total: sql<number>`cast(count(*) as int)` })
    .from(employees)
    .where(and(eq(employees.status, 'ACTIVE'), ...(divFilter ? [divFilter] : [])))
    .groupBy(employees.division);

  const attendanceRows = await db
    .select({
      division: employees.division,
      status: attendances.status,
      total: sql<number>`cast(count(*) as int)`,
    })
    .from(attendances)
    .innerJoin(employees, eq(attendances.employeeId, employees.id))
    .where(and(gte(attendances.checkInTime, from), lte(attendances.checkInTime, to), ...(divFilter ? [divFilter] : [])))
    .groupBy(employees.division, attendances.status);

  const kpiRows = await db
    .select({
      division: employees.division,
      avg: sql<number>`coalesce(avg(${kpiResults.score}), 0)`,
      total: sql<number>`cast(count(*) as int)`,
      approved: sql<number>`cast(count(*) filter (where ${kpiResults.isApproved}) as int)`,
    })
    .from(kpiResults)
    .innerJoin(employees, eq(kpiResults.employeeId, employees.id))
    .where(and(gte(kpiResults.period, fromPeriod), lte(kpiResults.period, toPeriod), ...(divFilter ? [divFilter] : [])))
    .groupBy(employees.division);

  const leaveRows = await db
    .select({
      division: employees.division,
      status: leaveRequests.status,
      total: sql<number>`cast(count(*) as int)`,
    })
    .from(leaveRequests)
    .innerJoin(employees, eq(leaveRequests.employeeId, employees.id))
    .where(and(gte(leaveRequests.startDate, from), lte(leaveRequests.startDate, to), ...(divFilter ? [divFilter] : [])))
    .groupBy(employees.division, leaveRequests.status);

  const overtimeRows = await db
    .select({
      division: employees.division,
      hours: sql<number>`coalesce(sum(${overtimeRequests.durationHours}), 0)`,
      pay: sql<number>`coalesce(sum(${overtimeRequests.calculatedPay}), 0)`,
      total: sql<number>`cast(count(*) as int)`,
    })
    .from(overtimeRequests)
    .innerJoin(employees, eq(overtimeRequests.employeeId, employees.id))
    .where(and(gte(overtimeRequests.overtimeDate, from), lte(overtimeRequests.overtimeDate, to), ...(divFilter ? [divFilter] : [])))
    .groupBy(employees.division);

  const payrollRunRows = await db
    .select()
    .from(payrollRuns)
    .where(and(gte(payrollRuns.periodStart, from), lte(payrollRuns.periodEnd, to)))
    .orderBy(desc(payrollRuns.period))
    .limit(maxRows);

  // --- Fold matrices into one per-division table ------------------------
  const matrix = new Map<string, DivisionRow>();
  const ensure = (division: string | null): DivisionRow => {
    const key = division || NO_DIVISION;
    if (!matrix.has(key)) {
      matrix.set(key, {
        division: key,
        headcount: 0,
        present: 0,
        late: 0,
        absent: 0,
        attendanceTotal: 0,
        kpiAvg: 0,
        kpiCount: 0,
        leavePending: 0,
        leaveApproved: 0,
        overtimeHours: 0,
      });
    }
    return matrix.get(key)!;
  };

  headcountRows.forEach((r) => { ensure(r.division).headcount = Number(r.total); });
  attendanceRows.forEach((r) => {
    const row = ensure(r.division);
    row.attendanceTotal += Number(r.total);
    if (r.status === 'PRESENT') row.present += Number(r.total);
    else if (r.status === 'LATE') row.late += Number(r.total);
    else if (r.status === 'ABSENT') row.absent += Number(r.total);
  });
  kpiRows.forEach((r) => {
    const row = ensure(r.division);
    row.kpiAvg = Number(r.avg);
    row.kpiCount = Number(r.total);
  });
  leaveRows.forEach((r) => {
    const row = ensure(r.division);
    if (r.status === 'PENDING') row.leavePending += Number(r.total);
    else if (r.status === 'APPROVED') row.leaveApproved += Number(r.total);
  });
  overtimeRows.forEach((r) => { ensure(r.division).overtimeHours = Number(r.hours); });

  const divisions = [...matrix.values()].sort((a, b) => b.headcount - a.headcount || a.division.localeCompare(b.division));

  // --- Company-wide totals ---------------------------------------------
  const totals = divisions.reduce(
    (acc, d) => {
      acc.headcount += d.headcount;
      acc.present += d.present;
      acc.late += d.late;
      acc.absent += d.absent;
      acc.attendanceTotal += d.attendanceTotal;
      acc.kpiWeighted += d.kpiAvg * d.kpiCount;
      acc.kpiCount += d.kpiCount;
      acc.leavePending += d.leavePending;
      acc.overtimeHours += d.overtimeHours;
      return acc;
    },
    { headcount: 0, present: 0, late: 0, absent: 0, attendanceTotal: 0, kpiWeighted: 0, kpiCount: 0, leavePending: 0, overtimeHours: 0 },
  );
  const avgKpi = totals.kpiCount ? totals.kpiWeighted / totals.kpiCount : 0;
  const netPayroll = payrollRunRows.reduce((s, r) => s + r.totalNetPay, 0);
  const grossPayroll = payrollRunRows.reduce((s, r) => s + r.totalGrossPay, 0);
  const deductions = payrollRunRows.reduce((s, r) => s + r.totalDeductions, 0);

  return renderComprehensivePdf({
    generatedBy,
    from,
    to,
    division: request.division,
    divisions,
    totals: { ...totals, avgKpi, netPayroll, grossPayroll, deductions },
    payrollRuns: payrollRunRows.map((r) => ({
      period: r.period,
      status: r.status,
      employees: r.totalEmployees,
      gross: r.totalGrossPay,
      deductions: r.totalDeductions,
      net: r.totalNetPay,
    })),
  });
}

interface RenderInput {
  generatedBy: string;
  from: Date;
  to: Date;
  division?: string;
  divisions: DivisionRow[];
  totals: {
    headcount: number; present: number; late: number; absent: number; attendanceTotal: number;
    avgKpi: number; leavePending: number; overtimeHours: number; netPayroll: number; grossPayroll: number; deductions: number;
  };
  payrollRuns: { period: string; status: string; employees: number; gross: number; deductions: number; net: number }[];
}

function renderComprehensivePdf(input: RenderInput): Uint8Array {
  const clean = removeSelfieFields(input) as RenderInput;
  const builder = new PdfBuilder({
    title: 'Laporan HR Menyeluruh',
    subtitle: 'Laporan HR Menyeluruh per Divisi',
    generatedBy: clean.generatedBy,
    generatedAt: new Date(),
  });

  const periodLabel = `${shortDate(clean.from)} — ${shortDate(clean.to)}`;
  builder.coverIntro(periodLabel, `Cakupan divisi: ${clean.division || 'Semua divisi'} · Sumber: data absensi, KPI, cuti, lembur, dan payroll.`);

  const t = clean.totals;
  const attendanceRate = t.attendanceTotal ? pct(t.present + t.late, t.attendanceTotal) : '—';
  builder.statCards([
    { label: 'Karyawan Aktif', value: String(t.headcount) },
    { label: 'Tingkat Kehadiran', value: attendanceRate, tone: 'good' },
    { label: 'Rata-rata KPI', value: t.avgKpi.toFixed(1) },
    { label: 'Jam Lembur', value: t.overtimeHours.toFixed(1) },
    { label: 'Hadir (baris)', value: String(t.present) },
    { label: 'Terlambat', value: String(t.late), tone: t.late ? 'warn' : 'default' },
    { label: 'Cuti Pending', value: String(t.leavePending), tone: t.leavePending ? 'warn' : 'default' },
    { label: 'Net Payroll', value: money(t.netPayroll) },
  ]);

  // The core per-division matrix.
  builder.sectionHeader('Ringkasan per Divisi', 'Satu baris per divisi menggabungkan seluruh modul HR pada periode ini.');
  builder.table(
    [
      { header: 'Divisi', width: 2.2 },
      { header: 'Aktif', width: 1, align: 'right' },
      { header: 'Hadir', width: 1, align: 'right' },
      { header: 'Telat', width: 1, align: 'right' },
      { header: 'Alpha', width: 1, align: 'right' },
      { header: 'KPI', width: 1, align: 'right' },
      { header: 'Cuti', width: 1, align: 'right' },
      { header: 'Lembur(j)', width: 1.2, align: 'right' },
    ],
    clean.divisions.map((d) => [
      d.division,
      String(d.headcount),
      String(d.present),
      String(d.late),
      String(d.absent),
      d.kpiCount ? d.kpiAvg.toFixed(1) : '—',
      String(d.leavePending + d.leaveApproved),
      d.overtimeHours.toFixed(1),
    ]),
    { note: clean.divisions.length ? undefined : 'Belum ada data pada periode ini.' },
  );

  // Attendance section.
  builder.sectionHeader('Kehadiran', 'Distribusi kehadiran dan divisi dengan keterlambatan tertinggi.');
  builder.barChart('Hadir per divisi', clean.divisions.filter((d) => d.present > 0).slice(0, 8).map((d) => ({ label: d.division, value: d.present })));
  if (clean.divisions.some((d) => d.late > 0)) {
    builder.barChart('Keterlambatan per divisi', clean.divisions.filter((d) => d.late > 0).sort((a, b) => b.late - a.late).slice(0, 8).map((d) => ({ label: d.division, value: d.late })));
  }

  // KPI section.
  builder.sectionHeader('Kinerja KPI', 'Rata-rata skor KPI per divisi (periode bulanan dalam rentang).');
  builder.barChart('Rata-rata KPI per divisi', clean.divisions.filter((d) => d.kpiCount > 0).map((d) => ({ label: d.division, value: Number(d.kpiAvg.toFixed(1)), display: d.kpiAvg.toFixed(1) })));

  // Leave & overtime section.
  builder.sectionHeader('Cuti & Lembur');
  builder.barChart('Jam lembur per divisi', clean.divisions.filter((d) => d.overtimeHours > 0).sort((a, b) => b.overtimeHours - a.overtimeHours).slice(0, 8).map((d) => ({ label: d.division, value: Number(d.overtimeHours.toFixed(1)), display: d.overtimeHours.toFixed(1) })));
  builder.table(
    [
      { header: 'Divisi', width: 2.4 },
      { header: 'Cuti Pending', width: 1.4, align: 'right' },
      { header: 'Cuti Disetujui', width: 1.4, align: 'right' },
      { header: 'Jam Lembur', width: 1.4, align: 'right' },
    ],
    clean.divisions.map((d) => [d.division, String(d.leavePending), String(d.leaveApproved), d.overtimeHours.toFixed(1)]),
  );

  // Payroll section.
  builder.sectionHeader('Payroll', 'Ringkasan payroll perusahaan (bruto, potongan, dan gaji bersih tercatat — pembayaran tunai).');
  builder.statCards([
    { label: 'Payroll Runs', value: String(clean.payrollRuns.length) },
    { label: 'Bruto', value: money(t.grossPayroll) },
    { label: 'Potongan', value: money(t.deductions) },
    { label: 'Net (Tunai)', value: money(t.netPayroll), tone: 'good' },
  ]);
  if (clean.payrollRuns.length) {
    builder.table(
      [
        { header: 'Periode', width: 1.4 },
        { header: 'Status', width: 1.2 },
        { header: 'Karyawan', width: 1.2, align: 'right' },
        { header: 'Bruto', width: 1.6, align: 'right' },
        { header: 'Potongan', width: 1.6, align: 'right' },
        { header: 'Net', width: 1.6, align: 'right' },
      ],
      clean.payrollRuns.map((r) => [r.period, r.status, String(r.employees), money(r.gross), money(r.deductions), money(r.net)]),
    );
  }

  builder.sectionHeader('Catatan');
  builder.paragraph('Laporan ini dihasilkan otomatis dari data langsung MyProdusen dan dikelompokkan sesuai divisi yang diisi di profil masing-masing karyawan.');
  builder.paragraph('Gaji dibayar tunai; angka payroll di sini adalah catatan berdasarkan kehadiran dan performa KPI yang telah disetujui Superadmin.');
  builder.paragraph('Foto selfie absensi sengaja tidak disertakan demi privasi dan keringkasan. Dokumen bersifat RAHASIA untuk internal TBM Group.');

  return builder.build();
}
