"use client";

import { useState } from "react";

const locationsData = [
  { id: 1, name: "Pabrik Utama", address: "Jl. Industri No. 15, Medan", lat: 3.5953, lng: 98.6723, radius: 100, isActive: true, employeeCount: 28 },
  { id: 2, name: "Gudang Distribusi", address: "Jl. Pergudangan No. 8, Medan", lat: 3.5847, lng: 98.6815, radius: 80, isActive: true, employeeCount: 10 },
  { id: 3, name: "Kantor Pusat", address: "Jl. Bisnis Center No. 22, Medan", lat: 3.5920, lng: 98.6700, radius: 50, isActive: true, employeeCount: 12 },
  { id: 4, name: "Outlet Tanjung Morawa", address: "Jl. Raya Tanjung Morawa, Deli Serdang", lat: 3.5200, lng: 98.7700, radius: 100, isActive: false, employeeCount: 0 },
];

export default function LocationsPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800 }}>📌 Lokasi Kerja</h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>Kelola lokasi kerja dan geo-fencing radius</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Tambah Lokasi</button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total Lokasi", value: locationsData.length, icon: "📌", color: "#3B82F6" },
          { label: "Aktif", value: locationsData.filter(l => l.isActive).length, icon: "✅", color: "#22C55E" },
          { label: "Nonaktif", value: locationsData.filter(l => !l.isActive).length, icon: "🚫", color: "#EF4444" },
          { label: "Total Karyawan", value: locationsData.reduce((a, b) => a + b.employeeCount, 0), icon: "👥", color: "#8B5CF6" },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ padding: "20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: s.color }} />
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>{s.icon} {s.label}</div>
            <div style={{ fontSize: "24px", fontWeight: 800 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
        {locationsData.map(loc => (
          <div key={loc.id} className="card" style={{ padding: "24px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: loc.isActive ? "#22C55E" : "#5A5F78" }} />
            
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>{loc.name}</h3>
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{loc.address}</p>
              </div>
              <span className={`badge ${loc.isActive ? "badge-success" : "badge-danger"}`} style={{ fontSize: "10px", flexShrink: 0 }}>
                {loc.isActive ? "Aktif" : "Nonaktif"}
              </span>
            </div>

            {/* Map placeholder */}
            <div style={{ height: "100px", background: "var(--bg-input)", borderRadius: "var(--radius-md)", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-color)" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", marginBottom: "4px" }}>🗺️</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
              <div style={{ padding: "10px", background: "var(--bg-input)", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "2px" }}>Radius</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--primary)" }}>{loc.radius}m</div>
              </div>
              <div style={{ padding: "10px", background: "var(--bg-input)", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "2px" }}>Karyawan</div>
                <div style={{ fontSize: "16px", fontWeight: 700 }}>{loc.employeeCount}</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: "12px" }}>✏️ Edit</button>
              <button className="btn btn-ghost btn-sm" style={{ fontSize: "12px" }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700 }}>➕ Tambah Lokasi Kerja</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)} style={{ fontSize: "16px" }}>✕</button>
            </div>
            <form onSubmit={e => { e.preventDefault(); setShowModal(false); }}>
              <div style={{ marginBottom: "16px" }}>
                <label className="label">Nama Lokasi</label>
                <input className="input" placeholder="Contoh: Pabrik Utama" required />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label className="label">Alamat</label>
                <input className="input" placeholder="Alamat lengkap" required />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label className="label">Latitude</label>
                  <input className="input" type="number" step="0.0001" placeholder="3.5953" required />
                </div>
                <div>
                  <label className="label">Longitude</label>
                  <input className="input" type="number" step="0.0001" placeholder="98.6723" required />
                </div>
                <div>
                  <label className="label">Radius (m)</label>
                  <input className="input" type="number" placeholder="100" defaultValue="100" required />
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">💾 Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
