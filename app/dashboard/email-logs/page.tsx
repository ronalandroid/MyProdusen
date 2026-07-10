"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, MinusCircle, RefreshCw, Search } from "lucide-react";
import { fetchApiData } from "@/hooks/useDashboardQueries";
import { useRealtime } from "@/hooks/useRealtime";

type EmailLog = {
  id: string;
  template: string;
  recipient: string;
  subject: string;
  status: "SENT" | "FAILED" | "SKIPPED" | string;
  errorMessage?: string | null;
  createdAt: string;
};

type EmailLogResponse = {
  logs: EmailLog[];
  summary: { sent: number; failed: number; skipped: number; windowDays: number };
};

const PAGE_SIZE = 25;
const STATUS_FILTERS = [
  { value: "", label: "Semua" },
  { value: "SENT", label: "Terkirim" },
  { value: "FAILED", label: "Gagal" },
  { value: "SKIPPED", label: "Dilewati" },
] as const;

const TEMPLATE_LABELS: Record<string, string> = {
  register: "Registrasi",
  "forgot-password": "Lupa Password",
  "reset-password": "Reset Password",
  "role-changed": "Role Diubah",
  "account-approved": "Akun Aktif",
  "payslip-ready": "Slip Gaji",
  custom: "Lainnya",
};

function getStatusBadge(status: string) {
  switch (status) {
    case "SENT": return { className: "badge-success", label: "Terkirim" };
    case "FAILED": return { className: "badge-danger", label: "Gagal" };
    case "SKIPPED": return { className: "badge-warning", label: "Dilewati" };
    default: return { className: "badge-primary", label: status };
  }
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default function EmailLogsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const offset = (page - 1) * PAGE_SIZE;
  const { data, isLoading, error, isFetching } = useQuery<EmailLogResponse>({
    queryKey: ["email-logs", page, statusFilter, search],
    queryFn: () => {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      return fetchApiData<EmailLogResponse>(`/api/admin/email-logs?${params.toString()}`, "Gagal mengambil log email", { cache: "no-store" });
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["email-logs"] });

  // New send attempts publish a dashboard.updated event with an email.* source,
  // so the table stays live without polling.
  useRealtime({
    eventTypes: ["dashboard.updated"],
    onEvent: (event) => {
      const source = (event.payload as { source?: string } | undefined)?.source;
      if (typeof source === "string" && source.startsWith("email.")) refresh();
    },
  });

  const logs = data?.logs ?? [];
  const summary = data?.summary;
  const hasNextPage = logs.length === PAGE_SIZE;

  const summaryCards = summary ? [
    { icon: CheckCircle2, label: "Terkirim", value: summary.sent, fg: "#1E6B43", bg: "#E5F2E9" },
    { icon: XCircle, label: "Gagal", value: summary.failed, fg: "#A93B30", bg: "#F9E9E7" },
    { icon: MinusCircle, label: "Dilewati", value: summary.skipped, fg: "#8A5A00", bg: "#FAF0DC" },
  ] : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em", margin: 0 }}>Log Email</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-secondary)" }}>
            Riwayat pengiriman email sistem: aktivasi akun, reset password, dan perubahan role.
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={refresh} disabled={isFetching} aria-label="Muat ulang log email" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={15} className={isFetching ? "animate-spin" : undefined} /> Refresh
        </button>
      </div>

      {/* Ringkasan 7 hari */}
      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
          {summaryCards.map(({ icon: Icon, label, value, fg, bg }) => (
            <div key={label} className="card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ display: "flex", width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 10, background: bg, color: fg, flexShrink: 0 }}>
                <Icon size={18} />
              </span>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-mono, monospace)", lineHeight: 1.1, color: fg }}>{value}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>{label} · {summary.windowDays} hari</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="card" style={{ padding: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }} role="group" aria-label="Filter status email">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value || "all"}
              type="button"
              className={statusFilter === f.value ? "btn btn-primary" : "btn btn-secondary"}
              style={{ padding: "7px 14px", fontSize: 12.5, fontWeight: 700 }}
              aria-pressed={statusFilter === f.value}
              onClick={() => { setStatusFilter(f.value); setPage(1); }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} aria-hidden />
          <input
            className="input"
            style={{ paddingLeft: 36 }}
            placeholder="Cari penerima atau subjek..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Cari log email"
          />
        </div>
      </div>

      {/* Tabel */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }}>Memuat log email...</div>
        ) : error ? (
          <div role="alert" style={{ padding: 32, textAlign: "center", color: "#A93B30", fontSize: 13 }}>{error.message || "Gagal memuat log email."}</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Belum ada log email</p>
            <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "var(--text-secondary)" }}>
              Log muncul otomatis saat sistem mengirim email aktivasi, reset password, atau perubahan role.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Waktu</th>
                  <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Template</th>
                  <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Penerima</th>
                  <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Subjek</th>
                  <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const badge = getStatusBadge(log.status);
                  return (
                    <tr key={log.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap", color: "var(--text-secondary)" }}>{formatDate(log.createdAt)}</td>
                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap", fontWeight: 700 }}>{TEMPLATE_LABELS[log.template] ?? log.template}</td>
                      <td style={{ padding: "12px 16px", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.recipient}</td>
                      <td style={{ padding: "12px 16px", maxWidth: 320 }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.subject}</div>
                        {log.status === "FAILED" && log.errorMessage && (
                          <div style={{ marginTop: 4, fontSize: 12, color: "#A93B30", wordBreak: "break-word" }}>{log.errorMessage.slice(0, 200)}</div>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}><span className={`badge ${badge.className}`}>{badge.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {(page > 1 || hasNextPage) && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid var(--border-color)" }}>
            <button type="button" className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} style={{ fontSize: 12.5 }}>
              Sebelumnya
            </button>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary)" }}>Halaman {page}</span>
            <button type="button" className="btn btn-secondary" disabled={!hasNextPage} onClick={() => setPage((p) => p + 1)} style={{ fontSize: 12.5 }}>
              Berikutnya
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
