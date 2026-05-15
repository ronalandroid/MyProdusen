"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Bell, CheckCircle2, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getAuthHeaders } from "@/lib/auth-client";

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
  const [error, setError] = useState("");

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/notifications", { headers: getAuthHeaders() });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Notifikasi gagal dimuat");
      }

      setItems(payload.data || []);
    } catch (notificationError) {
      setError(notificationError instanceof Error ? notificationError.message : "Notifikasi gagal dimuat");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    const response = await fetch(`/api/notifications/${id}/read`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });

    if (response.ok) {
      setItems((current) => current.map((item) => item.id === id ? { ...item, isRead: true } : item));
    }
  };

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
        <button type="button" onClick={() => router.back()} className="flex items-center gap-3 text-[var(--text-primary)]">
          <ArrowLeft size={24} />
          <span className="text-xl font-bold">Notifikasi</span>
        </button>
        <Button variant="secondary" onClick={loadNotifications} disabled={loading}>
          <RefreshCcw size={16} className="mr-2" />
          Refresh
        </Button>
      </header>

      {loading ? (
        <div className="min-h-[320px] flex items-center justify-center">
          <LoadingSpinner message="Memuat notifikasi..." />
        </div>
      ) : error ? (
        <div className="card" role="alert" style={{ padding: "16px", borderColor: "var(--danger)" }}>
          <p className="font-semibold text-[var(--danger)]">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="card empty-state-card" style={{ padding: "24px", textAlign: "center" }}>
          <Bell size={36} className="mx-auto mb-3 text-[var(--text-muted)]" />
          <h2 className="text-lg font-semibold">Belum ada notifikasi</h2>
          <p className="text-sm text-[var(--text-secondary)]">Update approval, KPI, dan operasional akan muncul di sini.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <article key={item.id} className="card" style={{ padding: "16px", borderColor: item.isRead ? "var(--border-color)" : "var(--primary)" }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{item.type}</p>
                  <h2 className="text-base font-semibold">{item.title}</h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{item.message}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-2">{new Date(item.createdAt).toLocaleString("id-ID")}</p>
                </div>
                {!item.isRead && (
                  <Button variant="secondary" size="sm" onClick={() => markAsRead(item.id)}>
                    <CheckCircle2 size={14} className="mr-1" />
                    Dibaca
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
