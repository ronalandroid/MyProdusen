"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Check, Pencil, Plus, Trash2, Users, X } from "lucide-react";
import { getAuthHeaders } from "@/lib/auth-client";
import { fetchApiList } from "@/hooks/useDashboardQueries";
import { useRealtime } from "@/hooks/useRealtime";

type DivisionRow = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  memberCount: number;
};

/**
 * Kelola divisi (SUPERADMIN). Tambah/ubah/nonaktifkan/hapus; penghapusan
 * diblokir server selama divisi masih punya karyawan aktif — pesan servernya
 * ditampilkan apa adanya. Perubahan tersiar realtime ke layar admin lain.
 */
export default function DivisionsPage() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<DivisionRow | null>(null);

  const { data, isLoading, error: loadError } = useQuery<DivisionRow[]>({
    queryKey: ["divisions", "admin"],
    queryFn: () => fetchApiList<DivisionRow>("/api/divisions?includeInactive=true", "Gagal memuat divisi"),
  });
  const divisions = data ?? [];

  const reload = () => queryClient.invalidateQueries({ queryKey: ["divisions"] });

  useRealtime({
    eventTypes: ["divisions.updated"],
    onEvent: () => {
      void reload();
    },
  });

  async function callApi(url: string, method: string, body?: unknown) {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error || payload?.message || "Permintaan gagal");
    }
    return payload;
  }

  async function addDivision(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newName.trim();
    if (name.length < 2) {
      setError("Nama divisi minimal 2 karakter.");
      return;
    }
    setBusyId("new");
    setMessage("");
    setError("");
    try {
      const payload = await callApi("/api/divisions", "POST", { name });
      setMessage(payload.message || `Divisi "${name}" ditambahkan.`);
      setNewName("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah divisi.");
    } finally {
      setBusyId(null);
    }
  }

  async function saveRename(division: DivisionRow) {
    const name = editName.trim();
    if (name.length < 2) {
      setError("Nama divisi minimal 2 karakter.");
      return;
    }
    setBusyId(division.id);
    setMessage("");
    setError("");
    try {
      const payload = await callApi(`/api/divisions/${division.id}`, "PUT", { name });
      setMessage(payload.message || "Divisi diperbarui.");
      setEditingId(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah divisi.");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(division: DivisionRow) {
    setBusyId(division.id);
    setMessage("");
    setError("");
    try {
      await callApi(`/api/divisions/${division.id}`, "PUT", { isActive: !division.isActive });
      setMessage(division.isActive ? `Divisi "${division.name}" dinonaktifkan — hilang dari semua pilihan.` : `Divisi "${division.name}" diaktifkan kembali.`);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah status divisi.");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete(division: DivisionRow) {
    setBusyId(division.id);
    setMessage("");
    setError("");
    try {
      const payload = await callApi(`/api/divisions/${division.id}`, "DELETE");
      setMessage(payload.message || `Divisi "${division.name}" dihapus.`);
      setPendingDelete(null);
      await reload();
    } catch (err) {
      setPendingDelete(null);
      setError(err instanceof Error ? err.message : "Gagal menghapus divisi.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="phone-screen feature-screen" aria-labelledby="divisions-title">
      <div className="hero-card">
        <p className="eyebrow">Superadmin</p>
        <h1 id="divisions-title">Divisi</h1>
        <p>Tambah, ubah, atau hapus divisi. Divisi baru langsung muncul di formulir pendaftaran dan pilihan admin.</p>
      </div>

      <section className="card">
        <div className="flex gap-3">
          <Building2 className="text-[var(--primary)]" size={24} aria-hidden="true" />
          <div>
            <h2 className="text-base font-bold">Tambah Divisi</h2>
            <p className="text-sm text-[var(--text-secondary)]">Contoh: Kreatif, Gudang, Pemasaran.</p>
          </div>
        </div>
        <form onSubmit={addDivision} className="mt-4 flex flex-wrap items-center gap-3">
          <input
            className="input flex-1 min-w-[220px]"
            placeholder="Nama divisi baru"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            aria-label="Nama divisi baru"
          />
          <button type="submit" className="btn btn-primary" disabled={busyId === "new"}>
            <Plus size={16} aria-hidden="true" /> {busyId === "new" ? "Menambahkan…" : "Tambah"}
          </button>
        </form>
        {message && <div className="alert alert-success mt-4" role="status"><Check size={16} aria-hidden="true" />{message}</div>}
        {(error || loadError) && <div className="alert alert-error mt-4" role="alert">{error || (loadError instanceof Error ? loadError.message : "")}</div>}
      </section>

      <section className="card">
        <h2 className="text-base font-bold">Daftar Divisi</h2>
        <p className="text-sm text-[var(--text-secondary)]">Divisi dengan karyawan aktif tidak bisa dihapus — pindahkan dulu karyawannya.</p>
        {isLoading ? (
          <div className="empty-state-card mt-4"><p>Memuat divisi…</p></div>
        ) : divisions.length === 0 ? (
          <div className="empty-state-card mt-4"><p>Belum ada divisi. Tambahkan yang pertama di atas.</p></div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {divisions.map((division) => (
              <article key={division.id} className="rounded-2xl border border-[var(--border-color)] bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    {editingId === division.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          className="input"
                          value={editName}
                          onChange={(event) => setEditName(event.target.value)}
                          aria-label={`Nama baru untuk ${division.name}`}
                        />
                        <button type="button" className="icon-button" aria-label="Simpan nama" disabled={busyId === division.id} onClick={() => void saveRename(division)}>
                          <Check size={16} aria-hidden="true" />
                        </button>
                        <button type="button" className="icon-button" aria-label="Batal" onClick={() => setEditingId(null)}>
                          <X size={16} aria-hidden="true" />
                        </button>
                      </div>
                    ) : (
                      <h3 className="font-bold text-[var(--text-primary)]">{division.name}</h3>
                    )}
                    <p className="text-xs text-[var(--text-secondary)] mt-1 flex items-center gap-1.5">
                      <Users size={13} aria-hidden="true" /> {division.memberCount} karyawan aktif · kode {division.code}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`badge ${division.isActive ? "badge-success" : "badge-warning"}`}>{division.isActive ? "Aktif" : "Nonaktif"}</span>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Ubah nama ${division.name}`}
                      disabled={busyId === division.id}
                      onClick={() => {
                        setEditingId(division.id);
                        setEditName(division.name);
                      }}
                    >
                      <Pencil size={16} aria-hidden="true" />
                    </button>
                    <button type="button" className="btn btn-secondary" disabled={busyId === division.id} onClick={() => void toggleActive(division)}>
                      {division.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ color: "var(--danger)" }}
                      disabled={busyId === division.id}
                      onClick={() => setPendingDelete(division)}
                    >
                      <Trash2 size={16} aria-hidden="true" /> Hapus
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-division-title">
          <div className="card w-full max-w-md">
            <h3 id="delete-division-title" className="text-lg font-bold">Hapus divisi “{pendingDelete.name}”?</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {pendingDelete.memberCount > 0
                ? `Divisi ini masih punya ${pendingDelete.memberCount} karyawan aktif — server akan menolak penghapusan sampai semuanya dipindahkan.`
                : "Tindakan ini tidak bisa dibatalkan. Divisi akan hilang dari semua pilihan."}
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" className="btn btn-secondary" onClick={() => setPendingDelete(null)}>Batal</button>
              <button type="button" className="btn btn-primary" style={{ background: "var(--danger)", borderColor: "var(--danger)" }} disabled={busyId === pendingDelete.id} onClick={() => void confirmDelete(pendingDelete)}>
                {busyId === pendingDelete.id ? "Menghapus…" : "Ya, hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
