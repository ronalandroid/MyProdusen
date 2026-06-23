"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, CheckCircle2, MapPin, RefreshCcw, Search, X, XCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getAuthHeaders } from "@/lib/auth-client";
import { fetchApiData, fetchApiList } from "@/hooks/useDashboardQueries";
import { type ValidityTier, validityLabel } from "@/lib/attendance/exception-validity";

interface ExceptionValidity {
  accuracyMeters?: number | null;
  distanceMeters?: number | null;
  geoStatus?: string | null;
  hasSelfie?: boolean;
  classification?: { tier: ValidityTier; score: number; reasons: string[] };
}

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
  validity?: ExceptionValidity | null;
  employee?: {
    fullName?: string;
    nip?: string;
    division?: string | null;
  } | null;
}

const VALIDITY_TONE: Record<ValidityTier, { bg: string; color: string }> = {
  VALID: { bg: "rgba(34,197,94,0.14)", color: "var(--success)" },
  REVIEW: { bg: "rgba(245,158,11,0.16)", color: "var(--warning)" },
  INVALID: { bg: "rgba(229,57,53,0.14)", color: "var(--danger)" },
};

interface ExceptionDetail extends AttendanceExceptionItem {
  attendance?: {
    id: string;
    checkInLatitude?: number;
    checkInLongitude?: number;
    checkInAccuracy?: number;
    checkInDistance?: number;
    checkInSelfieUrl?: string | null;
    checkInTime?: string;
    checkInGeoStatus?: string | null;
    status?: string;
  } | null;
}

function EvidenceDrawer({ exceptionId, onClose, onReviewed }: { exceptionId: string; onClose: () => void; onReviewed: () => void }) {
  const [note, setNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState("");

  const { data: detail, isPending } = useQuery({
    queryKey: ["exception-detail", exceptionId],
    queryFn: () => fetchApiData<ExceptionDetail>(`/api/attendance/exceptions/${exceptionId}`, "Detail gagal dimuat"),
    staleTime: 30_000,
  });

  async function review(nextStatus: "APPROVED" | "REJECTED") {
    const trimmedNote = note.trim();
    if (nextStatus === "REJECTED" && trimmedNote.length < 10) {
      setActionError("Catatan penolakan minimal 10 karakter.");
      return;
    }
    try {
      setProcessing(true);
      setActionError("");
      const res = await fetch(`/api/attendance/exceptions/${exceptionId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ status: nextStatus, reviewNote: trimmedNote || (nextStatus === "APPROVED" ? "Disetujui" : "Ditolak") }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) throw new Error(payload.error || "Review gagal");
      onReviewed();
      onClose();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Review gagal");
    } finally {
      setProcessing(false);
    }
  }

  const att = detail?.attendance;
  const hasGps = att && att.checkInLatitude != null && att.checkInLongitude != null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 50, backdropFilter: "blur(2px)" }}
        aria-hidden="true"
      />
      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Bukti Pengecualian Absensi"
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, width: "min(520px, 100vw)",
          background: "var(--bg-card)", zIndex: 51, display: "flex", flexDirection: "column",
          boxShadow: "-4px 0 32px rgba(28,32,38,0.12)",
          animation: "slideInRight 220ms ease-out",
        }}
      >
        <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>Bukti Pengecualian</div>
            {detail && (
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                {detail.employee?.fullName || "Karyawan"} · {detail.employee?.nip || detail.employeeId}
              </div>
            )}
          </div>
          <button type="button" onClick={onClose} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid var(--border-color)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {isPending ? (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
              <LoadingSpinner message="Memuat bukti…" />
            </div>
          ) : !detail ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)", paddingTop: 40 }}>Gagal memuat data.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* GPS Map Illustration */}
              <section style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border-color)" }}>
                <div style={{
                  height: 180, background: "linear-gradient(135deg, #E8F5E9 0%, #E3F2FD 100%)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  <MapPin size={40} color="#FFC107" strokeWidth={2} />
                  {hasGps ? (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                        {att!.checkInLatitude!.toFixed(6)}, {att!.checkInLongitude!.toFixed(6)}
                      </div>
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${att!.checkInLatitude}&mlon=${att!.checkInLongitude}&zoom=17`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 11, color: "#3D6B8F", textDecoration: "underline" }}
                      >
                        Buka di peta ↗
                      </a>
                    </>
                  ) : (
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Koordinat GPS tidak tersedia</div>
                  )}
                </div>

                {/* GPS stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: "1px solid var(--border-color)" }}>
                  {[
                    { label: "Jarak", value: att?.checkInDistance != null ? `${Math.round(att.checkInDistance)} m` : "–" },
                    { label: "Akurasi GPS", value: att?.checkInAccuracy != null ? `${Math.round(att.checkInAccuracy)} m` : "–" },
                    { label: "Status Geo", value: att?.checkInGeoStatus || "–" },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ padding: "10px 12px", textAlign: "center", borderRight: "1px solid var(--border-color)" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)", marginTop: 2, fontFamily: "var(--font-mono, monospace)" }}>{value}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Selfie */}
              <section>
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Foto Selfie</div>
                <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border-color)", background: "var(--bg-hover)", minHeight: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {att?.checkInSelfieUrl ? (
                    <img src={att.checkInSelfieUrl} alt="Selfie absensi" style={{ width: "100%", maxHeight: 260, objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                      <div style={{ fontSize: 12 }}>Foto tidak tersedia</div>
                    </div>
                  )}
                </div>
              </section>

              {/* Exception Info */}
              <section style={{ background: "var(--bg-hover)", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Detail Pengajuan</div>
                <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "6px 12px", fontSize: 13 }}>
                  <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Tipe</span>
                  <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{detail.type}</span>
                  <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Diajukan</span>
                  <span style={{ color: "var(--text-primary)" }}>{new Date(detail.createdAt).toLocaleString("id-ID")}</span>
                  <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Alasan</span>
                  <span style={{ color: "var(--text-primary)" }}>{detail.reason}</span>
                  <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Status</span>
                  <span style={{ color: STATUS_TONE[detail.status]?.color || "var(--text-primary)", fontWeight: 700 }}>{STATUS_TONE[detail.status]?.label || detail.status}</span>
                </div>
              </section>

              {/* Decision Timeline */}
              {detail.reviewedAt && (
                <section>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Timeline Keputusan</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {[
                      { label: "Diajukan", date: detail.createdAt, color: "#3D6B8F" },
                      { label: detail.status === "APPROVED" ? "Disetujui" : "Ditolak", date: detail.reviewedAt, color: detail.status === "APPROVED" ? "#1E6B43" : "#B3362B" },
                    ].map(({ label, date, color }, idx) => (
                      <div key={idx} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0, marginTop: 3 }} />
                          {idx === 0 && <div style={{ width: 2, height: 28, background: "var(--border-color)" }} />}
                        </div>
                        <div style={{ paddingBottom: 16 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color }}>{label}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{new Date(date).toLocaleString("id-ID")}</div>
                          {detail.reviewNote && idx === 1 && (
                            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, fontStyle: "italic" }}>&quot;{detail.reviewNote}&quot;</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Review actions for pending */}
              {detail.status === "PENDING" && (
                <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Keputusan</div>
                  {actionError && (
                    <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(179,54,43,0.08)", color: "#B3362B", fontSize: 12, fontWeight: 600 }}>
                      {actionError}
                    </div>
                  )}
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="input"
                    rows={3}
                    placeholder="Catatan review (wajib untuk penolakan, min. 10 karakter)"
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <Button onClick={() => review("APPROVED")} loading={processing}>
                      <CheckCircle2 size={14} /> Setujui
                    </Button>
                    <Button variant="danger" onClick={() => review("REJECTED")} loading={processing} disabled={processing || note.trim().length < 10}>
                      <XCircle size={14} /> Tolak
                    </Button>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
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
  const [evidenceId, setEvidenceId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkNote, setBulkNote] = useState("");
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);

  const status = searchParams.get("status") || "PENDING";

  const { data: exceptionsData, isPending: exceptionsPending, error: exceptionsError } = useQuery({
    queryKey: ["attendance-exceptions", status],
    queryFn: () => {
      const params = new URLSearchParams();
      if (status && status !== "ALL") params.set("status", status);
      return fetchApiList<AttendanceExceptionItem>(
        `/api/attendance/exceptions?${params.toString()}`,
        "Exception absensi gagal dimuat",
      );
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const items = exceptionsData || [];
  const loading = exceptionsPending;
  const error = actionError || exceptionsError?.message || "";

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

  // Only PENDING items on the current page are selectable for bulk review.
  const pendingPageItems = useMemo(() => pageItems.filter((i) => i.status === "PENDING"), [pageItems]);
  const allPageSelected = pendingPageItems.length > 0 && pendingPageItems.every((i) => selectedIds.has(i.id));

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAllPage() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pendingPageItems.forEach((i) => next.delete(i.id));
      } else {
        pendingPageItems.forEach((i) => next.add(i.id));
      }
      return next;
    });
  }

  // Clear selection whenever the status filter changes.
  useEffect(() => {
    setSelectedIds(new Set());
    setBulkNote("");
  }, [status]);

  // Shared chunked processor: the server caps each request at 200, so split
  // large selections and report cumulative progress.
  const CHUNK = 200;
  async function bulkReview(ids: string[], nextStatus: "APPROVED" | "REJECTED", note: string) {
    setBulkProcessing(true);
    setActionError("");
    setBulkProgress({ done: 0, total: ids.length });
    let processed = 0;
    let failed = 0;
    for (let i = 0; i < ids.length; i += CHUNK) {
      const slice = ids.slice(i, i + CHUNK);
      try {
        const response = await fetch(`/api/attendance/exceptions/bulk-review`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({ ids: slice, status: nextStatus, reviewNote: note }),
        });
        const payload = await response.json().catch(() => ({}));
        if (response.ok && payload.success) {
          processed += payload.data?.processed ?? 0;
          failed += payload.data?.failed ?? 0;
        } else {
          failed += slice.length;
        }
      } catch {
        failed += slice.length;
      }
      setBulkProgress({ done: Math.min(i + CHUNK, ids.length), total: ids.length });
    }
    setBulkProcessing(false);
    setBulkProgress(null);
    setSelectedIds(new Set());
    setBulkNote("");
    if (failed > 0) setActionError(`${failed} dari ${ids.length} gagal diproses. Coba lagi untuk sisanya.`);
    await queryClient.invalidateQueries({ queryKey: ["attendance-exceptions"] });
    return { processed, failed };
  }

  async function runBulk(nextStatus: "APPROVED" | "REJECTED") {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (nextStatus === "REJECTED" && bulkNote.trim().length < 10) {
      setActionError("Catatan penolakan massal minimal 10 karakter.");
      return;
    }
    const note = bulkNote.trim() || (nextStatus === "APPROVED" ? "Disetujui (massal)" : "Ditolak (massal)");
    await bulkReview(ids, nextStatus, note);
  }

  // --- Validity-based mass processing -------------------------------------
  // Group every PENDING item (across the whole filtered set, not just the
  // current page) by its data-validity tier so the reviewer can act per tier.
  const pendingByTier = useMemo(() => {
    const groups: Record<ValidityTier, AttendanceExceptionItem[]> = { VALID: [], REVIEW: [], INVALID: [] };
    for (const item of filteredItems) {
      if (item.status !== "PENDING") continue;
      const tier = item.validity?.classification?.tier ?? "REVIEW";
      groups[tier].push(item);
    }
    return groups;
  }, [filteredItems]);

  function selectTier(tier: ValidityTier) {
    setSelectedIds(new Set(pendingByTier[tier].map((i) => i.id)));
  }

  // One-shot: process every PENDING item of a validity tier directly.
  async function processTier(tier: ValidityTier, nextStatus: "APPROVED" | "REJECTED", note: string) {
    const ids = pendingByTier[tier].map((i) => i.id);
    if (ids.length === 0) return;
    await bulkReview(ids, nextStatus, note);
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

      {!loading && status === "PENDING" && (pendingByTier.VALID.length + pendingByTier.REVIEW.length + pendingByTier.INVALID.length) > 0 && (
        <div className="card" style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase" }}>Proses Massal Berdasarkan Validitas Data</div>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>Dikelompokkan dari akurasi GPS, jarak ke lokasi, dan bukti selfie.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {([
              { tier: "VALID" as const, label: "Valid", hint: "Aman disetujui" },
              { tier: "REVIEW" as const, label: "Perlu Ditinjau", hint: "Periksa manual" },
              { tier: "INVALID" as const, label: "Tidak Valid", hint: "Layak ditolak" },
            ]).map(({ tier, label, hint }) => {
              const tone = VALIDITY_TONE[tier];
              const count = pendingByTier[tier].length;
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => selectTier(tier)}
                  disabled={count === 0 || bulkProcessing}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                    padding: "10px 6px", borderRadius: 10, cursor: count > 0 ? "pointer" : "not-allowed",
                    border: `1.5px solid ${count > 0 ? tone.color + "55" : "var(--border-color)"}`,
                    background: count > 0 ? tone.bg : "var(--bg-hover)", opacity: count > 0 ? 1 : 0.6,
                  }}
                  title={`Pilih semua ${label.toLowerCase()}`}
                >
                  <span style={{ fontSize: 22, fontWeight: 900, color: count > 0 ? tone.color : "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>{count}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-primary)" }}>{label}</span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{hint}</span>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" style={{ borderTop: "1px solid var(--border-color)", paddingTop: 12 }}>
            <Button
              size="sm"
              onClick={() => processTier("VALID", "APPROVED", "Disetujui otomatis — data valid (akurasi GPS, lokasi, & selfie sesuai)")}
              loading={bulkProcessing}
              disabled={bulkProcessing || pendingByTier.VALID.length === 0}
            >
              <CheckCircle2 size={14} aria-hidden="true" /> Setujui semua Valid ({pendingByTier.VALID.length})
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => processTier("INVALID", "REJECTED", "Ditolak otomatis — data tidak valid (di luar radius / tanpa selfie / GPS tidak akurat)")}
              loading={bulkProcessing}
              disabled={bulkProcessing || pendingByTier.INVALID.length === 0}
            >
              <XCircle size={14} aria-hidden="true" /> Tolak semua Tidak Valid ({pendingByTier.INVALID.length})
            </Button>
          </div>
        </div>
      )}

      {!loading && pendingPageItems.length > 0 && (
        <div className="card" style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "var(--text-primary)" }}>
              <input type="checkbox" checked={allPageSelected} onChange={toggleSelectAllPage} style={{ width: 16, height: 16, accentColor: "var(--primary)" }} />
              Pilih semua di halaman ini ({pendingPageItems.length})
            </label>
            {selectedIds.size > 0 && (
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--primary-dark)" }}>{selectedIds.size} terpilih</span>
            )}
          </div>

          {selectedIds.size > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid var(--border-color)", paddingTop: 12 }}>
              <textarea
                className="input"
                rows={2}
                placeholder="Catatan untuk aksi massal (wajib min. 10 karakter bila menolak)"
                value={bulkNote}
                onChange={(e) => setBulkNote(e.target.value)}
                aria-label="Catatan aksi massal"
              />
              {bulkProgress && (
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                  Memproses {bulkProgress.done}/{bulkProgress.total}…
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button size="sm" onClick={() => runBulk("APPROVED")} loading={bulkProcessing} disabled={bulkProcessing}>
                  <CheckCircle2 size={14} aria-hidden="true" /> Setujui {selectedIds.size} terpilih
                </Button>
                <Button size="sm" variant="danger" onClick={() => runBulk("REJECTED")} loading={bulkProcessing} disabled={bulkProcessing || bulkNote.trim().length < 10}>
                  <XCircle size={14} aria-hidden="true" /> Tolak {selectedIds.size} terpilih
                </Button>
              </div>
            </div>
          )}
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
                    <div className="flex items-start gap-3 min-w-0">
                      {item.status === "PENDING" && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          aria-label={`Pilih pengajuan ${item.employee?.fullName || "karyawan"}`}
                          style={{ width: 16, height: 16, marginTop: 3, accentColor: "var(--primary)", flexShrink: 0 }}
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">{item.type}</p>
                        <h2 className="text-base font-semibold truncate">{item.employee?.fullName || "Karyawan"}</h2>
                        <p className="text-xs text-[var(--text-muted)]">{item.employee?.nip || item.employeeId} · {item.employee?.division || "Tanpa divisi"}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap"
                        style={{ background: tone.bg, color: tone.color }}
                      >
                        {tone.label}
                      </span>
                      {item.status === "PENDING" && item.validity?.classification && (
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{ background: VALIDITY_TONE[item.validity.classification.tier].bg, color: VALIDITY_TONE[item.validity.classification.tier].color }}
                          title={item.validity.classification.reasons.join(" · ")}
                        >
                          {validityLabel(item.validity.classification.tier)} · {item.validity.classification.score}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">{item.reason}</p>
                  <p className="text-xs text-[var(--text-muted)]">Diajukan {new Date(item.createdAt).toLocaleString("id-ID")}</p>

                  <button
                    type="button"
                    onClick={() => setEvidenceId(item.id)}
                    style={{ alignSelf: "flex-start", fontSize: 12, fontWeight: 700, color: "#3D6B8F", background: "rgba(61,107,143,0.08)", border: "none", borderRadius: 8, padding: "5px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <MapPin size={12} /> Lihat Bukti
                  </button>

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

      {evidenceId && (
        <EvidenceDrawer
          exceptionId={evidenceId}
          onClose={() => setEvidenceId(null)}
          onReviewed={() => queryClient.invalidateQueries({ queryKey: ["attendance-exceptions"] })}
        />
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
