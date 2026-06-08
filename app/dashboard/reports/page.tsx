"use client";

import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, FileText, Calendar, Users, Clock } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { fetchApiData } from "@/hooks/useDashboardQueries";
import { getReportPresets, resolveReportPreset, type ReportPresetId } from "@/lib/reports/report-presets";

const REPORT_DESCRIPTIONS: Record<string, string> = {
  attendance: 'Ringkasan ini diambil dari database attendance sesuai filter.',
  leave: 'Gunakan export CSV untuk data leave real sesuai filter dan permission.',
  performance: 'Gunakan export CSV untuk data KPI real sesuai filter dan permission.',
};

export default function ReportsPage() {
  const router = useRouter();
  const [reportType, setReportType] = useState("attendance");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [selectedPreset, setSelectedPreset] = useState<ReportPresetId | "">("");
  const [notice, setNotice] = useState("");

  const buildReportParams = useCallback(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('from', startDate);
    if (endDate) params.set('to', endDate);
    if (selectedEmployee !== 'all') params.set('employeeId', selectedEmployee);
    if (selectedPreset) params.set('preset', selectedPreset);
    return params;
  }, [endDate, selectedEmployee, selectedPreset, startDate]);

  const employeesQuery = useQuery({
    queryKey: ['reports', 'employees'],
    queryFn: () => fetchApiData<Array<{ id: string; name: string; nip?: string | null }>>('/api/employees?limit=200', 'Gagal mengambil data karyawan'),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
  const employees = employeesQuery.data ?? [];

  const summaryParams = buildReportParams().toString();
  const summaryQuery = useQuery({
    queryKey: ['reports', 'attendance-summary', summaryParams],
    queryFn: () => fetchApiData<{ summary?: any }>(`/api/reports/attendance/summary?${summaryParams}`, 'Gagal mengambil ringkasan absensi'),
    enabled: reportType === 'attendance',
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
  const attendanceSummary = summaryQuery.data?.summary ?? null;
  const loading = summaryQuery.isLoading;
  const error = reportType === 'attendance' ? (summaryQuery.error?.message ?? '') : '';

  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'pdf') {
      router.push('/dashboard/reports/pdf');
      return;
    }
    setNotice("");

    const endpointMap: Record<string, string> = {
      attendance: '/api/reports/attendance',
      leave: '/api/reports/leave',
      performance: '/api/reports/kpi',
    };
    const params = buildReportParams();
    params.set('format', 'csv');

    window.location.href = `${endpointMap[reportType]}?${params.toString()}`;
  };

  const handleGenerate = () => {
    handleExport('csv');
  };

  const handlePreset = (presetId: ReportPresetId) => {
    const preset = resolveReportPreset(presetId);
    setSelectedPreset(presetId);
    setReportType(preset.reportType);
    setStartDate(preset.startDate);
    setEndDate(preset.endDate);
  };

  return (
    <div className="phone-screen feature-screen" style={{ display: "flex", flexDirection: "column", gap: "20px", position: "relative", minHeight: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          type="button"
          className="inline-flex min-h-[44px] items-center gap-3 rounded-xl px-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
          onClick={() => router.back()}
          aria-label="Kembali ke halaman sebelumnya"
        >
          <ArrowLeft size={24} aria-hidden="true" />
          <h1 style={{ fontSize: "20px", fontWeight: 700 }}>Laporan</h1>
        </button>
      </div>

      {/* Info Banner */}
      <div style={{ 
        backgroundColor: "var(--info-bg)", 
        border: "1px solid var(--info)",
        borderRadius: "var(--radius-md)", 
        padding: "16px",
        display: "flex",
        alignItems: "start",
        gap: "12px"
      }}>
        <FileText size={20} color="var(--info)" style={{ flexShrink: 0, marginTop: "2px" }} />
        <div>
          <p className="text-sm font-semibold text-[var(--info)] mb-1">Preset laporan HRIS</p>
          <p className="text-xs text-[var(--text-secondary)]">
            Gunakan preset untuk laporan rutin seperti kehadiran hari ini, terlambat bulan ini, cuti per status, dan KPI periode berjalan.
          </p>
        </div>
      </div>

      <section className="card" aria-label="Laporan payroll dan lembur" style={{ padding: "16px" }}>
        <h2 className="text-base font-bold">Laporan Payroll dan Lembur</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Akses periode payroll, penggajian, overtime/lembur, dan detail lembur dari laporan HRIS.</p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button variant="secondary" onClick={() => router.push('/dashboard/payroll')} fullWidth>Periode Payroll / Penggajian</Button>
          <Button variant="secondary" onClick={() => router.push('/dashboard/overtime')} fullWidth>Laporan Lembur / Overtime</Button>
        </div>
      </section>

      {/* Report Presets */}
      <div className="card" style={{ padding: "16px" }}>
        <h3 className="text-sm font-semibold mb-3">Preset Cepat</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
          {getReportPresets().map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePreset(preset.id)}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedPreset === preset.id
                  ? "border-[var(--primary)] bg-[var(--warning-bg)]"
                  : "border-[var(--border-color)] bg-white"
              }`}
            >
              <p className="text-xs font-semibold text-[var(--text-primary)]">{preset.label}</p>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Report Type Selection */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          Jenis Laporan
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 9rem), 1fr))", gap: "8px" }}>
          <button
            onClick={() => router.push("/dashboard/reports/attendance")}
            className="p-3 rounded-lg border border-[var(--primary)] bg-[var(--warning-bg)] transition-all"
          >
            <Clock size={20} className="mx-auto mb-1" color="var(--primary)" />
            <p className="text-xs font-medium">Kehadiran</p>
            <p className="text-[10px] text-[var(--text-secondary)] mt-1">Buka laporan lengkap</p>
          </button>
          <button
            onClick={() => setReportType("leave")}
            className={`p-3 rounded-lg border transition-all ${
              reportType === "leave"
                ? "border-[var(--primary)] bg-[var(--warning-bg)]"
                : "border-[var(--border-color)] bg-white"
            }`}
          >
            <Calendar size={20} className="mx-auto mb-1" color={reportType === "leave" ? "var(--primary)" : "var(--text-muted)"} />
            <p className="text-xs font-medium">Cuti</p>
          </button>
          <button
            onClick={() => setReportType("performance")}
            className={`p-3 rounded-lg border transition-all ${
              reportType === "performance"
                ? "border-[var(--primary)] bg-[var(--warning-bg)]"
                : "border-[var(--border-color)] bg-white"
            }`}
          >
            <Users size={20} className="mx-auto mb-1" color={reportType === "performance" ? "var(--primary)" : "var(--text-muted)"} />
            <p className="text-xs font-medium">Kinerja</p>
          </button>
          <button
            onClick={() => router.push('/dashboard/reports/pdf')}
            className="p-3 rounded-lg border border-[var(--primary)] bg-[var(--primary-light)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
          >
            <FileText size={20} className="mx-auto mb-1" color="var(--primary-dark)" />
            <p className="text-xs font-medium">PDF Superadmin</p>
            <p className="text-[10px] text-[var(--text-secondary)] mt-1">Laporan profesional</p>
          </button>
        </div>
        {notice && (
          <div className="alert alert-warning mt-3" role="status">
            {notice}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: "16px" }}>
        <h3 className="text-sm font-semibold mb-3">Filter</h3>
        <div className="flex flex-col gap-3">
          <Input
            label="Tanggal Mulai"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="Tanggal Selesai"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Karyawan
            </label>
            <select
              className="input"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="all">Semua Karyawan</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>{employee.name}{employee.nip ? ` — ${employee.nip}` : ""}</option>
              ))}
            </select>
          </div>
          <Button onClick={handleGenerate} fullWidth>
            Export Sesuai Filter
          </Button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">{error}</div>
      )}

      {loading && (
        <div className="card p-4 text-sm text-[var(--text-secondary)]" role="status">Memuat ringkasan laporan...</div>
      )}

      {/* Report Summary */}
      {reportType === "attendance" && (
        <div className="card" style={{ padding: "16px" }}>
          <h3 className="text-sm font-semibold mb-1">Ringkasan Kehadiran</h3>
          <p className="mb-3 text-xs text-[var(--text-secondary)]">{REPORT_DESCRIPTIONS.attendance}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "16px" }}>
            <div style={{ textAlign: "center", padding: "12px", backgroundColor: "var(--bg-main)", borderRadius: "8px" }}>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Hadir</p>
              <p className="text-2xl font-bold text-[var(--success)]">{attendanceSummary?.totalPresent ?? 0}</p>
            </div>
            <div style={{ textAlign: "center", padding: "12px", backgroundColor: "var(--bg-main)", borderRadius: "8px" }}>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Tidak Hadir</p>
              <p className="text-2xl font-bold text-[var(--danger)]">{attendanceSummary?.totalAbsent ?? 0}</p>
            </div>
            <div style={{ textAlign: "center", padding: "12px", backgroundColor: "var(--bg-main)", borderRadius: "8px" }}>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Cuti/Izin</p>
              <p className="text-2xl font-bold text-[var(--warning)]">{attendanceSummary?.totalLeaveSickPermission ?? 0}</p>
            </div>
            <div style={{ textAlign: "center", padding: "12px", backgroundColor: "var(--bg-main)", borderRadius: "8px" }}>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Persentase</p>
              <p className="text-2xl font-bold text-[var(--primary)]">{attendanceSummary?.totalRecords ? Math.round(((attendanceSummary.totalPresent || 0) / attendanceSummary.totalRecords) * 100) : 0}%</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button variant="secondary" onClick={() => router.push('/dashboard/leave/balance')} fullWidth>
              Saldo Cuti & Riwayat
            </Button>
            <Button variant="secondary" onClick={() => router.push('/dashboard/leave')} fullWidth>
              Pengajuan Cuti Aktif
            </Button>
            <Button variant="secondary" onClick={() => handleExport('csv')} fullWidth>
              <Download size={16} className="shrink-0" aria-hidden="true" />
              Export CSV
            </Button>
            <Button variant="secondary" onClick={() => handleExport('pdf')} fullWidth>
              <Download size={16} className="shrink-0" aria-hidden="true" />
              Export PDF
            </Button>
          </div>
        </div>
      )}

      {reportType === "leave" && (
        <div className="card" style={{ padding: "16px" }}>
          <h3 className="text-sm font-semibold mb-1">Laporan Cuti</h3>
          <p className="mb-3 text-xs text-[var(--text-secondary)]">{REPORT_DESCRIPTIONS.leave}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "16px" }}>
            <div style={{ textAlign: "center", padding: "12px", backgroundColor: "var(--bg-main)", borderRadius: "8px" }}>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Export</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">CSV</p>
            </div>
            <div style={{ textAlign: "center", padding: "12px", backgroundColor: "var(--bg-main)", borderRadius: "8px" }}>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Data</p>
              <p className="text-2xl font-bold text-[var(--success)]">Real</p>
            </div>
            <div style={{ textAlign: "center", padding: "12px", backgroundColor: "var(--bg-main)", borderRadius: "8px" }}>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Audit</p>
              <p className="text-2xl font-bold text-[var(--warning)]">Audit</p>
            </div>
            <div style={{ textAlign: "center", padding: "12px", backgroundColor: "var(--bg-main)", borderRadius: "8px" }}>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Permission</p>
              <p className="text-2xl font-bold text-[var(--danger)]">RBAC</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button variant="secondary" onClick={() => handleExport('csv')} fullWidth>
              <Download size={16} className="shrink-0" aria-hidden="true" />
              Export CSV
            </Button>
            <Button variant="secondary" onClick={() => handleExport('pdf')} fullWidth>
              <Download size={16} className="shrink-0" aria-hidden="true" />
              Export PDF
            </Button>
          </div>
        </div>
      )}

      {reportType === "performance" && (
        <div className="card" style={{ padding: "16px" }}>
          <h3 className="text-sm font-semibold mb-1">Laporan Kinerja</h3>
          <p className="mb-3 text-xs text-[var(--text-secondary)]">{REPORT_DESCRIPTIONS.performance}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "16px" }}>
            <div style={{ textAlign: "center", padding: "12px", backgroundColor: "var(--bg-main)", borderRadius: "8px" }}>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Export</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">CSV</p>
            </div>
            <div style={{ textAlign: "center", padding: "12px", backgroundColor: "var(--bg-main)", borderRadius: "8px" }}>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Data</p>
              <p className="text-2xl font-bold text-[var(--success)]">Real</p>
            </div>
            <div style={{ textAlign: "center", padding: "12px", backgroundColor: "var(--bg-main)", borderRadius: "8px", gridColumn: "span 2" }}>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Superadmin</p>
              <p className="text-2xl font-bold text-[var(--primary)]">PDF</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button variant="secondary" onClick={() => handleExport('csv')} fullWidth>
              <Download size={16} className="shrink-0" aria-hidden="true" />
              Export CSV
            </Button>
            <Button variant="secondary" onClick={() => handleExport('pdf')} fullWidth>
              <Download size={16} className="shrink-0" aria-hidden="true" />
              Export PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
