"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { getAuthHeaders } from "@/lib/auth-client";

interface WorkLocationItem {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface LocationFormState {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  radius: string;
  isActive: boolean;
}

const EMPTY_FORM: LocationFormState = {
  name: "",
  address: "",
  latitude: "",
  longitude: "",
  radius: "100",
  isActive: true,
};

export default function LocationsPage() {
  const [locations, setLocations] = useState<WorkLocationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<WorkLocationItem | null>(null);
  const [form, setForm] = useState<LocationFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (activeFilter !== "all") params.set("isActive", activeFilter === "active" ? "true" : "false");
      const trimmed = searchTerm.trim();
      if (trimmed.length >= 2) params.set("search", trimmed);

      const response = await fetch(`/api/work-locations?${params.toString()}`, {
        headers: getAuthHeaders(),
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Gagal memuat lokasi kerja");
      }
      setLocations(payload.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat lokasi kerja");
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, searchTerm]);

  useEffect(() => {
    const handle = setTimeout(() => {
      void load();
    }, 300);
    return () => clearTimeout(handle);
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(location: WorkLocationItem) {
    setEditing(location);
    setForm({
      name: location.name,
      address: location.address,
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      radius: String(location.radius),
      isActive: location.isActive,
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    const radius = Number(form.radius);

    if (form.name.trim().length < 3) {
      setError("Nama lokasi minimal 3 karakter.");
      return;
    }
    if (form.address.trim().length < 5) {
      setError("Alamat minimal 5 karakter.");
      return;
    }
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      setError("Latitude harus antara -90 dan 90.");
      return;
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      setError("Longitude harus antara -180 dan 180.");
      return;
    }
    if (!Number.isFinite(radius) || radius < 10 || radius > 1000) {
      setError("Radius harus antara 10 dan 1000 meter.");
      return;
    }

    setSubmitting(true);
    try {
      const url = editing ? `/api/work-locations/${editing.id}` : `/api/work-locations`;
      const method = editing ? "PUT" : "POST";
      const body = editing
        ? {
            name: form.name.trim(),
            address: form.address.trim(),
            latitude: lat,
            longitude: lng,
            radius,
            isActive: form.isActive,
          }
        : {
            name: form.name.trim(),
            address: form.address.trim(),
            latitude: lat,
            longitude: lng,
            radius,
          };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Gagal menyimpan lokasi kerja.");
      }
      setMessage(editing ? "Lokasi kerja berhasil diperbarui." : "Lokasi kerja berhasil ditambahkan.");
      closeModal();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan lokasi kerja.");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(location: WorkLocationItem) {
    if (!confirm(`Hapus lokasi "${location.name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/work-locations/${location.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Gagal menghapus lokasi.");
      }
      setMessage("Lokasi kerja berhasil dihapus.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus lokasi.");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800 }}>📌 Lokasi Kerja</h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>Kelola lokasi kerja dan radius geo-fencing.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} className="mr-1" /> Tambah Lokasi
        </button>
      </div>

      {error && (
        <div role="alert" className="card" style={{ padding: "12px 16px", borderColor: "var(--danger)", color: "var(--danger)", fontSize: "13px", fontWeight: 600, marginBottom: "16px" }}>
          {error}
        </div>
      )}
      {message && (
        <div role="status" className="card" style={{ padding: "12px 16px", borderColor: "var(--success)", color: "var(--success)", fontSize: "13px", fontWeight: 600, marginBottom: "16px" }}>
          {message}
        </div>
      )}

      <div className="card" style={{ padding: "16px", marginBottom: "16px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 240px" }}>
          <Search size={16} style={{ position: "absolute", top: "50%", left: "12px", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="search"
            className="input"
            placeholder="Cari nama atau alamat lokasi..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            style={{ paddingLeft: "36px" }}
          />
        </div>
        <select className="input" style={{ maxWidth: "200px" }} value={activeFilter} onChange={(event) => setActiveFilter(event.target.value as any)}>
          <option value="all">Semua status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>
      </div>

      {isLoading ? (
        <div className="card" style={{ padding: "32px", textAlign: "center", color: "var(--text-secondary)" }}>Memuat lokasi kerja...</div>
      ) : locations.length === 0 ? (
        <div className="card empty-state-card" style={{ padding: "32px 16px", textAlign: "center" }}>
          <p className="text-sm font-semibold">Belum ada lokasi kerja</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Tambahkan lokasi kerja untuk mengaktifkan absensi dengan geo-fence.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
          {locations.map((loc) => (
            <article key={loc.id} className="card" style={{ padding: "20px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: loc.isActive ? "var(--success)" : "var(--text-muted)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "flex-start", marginBottom: "10px" }}>
                <div>
                  <h2 style={{ fontSize: "15px", fontWeight: 700 }}>{loc.name}</h2>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{loc.address}</p>
                </div>
                <span className={`badge ${loc.isActive ? "badge-success" : "badge-danger"}`} style={{ fontSize: "10px" }}>
                  {loc.isActive ? "Aktif" : "Nonaktif"}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                <div style={{ padding: "10px", background: "var(--bg-input)", borderRadius: "var(--radius-sm)" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "2px" }}>Koordinat</div>
                  <div style={{ fontSize: "12px", fontWeight: 600 }}>{loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}</div>
                </div>
                <div style={{ padding: "10px", background: "var(--bg-input)", borderRadius: "var(--radius-sm)" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "2px" }}>Radius</div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--primary)" }}>{loc.radius} m</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: "12px" }} onClick={() => openEdit(loc)}>
                  <Edit size={14} className="mr-1" /> Edit
                </button>
                <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: "12px" }} onClick={() => void remove(loc)} aria-label={`Hapus ${loc.name}`}>
                  <Trash2 size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {showModal && (
        <div className="overlay" onClick={closeModal}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700 }}>{editing ? "Edit Lokasi Kerja" : "Tambah Lokasi Kerja"}</h2>
              <button type="button" className="btn btn-ghost btn-icon" onClick={closeModal} aria-label="Tutup">✕</button>
            </div>
            <form onSubmit={submit}>
              <div style={{ marginBottom: "12px" }}>
                <label className="label">Nama Lokasi</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Contoh: Pabrik Utama"
                  required
                />
              </div>
              <div style={{ marginBottom: "12px" }}>
                <label className="label">Alamat</label>
                <input
                  className="input"
                  value={form.address}
                  onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                  placeholder="Alamat lengkap"
                  required
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label className="label">Latitude</label>
                  <input
                    className="input"
                    type="number"
                    step="0.000001"
                    value={form.latitude}
                    onChange={(event) => setForm((prev) => ({ ...prev, latitude: event.target.value }))}
                    placeholder="3.5953"
                    required
                  />
                </div>
                <div>
                  <label className="label">Longitude</label>
                  <input
                    className="input"
                    type="number"
                    step="0.000001"
                    value={form.longitude}
                    onChange={(event) => setForm((prev) => ({ ...prev, longitude: event.target.value }))}
                    placeholder="98.6723"
                    required
                  />
                </div>
                <div>
                  <label className="label">Radius (m)</label>
                  <input
                    className="input"
                    type="number"
                    min={10}
                    max={1000}
                    value={form.radius}
                    onChange={(event) => setForm((prev) => ({ ...prev, radius: event.target.value }))}
                    placeholder="100"
                    required
                  />
                </div>
              </div>
              {editing && (
                <label className="flex items-center gap-2 text-sm" style={{ marginBottom: "16px" }}>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                  />
                  Lokasi aktif
                </label>
              )}
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={submitting}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
