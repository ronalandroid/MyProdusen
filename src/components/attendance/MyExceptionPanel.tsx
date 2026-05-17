"use client";

import { useCallback, useEffect, useState } from "react";
import { getAuthHeaders } from "@/lib/auth-client";

type ExceptionItem = {
  id: string;
  attendanceId?: string | null;
  type: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  reason: string;
  reviewNote?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
};

const SUBMITTABLE_TYPES = [
  { value: "MANUAL_ADJUSTMENT", label: "Koreksi absensi (manual)" },
  { value: "MISSING_CHECKOUT", label: "Lupa check-out" },
  { value: "LATE_CORRECTION", label: "Koreksi keterlambatan" },
  { value: "OUTSIDE_GEOFENCE", label: "Di luar radius lokasi" },
];

const STATUS_TONE: Record<ExceptionItem["status"], { bg: string; color: string; label: string }> = {
  PENDING: { bg: "rgba(245,158,11,0.16)", color: "var(--warning)", label: "Menunggu" },
  APPROVED: { bg: "rgba(34,197,94,0.12)", color: "var(--success)", label: "Disetujui" },
  REJECTED: { bg: "rgba(220,38,38,0.12)", color: "var(--danger)", label: "Ditolak" },
  CANCELLED: { bg: "rgba(120,120,120,0.16)", color: "var(--text-secondary)", label: "Dibatalkan" },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function MyExceptionPanel({ todayAttendanceId }: { todayAttendanceId?: string | null }) {
  const [items, setItems] = useState<ExceptionItem[]>([]);
  const [type, setType] = useState<string>("MANUAL_ADJUSTMENT");
  const [reason, setReason] = useState("");
  const [linkAttendance, setLinkAttendance] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/attendance/exceptions", {
        headers: getAuthHeaders(),
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Gagal memuat pengajuan.");
      }
      setItems((payload.data || []).slice(0, 10));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat pengajuan.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit() {
    setError(null);
    setMessage(null);
    if (reason.trim().length < 5) {
      setError("Alasan minimal 5 karakter.");
      return;
    }
    setIsSubmitting(true);
    try {
      const body: Record<string, unknown> = { type, reason: reason.trim() };
      if (linkAttendance && todayAttendanceId) {
        body.attendanceId = todayAttendanceId;
      }
      const response = await fetch("/api/attendance/exceptions", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Gagal mengirim pengajuan.");
      }
      setReason("");
      setMessage("Pengajuan berhasil dikirim. Menunggu review admin.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim pengajuan.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700 }}>Ajukan Koreksi Absensi</h2>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            Gunakan formulir ini jika ada kesalahan check-in/check-out atau Anda membutuhkan persetujuan absensi di luar radius.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="exception-type">Jenis pengajuan</label>
          <select
            id="exception-type"
            className="input"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            {SUBMITTABLE_TYPES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="exception-reason">Alasan</label>
          <textarea
            id="exception-reason"
            className="input"
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Jelaskan alasan koreksi minimal 5 karakter"
          />
        </div>

        {todayAttendanceId && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={linkAttendance}
              onChange={(event) => setLinkAttendance(event.target.checked)}
            />
            Hubungkan dengan absensi hari ini
          </label>
        )}

        {error && (
          <div role="alert" style={{ color: "var(--danger)", fontSize: "12px", fontWeight: 600 }}>{error}</div>
        )}
        {message && (
          <div role="status" style={{ color: "var(--success)", fontSize: "12px", fontWeight: 600 }}>{message}</div>
        )}

        <button
          type="button"
          className="btn btn-primary"
          onClick={submit}
          disabled={isSubmitting || reason.trim().length < 5}
          style={{ alignSelf: "flex-start" }}
        >
          {isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
        </button>
      </div>

      <div className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div className="flex items-center justify-between">
          <h2 style={{ fontSize: "16px", fontWeight: 700 }}>Pengajuan Saya</h2>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => void load()} disabled={isLoading}>
            Muat ulang
          </button>
        </div>

        {isLoading ? (
          <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Memuat pengajuan...</p>
        ) : items.length === 0 ? (
          <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Belum ada pengajuan koreksi.</p>
        ) : (
          <ul style={{ display: "flex", flexDirection: "column", gap: "10px", listStyle: "none", padding: 0, margin: 0 }}>
            {items.map((item) => {
              const tone = STATUS_TONE[item.status];
              return (
                <li key={item.id} style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: "12px", fontWeight: 600 }}>{item.type.replace(/_/g, " ")}</span>
                    <span
                      style={{
                        background: tone.bg,
                        color: tone.color,
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontSize: "11px",
                        fontWeight: 600,
                      }}
                    >
                      {tone.label}
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: 4 }}>{item.reason}</p>
                  {item.reviewNote && (
                    <p style={{ fontSize: "12px", color: "var(--text-primary)", marginTop: 4 }}>
                      <strong>Catatan reviewer:</strong> {item.reviewNote}
                    </p>
                  )}
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: 4 }}>
                    Dibuat {formatDate(item.createdAt)}
                    {item.reviewedAt ? ` · Direview ${formatDate(item.reviewedAt)}` : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
