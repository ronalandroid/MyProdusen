"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApiData, fetchApiList } from "@/hooks/useDashboardQueries";

type AuditLog = {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
};

const PAGE_SIZE = 25;
const EMPTY_AUDIT_LOGS: AuditLog[] = [];

function getActionBadge(action: string) {
  switch (action) {
    case "LOGIN": return { className: "badge-info", label: "Login" };
    case "CREATE": return { className: "badge-success", label: "Create" };
    case "UPDATE": return { className: "badge-warning", label: "Update" };
    case "DELETE": return { className: "badge-danger", label: "Delete" };
    case "CHECK_IN": return { className: "badge-success", label: "Check-in" };
    case "CHECK_OUT": return { className: "badge-info", label: "Check-out" };
    case "APPROVE": return { className: "badge-success", label: "Approve" };
    case "REJECT": return { className: "badge-danger", label: "Reject" };
    case "EXPORT": return { className: "badge-primary", label: "Export" };
    case "DOWNLOAD_PDF": return { className: "badge-primary", label: "PDF" };
    case "SELFIE_VIEW": return { className: "badge-warning", label: "Selfie" };
    default: return { className: "badge-primary", label: action };
  }
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function logDetail(log: AuditLog) {
  if (log.newValue) {
    try {
      const parsed = JSON.parse(log.newValue);
      if (parsed?.message) return String(parsed.message);
      if (parsed?.reportType) return `Report: ${parsed.reportType}`;
      if (parsed?.email) return `Email: ${parsed.email}`;
    } catch {
      return log.newValue.slice(0, 120);
    }
  }
  if (log.entityId) return `ID: ${log.entityId}`;
  return "Tidak ada detail tambahan";
}

export default function AuditPage() {
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
  const { data: logsData, isLoading: logsLoading, error: logsError } = useQuery<AuditLog[]>({
    queryKey: ["audit", page, search, PAGE_SIZE, offset],
    queryFn: () => {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
      });
      if (search) params.set("search", search);
      return fetchApiList<AuditLog>(`/api/audit?${params.toString()}`, "Gagal mengambil audit log", { cache: "no-store" });
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
  const logs = logsData ?? EMPTY_AUDIT_LOGS;
  const loading = logsLoading;
  const error = logsError?.message || "";
  const loadLogs = () => queryClient.invalidateQueries({ queryKey: ["audit"] });

  const hasNextPage = logs.length === PAGE_SIZE;

  const csvContent = useMemo(() => {
    const headers = ["Waktu", "User ID", "Aksi", "Entity", "Entity ID", "IP", "Detail"];
    const rows = logs.map((log) => [
      formatDate(log.createdAt),
      log.userId,
      log.action,
      log.entity,
      log.entityId || "",
      log.ipAddress || "",
      logDetail(log),
    ]);
    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
  }, [logs]);

  function exportCsv() {
    if (!logs.length) return;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `myprodusen-audit-page-${page}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">🔍 Audit Log</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Riwayat aktivitas sistem dari database produksi</p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm w-full sm:w-auto" onClick={exportCsv} disabled={!logs.length || loading}>
          📤 Export halaman ini
        </button>
      </div>

      <div className="card p-4 sm:p-5">
        <label className="mb-2 block text-xs font-bold text-[var(--text-secondary)]" htmlFor="audit-search">Cari audit log</label>
        <div className="input-group max-w-xl">
          <span className="input-icon text-sm">🔍</span>
          <input
            id="audit-search"
            className="input"
            placeholder="Cari user ID, aksi, entity, IP, atau detail..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="card border border-[var(--danger)]/30 bg-red-50 p-4 text-sm text-[var(--danger)]" role="alert">
          {error}
          <button type="button" className="btn btn-secondary btn-sm ml-3" onClick={loadLogs}>Coba lagi</button>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--text-secondary)]" role="status">Memuat audit log...</div>
        ) : !logs.length ? (
          <div className="p-8 text-center text-sm text-[var(--text-secondary)]" role="status">
            Tidak ada audit log untuk filter ini.
          </div>
        ) : (
          <div className="table-container border-0">
            <table className="table min-w-[860px]">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>User ID</th>
                  <th>Aksi</th>
                  <th>Entity</th>
                  <th>Detail</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const badge = getActionBadge(log.action);
                  return (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap font-mono text-xs text-[var(--text-muted)]">{formatDate(log.createdAt)}</td>
                      <td>
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="avatar avatar-sm h-7 w-7 shrink-0 text-[11px]">{log.userId.charAt(0).toUpperCase()}</div>
                          <span className="max-w-[180px] truncate text-xs font-semibold sm:text-sm">{log.userId}</span>
                        </div>
                      </td>
                      <td><span className={`badge ${badge.className}`}>{badge.label}</span></td>
                      <td><span className="text-sm font-semibold">{log.entity}</span></td>
                      <td className="max-w-[260px] truncate text-sm text-[var(--text-secondary)]">{logDetail(log)}</td>
                      <td className="font-mono text-xs text-[var(--text-muted)]">{log.ipAddress || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[var(--text-muted)]">Halaman {page}. Filter diproses server-side dan dibatasi {PAGE_SIZE} baris per halaman.</p>
        <nav className="pagination-compact" aria-label="Navigasi halaman audit">
          <button type="button" className="pagination-button" disabled={page === 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))}>Prev</button>
          <span className="pagination-info">Hal. {page}</span>
          <button type="button" className="pagination-button" disabled={!hasNextPage || loading} onClick={() => setPage((current) => current + 1)}>Next</button>
        </nav>
      </div>
    </div>
  );
}
