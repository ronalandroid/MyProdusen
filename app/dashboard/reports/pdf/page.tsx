'use client';

import { useMemo, useState } from 'react';
import { Download, FileText, ShieldCheck } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

type PdfReportType = 'attendance_summary' | 'kpi_performance' | 'payroll_summary' | 'executive_hr';

const reportTypes: { value: PdfReportType; label: string; description: string }[] = [
  { value: 'attendance_summary', label: 'Attendance Summary PDF', description: 'Status kehadiran, tren harian, dan ringkasan absensi.' },
  { value: 'kpi_performance', label: 'KPI Performance PDF', description: 'Performa KPI, approval, dan KPI by division chart.' },
  { value: 'payroll_summary', label: 'Payroll Summary PDF', description: 'Payroll paid/pending dan gross/deduction/net chart.' },
  { value: 'executive_hr', label: 'Executive HR PDF', description: 'Ringkasan eksekutif HR lintas attendance, KPI, payroll.' },
];

function currentMonthDefaults() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { from, to };
}

export default function PdfReportsPage() {
  const defaults = useMemo(() => currentMonthDefaults(), []);
  const [reportType, setReportType] = useState<PdfReportType>('executive_hr');
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [division, setDivision] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function downloadPdf() {
    setIsSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/reports/pdf', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ reportType, from, to, division: division.trim() || undefined }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => undefined);
        throw new Error(payload?.error || 'Gagal download PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `myprodusen-${reportType}-${from}-to-${to}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Gagal download PDF');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="phone-screen feature-screen">
      <section className="hero-card">
        <div>
          <p className="eyebrow text-white/80">Superadmin PDF Reports</p>
          <h1 className="text-2xl font-bold text-white">Download Laporan PDF Profesional</h1>
          <p className="text-sm text-white/90">PDF rahasia dengan header MyProdusen, footer TBM Group, chart, tabel, dan audit log.</p>
        </div>
        <ShieldCheck className="text-white" size={42} aria-hidden="true" />
      </section>

      {error && <section className="alert-card" role="alert"><strong>Download gagal</strong><p>{error}</p></section>}

      <section className="card">
        <div className="flex items-center gap-3 mb-5">
          <FileText className="text-[var(--primary-dark)]" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-bold">Jenis PDF</h2>
            <p className="text-sm text-[var(--text-secondary)]">Hanya Superadmin. Data selfie tidak ikut diekspor.</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {reportTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setReportType(type.value)}
              className={`rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${reportType === type.value ? 'border-[var(--primary)] bg-[var(--primary-light)]' : 'border-[var(--border-color)] bg-white hover:bg-[var(--bg-hover)]'}`}
            >
              <span className="block text-sm font-bold text-[var(--text-primary)]">{type.label}</span>
              <span className="mt-1 block text-xs text-[var(--text-secondary)]">{type.description}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="text-lg font-bold mb-4">Filter Laporan</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Tanggal mulai" type="date" value={from} onChange={(event) => setFrom(event.target.value)} required />
          <Input label="Tanggal akhir" type="date" value={to} onChange={(event) => setTo(event.target.value)} required />
          <Input label="Divisi" placeholder="Semua divisi" value={division} onChange={(event) => setDivision(event.target.value)} helperText="Opsional, contoh: Produksi" />
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--text-muted)]">PDF memakai data database nyata, no public cache, max rows mengikuti `PDF_REPORT_MAX_ROWS`.</p>
          <Button onClick={downloadPdf} loading={isSubmitting} icon={<Download size={16} aria-hidden="true" />}>Download PDF</Button>
        </div>
      </section>
    </div>
  );
}
