"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle, RefreshCw, ShieldCheck, UserCog } from "lucide-react";

type UserRole = "SUPERADMIN" | "ADMIN_HR" | "SUPERVISOR" | "EMPLOYEE";

type UserRow = {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
};

const roleLabels: Record<UserRole, string> = {
  SUPERADMIN: "Superadmin",
  ADMIN_HR: "Admin HR",
  SUPERVISOR: "Supervisor",
  EMPLOYEE: "Karyawan",
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const pendingUsers = useMemo(() => users.filter((user) => !user.isActive), [users]);

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/users", { credentials: "include" });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Gagal mengambil data user");
      }
      setUsers(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengambil data user");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function updateUser(user: UserRow, patch: Partial<Pick<UserRow, "role" | "isActive">>) {
    setSavingId(user.id);
    setMessage("");
    setError("");
    try {
      const nextRole = patch.role ?? user.role;
      const nextIsActive = patch.isActive ?? user.isActive;
      const response = await fetch("/api/users", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role: nextRole, isActive: nextIsActive }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Gagal memperbarui user");
      }
      setUsers((current) => current.map((item) => (item.id === user.id ? { ...item, role: result.data.role, isActive: result.data.isActive } : item)));
      setMessage("User berhasil diperbarui dan tersinkron ke akses akun.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui user");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="phone-screen feature-screen" aria-labelledby="users-title">
      <div className="hero-card">
        <p className="eyebrow">Superadmin</p>
        <h1 id="users-title">Manajemen User & Aktivasi</h1>
        <p>Pantau user yang daftar sendiri, status aktivasi email, dan tempatkan role akses sesuai posisi kerja.</p>
      </div>

      <section className="grid grid-cols-2 gap-3">
        <div className="card">
          <p className="text-xs font-semibold text-[var(--text-secondary)]">Total User</p>
          <strong className="text-2xl">{users.length}</strong>
        </div>
        <div className="card">
          <p className="text-xs font-semibold text-[var(--text-secondary)]">Belum Aktif</p>
          <strong className="text-2xl text-[var(--warning)]">{pendingUsers.length}</strong>
        </div>
      </section>

      <section className="card">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <UserCog className="text-[var(--primary)]" size={24} aria-hidden="true" />
            <div>
              <h2 className="text-base font-bold">Daftar User Terdaftar</h2>
              <p className="text-sm text-[var(--text-secondary)]">User publik aktif setelah klik email aktivasi. Superadmin tetap dapat koreksi role dan status.</p>
            </div>
          </div>
          <button type="button" className="icon-button" onClick={loadUsers} aria-label="Muat ulang user">
            <RefreshCw size={18} aria-hidden="true" />
          </button>
        </div>

        {message && <div className="alert alert-success mt-4" role="status"><CheckCircle size={16} aria-hidden="true" />{message}</div>}
        {error && <div className="alert alert-error mt-4" role="alert">{error}</div>}

        {loading ? (
          <div className="empty-state-card mt-4"><p>Memuat data user...</p></div>
        ) : users.length === 0 ? (
          <div className="empty-state-card mt-4"><p>Belum ada user terdaftar.</p></div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {users.map((user) => (
              <article key={user.id} className="rounded-2xl border border-[var(--border-color)] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-[var(--text-primary)]">{user.username}</h3>
                    <p className="text-xs text-[var(--text-secondary)]">{user.email}</p>
                  </div>
                  <span className={`badge ${user.isActive ? "badge-success" : "badge-warning"}`}>{user.isActive ? "Aktif" : "Belum aktif"}</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <label className="block text-sm font-semibold text-[var(--text-primary)]">
                    Role / posisi akses
                    <select
                      className="mt-2 w-full rounded-xl border-2 border-[var(--border-color)] bg-white px-3 py-2 text-sm font-semibold"
                      value={user.role}
                      disabled={savingId === user.id}
                      onChange={(event) => updateUser(user, { role: event.target.value as UserRole })}
                    >
                      {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <button
                    type="button"
                    className={user.isActive ? "btn btn-secondary" : "btn btn-primary"}
                    disabled={savingId === user.id}
                    onClick={() => updateUser(user, { isActive: !user.isActive })}
                  >
                    <ShieldCheck size={16} aria-hidden="true" />
                    {user.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
