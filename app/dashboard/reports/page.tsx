"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, FileText, Calendar, Users, Clock } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function ReportsPage() {
  const router = useRouter();
  const [loading] = useState(false);
  const [reportType, setReportType] = useState("attendance");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("all");

  // Placeholder data - will be replaced with real API calls when backend is ready
  const reportSummary = {
    attendance: {
      totalDays: 20,
      present: 18,
      absent: 1,
      leave: 1,
      percentage: 90,
    },
    leave: {
      totalRequests: 5,
      approved: 3,
      pending: 1,
      rejected: 1,
    },
    performance: {
      totalEmployees: 25,
      avgScore: 85,
      topPerformers: 8,
    },
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    // Placeholder - will be implemented when backend is ready
    alert(`Export ${format.toUpperCase()} akan tersedia setelah backend API siap`);
  };

  const handleGenerate = () => {
    // Placeholder - will be implemented when backend is ready
    alert("Generate report akan tersedia setelah backend API siap");
  };

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px", position: "relative", minHeight: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => router.back()}>
          <ArrowLeft size={24} />
          <h1 style={{ fontSize: "20px", fontWeight: 700 }}>Laporan</h1>
        </div>
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
          <p className="text-sm font-semibold text-[var(--info)] mb-1">Fitur dalam pengembangan</p>
          <p className="text-xs text-[var(--text-secondary)]">
            Backend API untuk laporan sedang dalam pengembangan. Data yang ditampilkan adalah contoh placeholder.
          </p>
        </div>
      </div>

      {/* Report Type Selection */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          Jenis Laporan
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
          <button
            onClick={() => setReportType("attendance")}
            className={`p-3 rounded-lg border transition-all ${
              reportType === "attendance"
                ? "border-[var(--primary)] bg-[var(--warning-bg)]"
                : "border-[var(--border-color)] bg-white"
            }`}
          >
            <Clock size={20} className="mx-auto mb-1" color={reportType === "attendance" ? "var(--primary)" : "var(--text-muted)"} />
            <p className="text-xs font-medium">Kehadiran</p>
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
        </div>
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
              <option value="1">Deni Lesmana</option>
              <option value="2">Rina Putri</option>
              <option value="3">Budi Santoso</option>
            </select>
          </div>
          <Button onClick={handleGenerate} fullWidth>
            Generate Laporan
          </Button>
        </div>
      </div>

      {/* Report Summary */}
      {reportType === "attendance" && (
        <div className="card" style={{ padding: "16px" }}>
          <h3 className="text-sm font-semibold mb-3">Ringkasan Kehadiran</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "16px" }}>
            <div style={{ textAlign: "center", padding: "12px", backgroundColor: "var(--bg-main)", borderRadius: "8px" }}>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Hadir</p>
              <p className="text-2xl font-bold text-[var(--success)]">{reportSummary.attendance.present}</p>
            </div>
            <div style={{ textAlign: "center", padding: "12px", backgroundColor: "var(--bg-main)", borderRadius: "8px" }}>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Tidak Hadir</p>
              <p className="text-2xl font-bold text-[var(--danger)]">{reportSummary.attendance.absent}</p>
            </div>
            <div style={{ textAlign: "center", padding: "12px", backgroundColor: "var(--bg-main)", borderRadius: "8px" }}>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Cuti/Izin</p>
              <p className="text-2xl font-bold text-[var(--warning)]">{reportSummary.attendance.leave}</p>
            </div>
            <div style={{ textAlign: "center", padding: "12px", backgroundColor: "var(--bg-main)", borderRadius: "8px" }}>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Persentase</p>
              <p className="text-2xl font-bold text-[var(--primary)]">{reportSummary.attendance.percentage}%</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button variant="secondary" onClick={() => handleExport('csv')} fullWidth>
              <Download size={16} className="mr-2" />
              Export CSV
            </Button>
            <Button variant="secondary" onClick={() => handleExport('pdf')} fullWidth>
              <Download size={16} className="mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      )}

      {reportType === "leave" && (
        <div className="card" style={{ padding: "16px" }}>
          <h3 className="text-sm font-semibold mb-3">Ringkasan Cuti</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "16px" }}>
            <div style={{ textAlign: "center", padding: "12px", backgroundColor: "var(--bg-main)", borderRadius: "8px" }}>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Total Pengajuan</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{reportSummary.leave.totalRequests}</p>
            </div>
            <div style={{ textAlign: "center", padding: "12px", backgroundColor: "var(--bg-main)", borderRadius: "8px" }}>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Disetujui</p>
              <p className="text-2xl font-bold text-[var(--success)]">{reportSummary.leave.approved}</p>
            </div>
            <div style={{ textAlign: "center", padding: "12px", backgroundColor: "var(--bg-main)", borderRadius: "8px" }}>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Menunggu</p>
              <p className="text-2xl font-bold text-[var(--warning)]">{reportSummary.leave.pending}</p>
            </div>
            <div style={{ textAlign: "center", padding: "12px", backgroundColor: "var(--bg-main)", borderRadius: "8px" }}>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Ditolak</p>
              <p className="text-2xl font-bold text-[var(--danger)]">{reportSummary.leave.rejected}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button variant="secondary" onClick={() => handleExport('csv')} fullWidth>
              <Download size={16} className="mr-2" />
              Export CSV
            </Button>
            <Button variant="secondary" onClick={() => handleExport('pdf')} fullWidth>
              <Download size={16} className="mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      )}

      {reportType === "performance" && (
        <div className="card" style={{ padding: "16px" }}>
          <h3 className="text-sm font-semibold mb-3">Ringkasan Kinerja</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "16px" }}>
            <div style={{ textAlign: "center", padding: "12px", backgroundColor: "var(--bg-main)", borderRadius: "8px" }}>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Total Karyawan</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{reportSummary.performance.totalEmployees}</p>
            </div>
            <div style={{ textAlign: "center", padding: "12px", backgroundColor: "var(--bg-main)", borderRadius: "8px" }}>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Rata-rata Skor</p>
              <p className="text-2xl font-bold text-[var(--success)]">{reportSummary.performance.avgScore}</p>
            </div>
            <div style={{ textAlign: "center", padding: "12px", backgroundColor: "var(--bg-main)", borderRadius: "8px", gridColumn: "span 2" }}>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Top Performers</p>
              <p className="text-2xl font-bold text-[var(--primary)]">{reportSummary.performance.topPerformers}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button variant="secondary" onClick={() => handleExport('csv')} fullWidth>
              <Download size={16} className="mr-2" />
              Export CSV
            </Button>
            <Button variant="secondary" onClick={() => handleExport('pdf')} fullWidth>
              <Download size={16} className="mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
