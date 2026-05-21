"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Plus, Edit, Trash2, X, MapPin } from "lucide-react";
import { getAuthHeaders } from "@/lib/auth-client";
import { WorkLocationMap } from "@/components/locations/WorkLocationMap";

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
  const [pendingDelete, setPendingDelete] = useState<WorkLocationItem | null>(null);
  const [form, setForm] = useState<LocationFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    setError(null);
    setMessage(null);
    setDeleting(true);
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
      setPendingDelete(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus lokasi.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", gap: "12px", flexWrap: "wrap" }}>
        <div className="flex items-center gap-3 min-w-0">
          <span
            aria-hidden="true"
            className="flex items-center justify-center rounded-2xl flex-shrink-0"
            style={{ width: 44, height: 44, background: "var(--primary-light)", color: "var(--primary-dark)" }}
          >
            <MapPin size={22} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 style={{ fontSize: "22px", fontWeight: 800 }} className="truncate">Lokasi Kerja</h1>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>Kelola lokasi kerja dan radius geo-fencing.</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} aria-hidden="true" /> Tambah Lokasi
        </button>
      </div>

      <section className="sync-strip" aria-label="Alur data lokasi kerja">
        <span>Frontend</span><span aria-hidden="true">→</span><span>/api/work-locations</span><span aria-hidden="true">→</span><span>Location Service</span><span aria-hidden="true">→</span><span>Drizzle</span><span aria-hidden="true">→</span><span>PostgreSQL</span>
      </section>

      <section className="card" aria-labelledby="location-sync-title" style={{ padding: "16px", borderColor: "rgba(59,130,246,.32)", marginBottom: "16px" }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Geo-fence Master</p>
            <h2 id="location-sync-title" className="text-lg font-bold">Latitude, longitude, radius aktif</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Lokasi aktif dipakai attendance backend untuk validasi radius. Frontend hanya preview; keputusan geo-fence tetap di server.</p>
          </div>
          <span className="badge badge-info">Radius 10-1000m</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="api-pill">API: /api/work-locations</span>
          <span className="api-pill">DB: WorkLocation_isActive_idx</span>
          <span className="api-pill">DB: WorkLocation_name_idx</span>
        </div>
      </section>

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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))", gap: "16px" }}>
          {locations.map((loc) => (
            <article key={loc.id} className="card" style={{ padding: "20px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "var(--primary)" }} aria-hidden="true" />
              <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "flex-start", marginBottom: "10px" }}>
                <div>
                  <h2 style={{ fontSize: "15px", fontWeight: 700 }}>{loc.name}</h2>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{loc.address}</p>
                </div>
                <span className={`badge ${loc.isActive ? "badge-success" : "badge-danger"}`} style={{ fontSize: "10px" }}>
                  {loc.isActive ? "Aktif" : "Nonaktif"}
                </span>
              </div>
              <div style={{ marginBottom: "12px" }}>
                <WorkLocationMap
                  latitude={loc.latitude}
                  longitude={loc.longitude}
                  radiusMeters={loc.radius}
                  label={loc.name}
                  height={140}
                />
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
                <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: "12px" }} onClick={() => setPendingDelete(loc)} aria-label={`Hapus ${loc.name}`}>
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
              <button type="button" className="btn btn-ghost btn-icon" onClick={closeModal} aria-label="Tutup">
                <X size={18} aria-hidden="true" />
              </button>
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 9rem), 1fr))", gap: "12px", marginBottom: "16px" }}>
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
              {Number.isFinite(Number(form.latitude)) && Number.isFinite(Number(form.longitude)) && Math.abs(Number(form.latitude)) <= 90 && Math.abs(Number(form.longitude)) <= 180 && (
                <div style={{ marginBottom: "16px" }}>
                  <label className="label">Pratinjau peta</label>
                  <WorkLocationMap
                    latitude={Number(form.latitude)}
                    longitude={Number(form.longitude)}
                    radiusMeters={Math.max(10, Math.min(1000, Number(form.radius) || 100))}
                    height={180}
                  />
                  <p className="text-xs" style={{ color: "var(--text-muted)", marginTop: "4px" }}>
                    Pratinjau menggunakan ubin OpenStreetMap. Lingkaran kuning menunjukkan radius geo-fence.
                  </p>
                </div>
              )}
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

      {pendingDelete && (
        <div className="overlay" onClick={() => (!deleting ? setPendingDelete(null) : undefined)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="delete-location-title" onClick={(event) => event.stopPropagation()}>
            <h2 id="delete-location-title" style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>Hapus lokasi kerja?</h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>
              Lokasi "{pendingDelete.name}" akan dinonaktifkan dari daftar operasional. Riwayat absensi lama tetap tersimpan.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setPendingDelete(null)} disabled={deleting}>Batal</button>
              <button type="button" className="btn btn-danger" onClick={() => void remove(pendingDelete)} disabled={deleting}>
                {deleting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
