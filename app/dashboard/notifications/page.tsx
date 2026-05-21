"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Bell, CheckCircle2, RefreshCcw, Trash2, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getAuthHeaders } from "@/lib/auth-client";
import { useRealtime } from "@/hooks/useRealtime";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [pendingDelete, setPendingDelete] = useState<NotificationItem | null>(null);

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const realtime = useRealtime({
    eventTypes: ["notification.created", "notification.read"],
    onEvent: () => loadNotifications(),
  });

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");
      const url = filter === "unread" ? "/api/notifications?unread=true" : "/api/notifications";
      const response = await fetch(url, { headers: getAuthHeaders() });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Notifikasi gagal dimuat");
      }

      setItems(Array.isArray(payload.data) ? payload.data : payload.data?.items || []);
    } catch (notificationError) {
      setError(notificationError instanceof Error ? notificationError.message : "Notifikasi gagal dimuat");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        setItems((current) => current.map((item) => item.id === id ? { ...item, isRead: true } : item));
      }
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      setProcessing(true);
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
        headers: getAuthHeaders(),
      });

      const payload = await response.json();

      if (response.ok && payload.success) {
        setItems((current) => current.map((item) => ({ ...item, isRead: true })));
      } else {
        throw new Error(payload.error || "Gagal menandai semua sebagai dibaca");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menandai semua sebagai dibaca");
    } finally {
      setProcessing(false);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      setProcessing(true);
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const payload = await response.json();

      if (response.ok && payload.success) {
        setItems((current) => current.filter((item) => item.id !== id));
        setPendingDelete(null);
      } else {
        throw new Error(payload.error || "Gagal menghapus notifikasi");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus notifikasi");
    } finally {
      setProcessing(false);
    }
  };

  const unreadCount = items.filter((item) => !item.isRead).length;

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <button type="button" onClick={() => router.back()} className="flex items-center gap-3 text-[var(--text-primary)]" aria-label="Kembali ke halaman sebelumnya">
          <ArrowLeft size={24} />
          <span className="text-xl font-bold">Notifikasi</span>
        </button>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {unreadCount > 0 && (
            <Button variant="primary" size="sm" onClick={markAllAsRead} disabled={processing || loading}>
              <CheckCheck size={16} className="mr-2" />
              Tandai Semua Dibaca ({unreadCount})
            </Button>
          )}
          <div className={`text-xs ${realtime.connected ? "text-[var(--success)]" : "text-[var(--text-muted)]"}`} aria-live="polite">
            {realtime.connected ? "Realtime aktif" : "Realtime standby"}
          </div>
          <Button variant="secondary" onClick={loadNotifications} disabled={loading} aria-label="Muat ulang notifikasi">
            <RefreshCcw size={16} />
          </Button>
        </div>
      </header>

      <section className="sync-strip" aria-label="Alur data notifikasi">
        <span>Frontend</span><span aria-hidden="true">→</span><span>/api/notifications</span><span aria-hidden="true">→</span><span>Notification Service</span><span aria-hidden="true">→</span><span>Drizzle</span><span aria-hidden="true">→</span><span>PostgreSQL</span>
      </section>

      <section className="card" aria-labelledby="notification-sync-title" style={{ padding: "16px", borderColor: "rgba(59,130,246,.32)" }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Realtime + Read State</p>
            <h2 id="notification-sync-title" className="text-lg font-bold">Per-user, unread, mark all, delete</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Notifikasi difilter dari user session. Read state dan delete diproses backend, realtime event hanya untuk user target.</p>
          </div>
          <span className={`badge ${realtime.connected ? "badge-success" : "badge-neutral"}`}>{realtime.connected ? "Realtime aktif" : "SSE standby"}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="api-pill">API: /api/notifications</span>
          <span className="api-pill">API: /api/notifications/mark-all-read</span>
          <span className="api-pill">DB: Notification_userId_isRead_createdAt_idx</span>
        </div>
      </section>

      {/* Filter Tabs */}
      <div role="tablist" aria-label="Filter notifikasi" style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
        <button
          type="button"
          role="tab"
          aria-selected={filter === "all"}
          onClick={() => setFilter("all")}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            background: filter === "all" ? "var(--warning-bg)" : "transparent",
            color: filter === "all" ? "var(--primary)" : "var(--text-secondary)",
            fontWeight: filter === "all" ? 600 : 400,
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Semua ({items.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === "unread"}
          onClick={() => setFilter("unread")}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            background: filter === "unread" ? "var(--warning-bg)" : "transparent",
            color: filter === "unread" ? "var(--primary)" : "var(--text-secondary)",
            fontWeight: filter === "unread" ? 600 : 400,
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Belum Dibaca ({unreadCount})
        </button>
      </div>

      {error && (
        <div className="card" role="alert" style={{ padding: "16px", borderColor: "var(--danger)", backgroundColor: "var(--danger-bg)" }}>
          <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="min-h-[320px] flex items-center justify-center">
          <LoadingSpinner message="Memuat notifikasi..." />
        </div>
      ) : items.length === 0 ? (
        <div className="card empty-state-card" style={{ padding: "40px 24px", textAlign: "center" }} role="status">
          <Bell size={48} className="mx-auto mb-3 text-[var(--text-muted)]" />
          <h2 className="text-lg font-semibold">
            {filter === "unread" ? "Tidak ada notifikasi belum dibaca" : "Belum ada notifikasi"}
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            {filter === "unread" 
              ? "Semua notifikasi sudah dibaca."
              : "Update approval, KPI, dan operasional akan muncul di sini."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <article 
              key={item.id} 
              className="card" 
              style={{ 
                padding: "16px", 
                borderLeft: `4px solid ${item.isRead ? "var(--border-color)" : "var(--primary)"}`,
                backgroundColor: item.isRead ? "var(--bg-primary)" : "var(--warning-bg)",
              }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{item.type}</p>
                    {!item.isRead && (
                      <span aria-label="Belum dibaca" style={{ 
                        width: "8px", 
                        height: "8px", 
                        borderRadius: "50%", 
                        backgroundColor: "var(--primary)" 
                      }} />
                    )}
                  </div>
                  <h2 className="text-base font-semibold">{item.title}</h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{item.message}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    {new Date(item.createdAt).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:flex-nowrap" style={{ flexShrink: 0 }}>
                  {!item.isRead && (
                    <Button variant="secondary" size="sm" onClick={() => markAsRead(item.id)} aria-label={`Tandai ${item.title} sudah dibaca`}>
                      <CheckCircle2 size={14} />
                    </Button>
                  )}
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => setPendingDelete(item)}
                    aria-label={`Hapus notifikasi ${item.title}`}
                    style={{ color: "var(--danger)" }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {pendingDelete && (
        <div className="overlay" onClick={() => (!processing ? setPendingDelete(null) : undefined)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="delete-notification-title" onClick={(event) => event.stopPropagation()}>
            <h2 id="delete-notification-title" className="text-lg font-bold mb-2">Hapus notifikasi?</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4">Notifikasi "{pendingDelete.title}" akan dihapus dari daftar Anda.</p>
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="secondary" onClick={() => setPendingDelete(null)} disabled={processing}>Batal</Button>
              <Button variant="danger" onClick={() => deleteNotification(pendingDelete.id)} disabled={processing} loading={processing}>Hapus</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
