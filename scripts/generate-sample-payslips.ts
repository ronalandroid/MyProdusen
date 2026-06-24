/**
 * Generate sample payslips for owner sign-off (FASE C — C3).
 *
 * Uses the SAME production payroll formulas (lib/payroll/calculations.ts) so the
 * numbers match the assertions in tests/payroll/payroll-orchestrator.integration.test.ts.
 *
 * IMPORTANT — reflects the payroll engine as it actually exists:
 *   • Attendance deduction = absentDays × (base / 22). This is the ONLY
 *     attendance-based deduction.
 *   • There is NO "late penalty": lateDays are tracked but never reduce pay.
 *   • There is NO resign-proration. (Both are documented gaps, not implemented.)
 *
 * Output: print-ready HTML slips in docs/payroll-signoff/. The project has no
 * PDF library, so these are HTML (open in a browser → Print → Save as PDF).
 *
 * Run: npx tsx scripts/generate-sample-payslips.ts
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  WORKING_DAYS_PER_MONTH,
  PTKP_MONTHLY,
  calculateAttendanceDeduction,
  calculateBPJSKesehatan,
  calculateBPJSKetenagakerjaan,
  calculateTax,
} from "../lib/payroll/calculations";

interface Scenario {
  key: "A" | "B" | "C";
  name: string;
  nip: string;
  position: string;
  baseSalary: number;
  allowances: number;
  overtimePay: number;
  overtimeHours: number;
  bonusPay: number;
  workDays: number;
  absentDays: number;
  lateDays: number;
  note: string;
}

const PERIOD = "2026-05 (Mei 2026)";

const scenarios: Scenario[] = [
  {
    key: "A",
    name: "Karyawan A — Full Hadir",
    nip: "SAMPLE-A",
    position: "Staff Produksi",
    baseSalary: 3_000_000,
    allowances: 0,
    overtimePay: 0,
    overtimeHours: 0,
    bonusPay: 0,
    workDays: 22,
    absentDays: 0,
    lateDays: 0,
    note: "Hadir penuh, tanpa lembur. Skenario dasar.",
  },
  {
    key: "B",
    name: "Karyawan B — Lembur 8 jam",
    nip: "SAMPLE-B",
    position: "Staff Produksi",
    baseSalary: 3_000_000,
    allowances: 0,
    overtimePay: 400_000,
    overtimeHours: 8,
    bonusPay: 0,
    workDays: 22,
    absentDays: 0,
    lateDays: 3,
    note:
      "Lembur 8 jam (calculatedPay 400.000) masuk gross. Terlambat 3x DICATAT " +
      "tapi TIDAK memotong gaji (tidak ada fitur late penalty).",
  },
  {
    key: "C",
    name: "Karyawan C — 2 Hari Alpa",
    nip: "SAMPLE-C",
    position: "Staff Produksi",
    baseSalary: 4_000_000,
    allowances: 0,
    overtimePay: 0,
    overtimeHours: 0,
    bonusPay: 0,
    workDays: 20,
    absentDays: 2,
    lateDays: 0,
    note:
      "2 hari ABSENT → potongan = 2 × (gaji pokok / 22). Ini satu-satunya " +
      "potongan berbasis kehadiran (resign-proration tidak ada di kode).",
  },
];

interface Computed {
  gross: number;
  bpjsKesEmp: number;
  bpjsKetEmp: number;
  tax: number;
  attendanceDeduction: number;
  totalDeductions: number;
  net: number;
}

/** Mirrors the orchestrator composition in payroll-calculator.ts exactly. */
function compute(s: Scenario): Computed {
  const gross = s.baseSalary + s.allowances + s.overtimePay + s.bonusPay;
  const bpjsKesEmp = calculateBPJSKesehatan(s.baseSalary).employee;
  const bpjsKetEmp = calculateBPJSKetenagakerjaan(s.baseSalary).employee;
  const tax = calculateTax(gross);
  const attendanceDeduction = calculateAttendanceDeduction(s.baseSalary, {
    workDays: s.workDays,
    absentDays: s.absentDays,
    lateDays: s.lateDays,
  });
  const totalDeductions = bpjsKesEmp + bpjsKetEmp + tax + attendanceDeduction;
  const net = gross - totalDeductions;
  return { gross, bpjsKesEmp, bpjsKetEmp, tax, attendanceDeduction, totalDeductions, net };
}

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(n));

function row(label: string, value: string, strong = false): string {
  const w = strong ? "font-weight:700;" : "";
  return `<tr><td style="padding:6px 12px;${w}">${label}</td><td style="padding:6px 12px;text-align:right;${w}">${value}</td></tr>`;
}

function slipHtml(s: Scenario, c: Computed): string {
  return `<!doctype html>
<html lang="id"><head><meta charset="utf-8" />
<title>Slip Gaji ${s.nip} — ${PERIOD}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;max-width:640px;margin:32px auto;padding:0 16px;}
  h1{font-size:18px;margin:0;} .brand{color:#caa106;font-weight:800;letter-spacing:.5px;}
  .muted{color:#666;font-size:12px;} table{width:100%;border-collapse:collapse;margin-top:16px;font-size:14px;}
  tr:nth-child(even){background:#faf8f0;} .section{margin-top:20px;border-top:2px solid #FFC107;padding-top:8px;}
  .net{background:#FFF8E1;border:1px solid #FFC107;border-radius:8px;margin-top:16px;}
  .sign{margin-top:48px;display:flex;justify-content:space-between;font-size:13px;}
  .sign div{width:45%;border-top:1px solid #333;padding-top:6px;text-align:center;}
  .note{margin-top:16px;font-size:12px;color:#555;background:#f5f5f5;border-radius:6px;padding:10px;}
  @media print{body{margin:0;}}
</style></head><body>
  <h1><span class="brand">MYPRODUSEN</span> — Slip Gaji</h1>
  <div class="muted">Produsen Dimsum Medan · Periode: ${PERIOD} · CONTOH untuk tanda tangan owner</div>

  <table>
    ${row("Nama", s.name)}
    ${row("NIP", s.nip)}
    ${row("Jabatan", s.position)}
    ${row("Hari Kerja / Alpa / Terlambat", `${s.workDays} / ${s.absentDays} / ${s.lateDays}`)}
  </table>

  <div class="section"><strong>Pendapatan</strong></div>
  <table>
    ${row("Gaji Pokok", rupiah(s.baseSalary))}
    ${row("Tunjangan", rupiah(s.allowances))}
    ${row(`Lembur (${s.overtimeHours} jam)`, rupiah(s.overtimePay))}
    ${row("Bonus", rupiah(s.bonusPay))}
    ${row("Gross (Bruto)", rupiah(c.gross), true)}
  </table>

  <div class="section"><strong>Potongan</strong></div>
  <table>
    ${row("BPJS Kesehatan (1%)", rupiah(c.bpjsKesEmp))}
    ${row("BPJS Ketenagakerjaan (2%)", rupiah(c.bpjsKetEmp))}
    ${row("PPh 21", rupiah(c.tax))}
    ${row(`Potongan Kehadiran (${s.absentDays} hari alpa)`, rupiah(c.attendanceDeduction))}
    ${row("Total Potongan", rupiah(c.totalDeductions), true)}
  </table>

  <table class="net">${row("TAKE-HOME PAY (Net)", rupiah(c.net), true)}</table>

  <div class="note">${s.note}</div>

  <div class="sign">
    <div>Disetujui Owner<br/><span class="muted">(tanda tangan & tanggal)</span></div>
    <div>Diterima Karyawan<br/><span class="muted">(tanda tangan & tanggal)</span></div>
  </div>
</body></html>`;
}

const outDir = join(process.cwd(), "docs", "payroll-signoff");
console.log(`PTKP bulanan: ${rupiah(PTKP_MONTHLY)} · Hari kerja/bulan: ${WORKING_DAYS_PER_MONTH}\n`);
console.log("Scenario | base       | gross      | bpjsKes | bpjsKet | tax     | absentDed | NET");
console.log("---------|------------|------------|---------|---------|---------|-----------|------------");
for (const s of scenarios) {
  const c = compute(s);
  writeFileSync(join(outDir, `sample-slip-${s.key}.html`), slipHtml(s, c), "utf8");
  const fmt = (n: number) => String(Math.round(n)).padStart(9);
  console.log(
    `   ${s.key}     |${fmt(s.baseSalary)} |${fmt(c.gross)} |${fmt(c.bpjsKesEmp)}|${fmt(c.bpjsKetEmp)}|${fmt(c.tax)}|${fmt(c.attendanceDeduction)}|${fmt(c.net)}`,
  );
}
console.log(`\n✓ 3 slip HTML ditulis ke docs/payroll-signoff/sample-slip-{A,B,C}.html`);
