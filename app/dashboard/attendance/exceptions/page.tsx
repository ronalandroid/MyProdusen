"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, CheckCircle2, RefreshCcw, Search, XCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getAuthHeaders } from "@/lib/auth-client";
import { fetchApiData } from "@/hooks/useDashboardQueries";

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

const PAGE_SIZE = 8;

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: "PENDING", label: "Menunggu" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "REJECTED", label: "Ditolak" },
  { value: "ALL", label: "Semua" },
];

const STATUS_TONE: Record<string, { bg: string; color: string; label: string }> = {
  PENDING: { bg: "rgba(245,158,11,0.16)", color: "var(--warning)", label: "Menunggu" },
  APPROVED: { bg: "rgba(34,197,94,0.12)", color: "var(--success)", label: "Disetujui" },
  REJECTED: { bg: "rgba(229,57,53,0.12)", color: "var(--danger)", label: "Ditolak" },
};

export default function AttendanceExceptionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState("");
  const [actionError, setActionError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const status = searchParams.get("status") || "PENDING";

  const exceptionsQuery = useQuery({
    queryKey: ["attendance-exceptions", status],
    queryFn: () => {
      const params = new URLSearchParams();
      if (status && status !== "ALL") params.set("status", status);
      return fetchApiData<AttendanceExceptionItem[]>(
        `/api/attendance/exceptions?${params.toString()}`,
        "Exception absensi gagal dimuat",
      );
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const items = exceptionsQuery.data || [];
  const loading = exceptionsQuery.isPending;
  const error = actionError || exceptionsQuery.error?.message || "";

  useEffect(() => {
    setPage(1);
  }, [status]);

  const filteredItems = useMemo(() => {
    const trimmed = searchTerm.trim().toLowerCase();
    if (!trimmed) return items;
    return items.filter((item) => {
      const haystack = `${item.employee?.fullName || ""} ${item.employee?.nip || ""} ${item.reason || ""} ${item.type || ""}`.toLowerCase();
      return haystack.includes(trimmed);
    });
  }, [items, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function setStatusFilter(nextStatus: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", nextStatus);
    router.replace(`?${params.toString()}`);
  }

  async function review(id: string, nextStatus: "APPROVED" | "REJECTED") {
    const note = (reviewNotes[id] || "").trim();
    if (nextStatus === "REJECTED" && note.length < 10) {
      setActionError("Catatan penolakan minimal 10 karakter.");
      return;
    }
    try {
      setProcessingId(id);
      setActionError("");
      const response = await fetch(`/api/attendance/exceptions/${id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          status: nextStatus,
          reviewNote: note || (nextStatus === "APPROVED" ? "Disetujui" : "Ditolak"),
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Review gagal diproses");
      }
      setReviewNotes((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      await queryClient.invalidateQueries({ queryKey: ["attendance-exceptions"] });
    } catch (reviewError) {
      setActionError(reviewError instanceof Error ? reviewError.message : "Review gagal diproses");
    } finally {
      setProcessingId("");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={() => router.back()} className="flex items-center gap-3 text-[var(--text-primary)] min-h-[44px]">
          <ArrowLeft size={24} aria-hidden="true" />
          <span className="text-xl font-bold">Approval Absensi</span>
        </button>
        <Button variant="secondary" onClick={() => queryClient.invalidateQueries({ queryKey: ["attendance-exceptions"] })} disabled={loading}>
          <RefreshCcw size={16} aria-hidden="true" />
          Refresh
        </Button>
      </header>

      <section className="card" aria-labelledby="approval-filter-title" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <h2 id="approval-filter-title" className="text-sm font-semibold">Filter</h2>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatusFilter(option.value)}
              className={`btn btn-sm ${status === option.value ? "btn-primary" : "btn-secondary"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div style={{ position: "relative" }}>
          <Search size={16} aria-hidden="true" style={{ position: "absolute", top: "50%", left: "12px", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="search"
            className="input"
            placeholder="Cari nama, NIP, atau alasan…"
            value={searchTerm}
            onChange={(event) => { setSearchTerm(event.target.value); setPage(1); }}
            style={{ paddingLeft: "36px" }}
            aria-label="Cari pengajuan"
          />
        </div>
      </section>

      {error && (
        <div className="card" role="alert" style={{ padding: "12px 16px", borderColor: "var(--danger)", color: "var(--danger)", fontSize: "13px", fontWeight: 600 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="min-h-[320px] flex items-center justify-center">
          <LoadingSpinner message="Memuat pengajuan…" />
        </div>
      ) : pageItems.length === 0 ? (
        <div className="card empty-state-card" style={{ padding: "24px", textAlign: "center" }}>
          <AlertTriangle size={36} className="mx-auto mb-3 text-[var(--text-muted)]" aria-hidden="true" />
          <h2 className="text-lg font-semibold">Tidak ada pengajuan</h2>
          <p className="text-sm text-[var(--text-secondary)]">Coba ubah filter atau tunggu pengajuan baru masuk.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pageItems.map((item) => {
            const tone = STATUS_TONE[item.status] || STATUS_TONE.PENDING;
            const note = reviewNotes[item.id] || "";
            const isProcessing = processingId === item.id;
            const requireReason = note.trim().length < 10;
            return (
              <article key={item.id} className="card" style={{ padding: "16px" }}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">{item.type}</p>
                      <h2 className="text-base font-semibold truncate">{item.employee?.fullName || "Karyawan"}</h2>
                      <p className="text-xs text-[var(--text-muted)]">{item.employee?.nip || item.employeeId} · {item.employee?.division || "Tanpa divisi"}</p>
                    </div>
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap"
                      style={{ background: tone.bg, color: tone.color }}
                    >
                      {tone.label}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">{item.reason}</p>
                  <p className="text-xs text-[var(--text-muted)]">Diajukan {new Date(item.createdAt).toLocaleString("id-ID")}</p>

                  {item.status === "PENDING" && (
                    <>
                      <label htmlFor={`review-note-${item.id}`} className="text-xs font-semibold text-[var(--text-primary)]">
                        Catatan review
                      </label>
                      <textarea
                        id={`review-note-${item.id}`}
                        className="input"
                        rows={3}
                        placeholder="Wajib diisi untuk penolakan. Minimal 10 karakter."
                        value={note}
                        onChange={(event) => setReviewNotes((prev) => ({ ...prev, [item.id]: event.target.value }))}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button size="sm" onClick={() => review(item.id, "APPROVED")} loading={isProcessing}>
                          <CheckCircle2 size={14} aria-hidden="true" /> Setujui
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => review(item.id, "REJECTED")}
                          loading={isProcessing}
                          disabled={isProcessing || requireReason}
                          aria-disabled={requireReason}
                        >
                          <XCircle size={14} aria-hidden="true" /> Tolak
                        </Button>
                      </div>
                    </>
                  )}
                  {item.status !== "PENDING" && item.reviewNote && (
                    <p className="text-xs text-[var(--text-muted)]">Catatan: {item.reviewNote}</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {filteredItems.length > 0 && (
        <nav className="pagination-compact" aria-label="Navigasi halaman approval">
          <button type="button" className="pagination-button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
            Prev
          </button>
          <span className="pagination-info">Hal. {page} / {totalPages}</span>
          <button type="button" className="pagination-button" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
            Next
          </button>
        </nav>
      )}
    </div>
  );
}
