"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, RefreshCcw, XCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getAuthHeaders } from "@/lib/auth-client";

interface AttendanceExceptionItem {
  id: string;
  attendanceId?: string | null;
  employeeId: string;
  type: string;
  status: string;
  reason: string;
  requestedBy: string;
  reviewedBy?: string | null;
  reviewNote?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  employee?: {
    fullName?: string;
    nip?: string;
    division?: string | null;
  } | null;
}

export default function AttendanceExceptionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<AttendanceExceptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");
  const [error, setError] = useState("");
  const [reviewNote, setReviewNote] = useState("Disetujui oleh reviewer absensi");
  const status = searchParams.get("status") || "PENDING";

  useEffect(() => {
    loadExceptions();
  }, [status]);

  const loadExceptions = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`/api/attendance/exceptions?status=${status}`, { headers: getAuthHeaders() });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Exception absensi gagal dimuat");
      }

      setItems(payload.data || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Exception absensi gagal dimuat");
    } finally {
      setLoading(false);
    }
  };

  const review = async (id: string, nextStatus: "APPROVED" | "REJECTED") => {
    try {
      setProcessingId(id);
      setError("");
      const response = await fetch(`/api/attendance/exceptions/${id}/review`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          status: nextStatus,
          reviewNote: reviewNote.trim() || (nextStatus === "APPROVED" ? "Disetujui" : "Ditolak"),
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Review gagal diproses");
      }

      await loadExceptions();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Review gagal diproses");
    } finally {
      setProcessingId("");
    }
  };

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
        <button type="button" onClick={() => router.back()} className="flex items-center gap-3 text-[var(--text-primary)]">
          <ArrowLeft size={24} />
          <span className="text-xl font-bold">Exception Absensi</span>
        </button>
        <Button variant="secondary" onClick={loadExceptions} disabled={loading}>
          <RefreshCcw size={16} className="mr-2" />
          Refresh
        </Button>
      </header>

      <div className="card" style={{ padding: "16px" }}>
        <p className="text-sm font-semibold text-[var(--text-primary)]">Catatan Review</p>
        <textarea
          className="input mt-2"
          rows={3}
          value={reviewNote}
          onChange={(event) => setReviewNote(event.target.value)}
          placeholder="Tulis alasan persetujuan atau penolakan"
        />
      </div>

      {error && (
        <div className="card" role="alert" style={{ padding: "16px", borderColor: "var(--danger)" }}>
          <p className="font-semibold text-[var(--danger)]">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="min-h-[320px] flex items-center justify-center">
          <LoadingSpinner message="Memuat exception absensi..." />
        </div>
      ) : items.length === 0 ? (
        <div className="card empty-state-card" style={{ padding: "24px", textAlign: "center" }}>
          <AlertTriangle size={36} className="mx-auto mb-3 text-[var(--text-muted)]" />
          <h2 className="text-lg font-semibold">Tidak ada exception absensi</h2>
          <p className="text-sm text-[var(--text-secondary)]">GPS, radius lokasi, selfie, dan koreksi yang butuh review akan muncul di sini.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <article key={item.id} className="card" style={{ padding: "16px" }}>
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--warning)]">{item.type}</p>
                    <h2 className="text-base font-semibold">{item.employee?.fullName || "Karyawan"}</h2>
                    <p className="text-xs text-[var(--text-muted)]">{item.employee?.nip || item.employeeId} • {item.employee?.division || "Tanpa divisi"}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[var(--warning-bg)] text-[var(--warning)]">{item.status}</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">{item.reason}</p>
                <p className="text-xs text-[var(--text-muted)]">Dibuat {new Date(item.createdAt).toLocaleString("id-ID")}</p>
                {item.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => review(item.id, "APPROVED")} loading={processingId === item.id}>
                      <CheckCircle2 size={14} className="mr-1" />
                      Setujui
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => review(item.id, "REJECTED")} loading={processingId === item.id}>
                      <XCircle size={14} className="mr-1" />
                      Tolak
                    </Button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
