"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCcw, MapPin, ShieldCheck, ShieldAlert, X } from "lucide-react";
import { fetchApiList } from "@/hooks/useDashboardQueries";
import type { SelfieReviewItem } from "@/services/attendance/attendance.service";

type Filter = "all" | "review";

function formatTime(value: string | Date): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function scorePercent(score: number | null): string {
  if (score === null || Number.isNaN(score)) return "—";
  return `${Math.round(score * 100)}%`;
}

function StatusBadge({ item }: { item: SelfieReviewItem }) {
  const review = item.needsReview;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "11px",
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: "999px",
        backgroundColor: review ? "rgba(220,38,38,0.12)" : "rgba(22,163,74,0.12)",
        color: review ? "#b91c1c" : "#15803d",
      }}
    >
      {review ? <ShieldAlert size={12} aria-hidden="true" /> : <ShieldCheck size={12} aria-hidden="true" />}
      {review ? "Perlu tinjauan" : "Terverifikasi"}
    </span>
  );
}

function SelfieDetailModal({ item, onClose }: { item: SelfieReviewItem; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Detail selfie ${item.employeeName}`}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 420, width: "100%", overflow: "hidden", padding: 0 }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700 }}>{item.employeeName}</h3>
          <button type="button" className="btn btn-secondary btn-icon" onClick={onClose} aria-label="Tutup">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {item.selfieUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.selfieUrl} loading="lazy" decoding="async" alt={`Selfie ${item.employeeName}`} style={{ width: "100%", maxHeight: 360, objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>Selfie tidak tersedia</div>
        )}
        <dl style={{ padding: "16px", display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 16px", fontSize: "13px", margin: 0 }}>
          <dt style={{ color: "var(--text-secondary)" }}>Waktu</dt>
          <dd style={{ margin: 0, textAlign: "right" }}>{formatTime(item.checkInTime)}</dd>
          <dt style={{ color: "var(--text-secondary)" }}>Geo-fence</dt>
          <dd style={{ margin: 0, textAlign: "right" }}>
            {item.geoStatus ?? "-"}
            {item.distanceMeters !== null ? ` · ${Math.round(item.distanceMeters)} m` : ""}
          </dd>
          <dt style={{ color: "var(--text-secondary)" }}>Skor liveness</dt>
          <dd style={{ margin: 0, textAlign: "right", fontFamily: "var(--font-mono, monospace)", fontWeight: 600 }}>
            {scorePercent(item.livenessScore)}
          </dd>
          <dt style={{ color: "var(--text-secondary)" }}>Status</dt>
          <dd style={{ margin: 0, textAlign: "right" }}><StatusBadge item={item} /></dd>
        </dl>
      </div>
    </div>
  );
}

export default function SelfieReviewGrid() {
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<SelfieReviewItem | null>(null);

  const { data, refetch, isFetching, isPending, isError } = useQuery({
    queryKey: ["attendance-selfie-review", filter],
    queryFn: () =>
      fetchApiList<SelfieReviewItem>(
        `/api/attendance/selfie-review${filter === "review" ? "?needsReview=true" : ""}`,
        "Data tinjauan selfie gagal dimuat.",
      ),
  });

  const items = useMemo(() => data ?? [], [data]);
  const reviewCount = useMemo(() => items.filter((i) => i.needsReview).length, [items]);

  return (
    <section className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }} aria-labelledby="selfie-review-title">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <h2 id="selfie-review-title" style={{ fontSize: "16px", fontWeight: 700 }}>Tinjauan Selfie</h2>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Audit bukti selfie & liveness check-in karyawan.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-icon"
          onClick={() => refetch()}
          aria-label="Muat ulang"
          disabled={isFetching}
        >
          <RefreshCcw size={16} aria-hidden="true" />
        </button>
      </div>

      <div role="tablist" aria-label="Filter tinjauan" style={{ display: "inline-flex", gap: "4px", padding: "4px", borderRadius: "10px", backgroundColor: "var(--surface-muted, #f3f4f6)", alignSelf: "flex-start" }}>
        {([["all", "Semua"], ["review", `Perlu tinjauan${reviewCount ? ` (${reviewCount})` : ""}`]] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={filter === value}
            onClick={() => setFilter(value)}
            className="btn"
            style={{
              fontSize: "13px",
              padding: "6px 14px",
              borderRadius: "8px",
              backgroundColor: filter === value ? "var(--primary)" : "transparent",
              color: "var(--text-primary)",
              fontWeight: filter === value ? 700 : 500,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {isPending ? (
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", padding: "24px 0", textAlign: "center" }}>Memuat…</p>
      ) : isError ? (
        <p role="alert" style={{ fontSize: "13px", color: "#b91c1c", padding: "24px 0", textAlign: "center" }}>Gagal memuat data tinjauan.</p>
      ) : items.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", padding: "24px 0", textAlign: "center" }}>
          {filter === "review" ? "Tidak ada selfie yang perlu ditinjau. 🎉" : "Belum ada data selfie."}
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
          {items.map((item) => (
            <li key={item.attendanceId}>
              <button
                type="button"
                onClick={() => setSelected(item)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: "1px solid var(--border, #e5e7eb)",
                  borderRadius: "12px",
                  overflow: "hidden",
                  backgroundColor: "var(--surface, #fff)",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
                aria-label={`Lihat selfie ${item.employeeName}, ${formatTime(item.checkInTime)}`}
              >
                <div style={{ position: "relative", aspectRatio: "1 / 1", backgroundColor: "#f3f4f6" }}>
                  {item.selfieUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.selfieUrl} loading="lazy" decoding="async" alt={`Selfie ${item.employeeName}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-secondary)", fontSize: "12px" }}>—</div>
                  )}
                  <span style={{ position: "absolute", top: 6, right: 6, fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "999px", backgroundColor: "rgba(0,0,0,0.6)", color: "#fff", fontFamily: "var(--font-mono, monospace)" }}>
                    {scorePercent(item.livenessScore)}
                  </span>
                </div>
                <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.employeeName}</span>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <MapPin size={11} aria-hidden="true" />{formatTime(item.checkInTime)}
                  </span>
                  <StatusBadge item={item} />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected ? <SelfieDetailModal item={selected} onClose={() => setSelected(null)} /> : null}
    </section>
  );
}
