"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Calendar, Clock } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useToast } from "@/components/ui/Toast";
import { fetchProfile, getAuthHeaders } from "@/lib/auth-client";

interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  employee: {
    fullName: string;
    nip: string;
  };
  approvedBy?: {
    fullName: string;
  } | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
}

interface LeaveBalance {
  year: number;
  entitlement: number;
  used: number;
  pending: number;
  available: number;
}

export default function LeavePage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [role, setRole] = useState<string>("EMPLOYEE");
  const [formData, setFormData] = useState({
    type: "LEAVE",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLeaveRequests();
  }, [statusFilter]);

  useEffect(() => {
    fetchProfile()
      .then((profile) => setRole(profile.role || "EMPLOYEE"))
      .catch(() => setRole("EMPLOYEE"));
  }, []);

  const canApproveLeave = role === "SUPERADMIN";

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      
      const response = await fetch(`/api/leave?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      const balanceResponse = await fetch('/api/leave/balance', {
        headers: getAuthHeaders(),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setLeaveRequests(data.data || []);
      } else {
        showError(data.error || "Gagal memuat data cuti");
      }

      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        if (balanceData.success) {
          setLeaveBalance(balanceData.data);
        }
      }
    } catch (err) {
      showError("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      type: "LEAVE",
      startDate: "",
      endDate: "",
      reason: "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/leave", {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        success(data.message || "Pengajuan cuti berhasil dibuat");
        setIsModalOpen(false);
        fetchLeaveRequests();
      } else {
        showError(data.error || "Gagal membuat pengajuan");
      }
    } catch (err) {
      showError("Terjadi kesalahan saat membuat pengajuan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/leave/${id}/approve`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ overrideReason: "Persetujuan Superadmin melalui dashboard." }),
      });

      const data = await response.json();

      if (data.success) {
        success(data.message || "Pengajuan berhasil disetujui");
        setLeaveRequests((current) => current
          .map((leave) => leave.id === id ? { ...leave, status: "APPROVED", approvedAt: new Date().toISOString() } : leave)
          .filter((leave) => statusFilter !== "PENDING" || leave.id !== id));
        setIsDetailModalOpen(false);
        await fetchLeaveRequests();
      } else {
        showError(data.error || "Gagal menyetujui pengajuan");
      }
    } catch (err) {
      showError("Terjadi kesalahan saat menyetujui pengajuan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (id: string) => {
    const trimmedReason = rejectReason.trim();
    if (trimmedReason.length < 10) {
      showError("Alasan penolakan minimal 10 karakter");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/leave/${id}/reject`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: trimmedReason,
          overrideReason: "Penolakan Superadmin melalui dashboard.",
        }),
      });

      const data = await response.json();

      if (data.success) {
        success(data.message || "Pengajuan berhasil ditolak");
        setLeaveRequests((current) => current
          .map((leave) => leave.id === id ? { ...leave, status: "REJECTED", rejectionReason: trimmedReason, rejectedAt: new Date().toISOString() } : leave)
          .filter((leave) => statusFilter !== "PENDING" || leave.id !== id));
        setIsDetailModalOpen(false);
        setRejectReason("");
        await fetchLeaveRequests();
      } else {
        showError(data.error || "Gagal menolak pengajuan");
      }
    } catch (err) {
      showError("Terjadi kesalahan saat menolak pengajuan");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: { label: "Menunggu", className: "badge-warning" },
      APPROVED: { label: "Disetujui", className: "badge-success" },
      REJECTED: { label: "Ditolak", className: "badge-danger" },
    };
    
    const statusInfo = statusMap[status] || { label: status, className: "" };
    return <span className={`badge ${statusInfo.className}`}>{statusInfo.label}</span>;
  };

  const getTypeBadge = (type: string) => {
    const typeMap: Record<string, string> = {
      LEAVE: "Cuti",
      SICK: "Sakit",
      PERMISSION: "Izin",
    };
    return typeMap[type] || type;
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="phone-screen feature-screen" style={{ display: "flex", flexDirection: "column", gap: "20px", position: "relative", minHeight: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => router.back()}>
          <ArrowLeft size={24} />
          <h1 style={{ fontSize: "20px", fontWeight: 700 }}>Cuti & Izin</h1>
        </div>
      </div>

      <section className="sync-strip" aria-label="Alur data cuti">
        <span>Frontend</span><span aria-hidden="true">→</span><span>API</span><span aria-hidden="true">→</span><span>Leave Service</span><span aria-hidden="true">→</span><span>Drizzle</span><span aria-hidden="true">→</span><span>PostgreSQL</span>
      </section>

      <section className="card" aria-labelledby="leave-sync-title" style={{ padding: "16px", borderColor: "rgba(255,193,7,.42)" }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Workflow Cuti</p>
            <h2 id="leave-sync-title" className="text-lg font-bold">Pengajuan, saldo, overlap, approval</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Pengajuan mulai pending. Overlap ditolak backend, penolakan wajib alasan, dan Superadmin approval tercatat audit.</p>
          </div>
          <span className="badge badge-warning">{canApproveLeave ? "Mode Approval" : "Mode Karyawan"}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="api-pill">API: /api/leave</span>
          <span className="api-pill">API: /api/leave/balance</span>
          <span className="api-pill">Approval: /approve · /reject</span>
        </div>
      </section>

      {leaveBalance && (
        <section className="card" style={{ padding: "16px" }} aria-label="Saldo cuti">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Saldo Cuti {leaveBalance.year}</p>
              <h2 className="text-lg font-bold">{leaveBalance.available} hari tersedia</h2>
            </div>
            <button type="button" onClick={() => router.push("/dashboard/leave/balance")} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "white", cursor: "pointer", fontSize: "12px", fontWeight: 500 }}><Calendar size={16} />Detail</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 8rem), 1fr))", gap: "8px" }}>
            <div style={{ backgroundColor: "var(--bg-main)", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
              <p className="text-[11px] text-[var(--text-secondary)]">Jatah</p>
              <p className="text-sm font-bold">{leaveBalance.entitlement}</p>
            </div>
            <div style={{ backgroundColor: "var(--bg-main)", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
              <p className="text-[11px] text-[var(--text-secondary)]">Terpakai</p>
              <p className="text-sm font-bold text-[var(--danger)]">{leaveBalance.used}</p>
            </div>
            <div style={{ backgroundColor: "var(--bg-main)", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
              <p className="text-[11px] text-[var(--text-secondary)]">Pending</p>
              <p className="text-sm font-bold text-[var(--warning)]">{leaveBalance.pending}</p>
            </div>
          </div>
        </section>
      )}

      {/* Filter */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <select
          className="input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ appearance: "none", backgroundColor: "white" }}
        >
          <option value="all">Semua Status</option>
          <option value="PENDING">Menunggu</option>
          <option value="APPROVED">Disetujui</option>
          <option value="REJECTED">Ditolak</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" message="Memuat data cuti..." />
        </div>
      ) : leaveRequests.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-secondary)]">
          Belum ada pengajuan cuti
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "24px" }}>
          {leaveRequests.map((leave) => (
            <div
              key={leave.id}
              onClick={() => {
                setSelectedLeave(leave);
                setIsDetailModalOpen(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid var(--border-color)",
                paddingBottom: "16px",
                cursor: "pointer",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>{getTypeBadge(leave.type)}</span>
                  {getStatusBadge(leave.status)}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Calendar size={14} />
                  {formatDate(leave.startDate)} - {formatDate(leave.endDate)} ({calculateDays(leave.startDate, leave.endDate)} hari)
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  {leave.employee?.fullName || "Karyawan"} • {leave.employee?.nip || "-"}
                </div>
                {leave.status === "REJECTED" && leave.rejectionReason && (
                  <div style={{ fontSize: "12px", color: "var(--danger)", marginTop: "4px" }}>
                    Alasan penolakan: {leave.rejectionReason}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                aria-label={`Buka riwayat detail ${leave.employee?.fullName || "karyawan"}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedLeave(leave);
                  setRejectReason(leave.rejectionReason || "");
                  setIsDetailModalOpen(true);
                }}
                style={{ minHeight: "44px", padding: "8px 12px", fontSize: "12px" }}
              >
                Buka Riwayat Detail
              </button>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button className="fab" onClick={handleCreate} aria-label="Ajukan cuti baru">
        <Plus size={24} aria-hidden="true" />
      </button>

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Ajukan Cuti/Izin"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} loading={submitting}>
              Ajukan
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Jenis
            </label>
            <select
              className="input"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
            >
              <option value="LEAVE">Cuti</option>
              <option value="SICK">Sakit</option>
              <option value="PERMISSION">Izin</option>
            </select>
          </div>
          <Input
            label="Tanggal Mulai"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
          <Input
            label="Tanggal Selesai"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Alasan
            </label>
            <textarea
              className="input"
              rows={4}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Jelaskan alasan pengajuan..."
              required
              style={{ resize: "vertical" }}
            />
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detail Pengajuan"
        size="lg"
        footer={
          selectedLeave?.status === "PENDING" && canApproveLeave ? (
            <>
              <Button variant="danger" onClick={() => handleReject(selectedLeave.id)} loading={submitting}>
                Tolak
              </Button>
              <Button onClick={() => handleApprove(selectedLeave.id)} loading={submitting}>
                Setujui
              </Button>
            </>
          ) : undefined
        }
      >
        {selectedLeave && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Jenis</p>
              <p className="text-sm font-semibold">{getTypeBadge(selectedLeave.type)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Status</p>
              {getStatusBadge(selectedLeave.status)}
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Karyawan</p>
              <p className="text-sm font-semibold">{selectedLeave.employee?.fullName || "Karyawan"}</p>
              <p className="text-xs text-[var(--text-muted)]">{selectedLeave.employee?.nip || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Periode</p>
              <p className="text-sm">{formatDate(selectedLeave.startDate)} - {formatDate(selectedLeave.endDate)}</p>
              <p className="text-xs text-[var(--text-muted)]">{calculateDays(selectedLeave.startDate, selectedLeave.endDate)} hari</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Alasan</p>
              <p className="text-sm">{selectedLeave.reason}</p>
            </div>
            {selectedLeave.status === "PENDING" && canApproveLeave && (
              <div>
                <label htmlFor="reject-reason" className="block text-xs text-[var(--text-secondary)] mb-1">
                  Alasan Penolakan
                </label>
                <textarea
                  id="reject-reason"
                  className="input"
                  rows={3}
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  placeholder="Wajib diisi jika pengajuan ditolak..."
                  aria-describedby="reject-reason-help"
                  style={{ resize: "vertical" }}
                />
                <p id="reject-reason-help" className="mt-1 text-xs text-[var(--text-muted)]">
                  Minimal 10 karakter untuk audit dan notifikasi karyawan.
                </p>
              </div>
            )}
            {selectedLeave.approvedBy && (
              <div>
                <p className="text-xs text-[var(--text-secondary)] mb-1">Disetujui oleh</p>
                <p className="text-sm">{selectedLeave.approvedBy.fullName}</p>
                <p className="text-xs text-[var(--text-muted)]">{selectedLeave.approvedAt ? formatDate(selectedLeave.approvedAt) : ""}</p>
              </div>
            )}
            {selectedLeave.status === "REJECTED" && selectedLeave.rejectionReason && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3" role="status">
                <p className="text-xs text-red-700 mb-1">Riwayat penolakan</p>
                <p className="text-sm font-semibold text-red-800">Alasan penolakan: {selectedLeave.rejectionReason}</p>
                <p className="text-xs text-red-700">Ditolak {selectedLeave.rejectedAt ? formatDate(selectedLeave.rejectedAt) : "oleh reviewer"}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
