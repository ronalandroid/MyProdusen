"use client";

import { useState } from "react";

const shiftsData = [
  { id: 1, name: "Shift Pagi", startTime: "07:00", endTime: "15:00", isActive: true, employeeCount: 24 },
  { id: 2, name: "Shift Siang", startTime: "15:00", endTime: "23:00", isActive: true, employeeCount: 16 },
  { id: 3, name: "Shift Malam", startTime: "23:00", endTime: "07:00", isActive: false, employeeCount: 8 },
  { id: 4, name: "Office Hours", startTime: "08:00", endTime: "17:00", isActive: true, employeeCount: 12 },
];

export default function ShiftsPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800 }}>⏰ Shift Kerja</h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>Kelola jadwal shift karyawan</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Tambah Shift</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "16px" }}>
        {shiftsData.map(shift => (
          <div key={shift.id} className="card" style={{ padding: "24px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: shift.isActive ? "#22C55E" : "#5A5F78" }} />
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700 }}>{shift.name}</h3>
              <span className={`badge ${shift.isActive ? "badge-success" : "badge-danger"}`} style={{ fontSize: "10px" }}>
                {shift.isActive ? "Aktif" : "Nonaktif"}
              </span>
            </div>

            <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
              <div style={{ flex: 1, padding: "12px", background: "var(--bg-input)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>Masuk</div>
                <div style={{ fontSize: "20px", fontWeight: 700, fontFamily: "monospace", color: "var(--success)" }}>{shift.startTime}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", color: "var(--text-muted)" }}>→</div>
              <div style={{ flex: 1, padding: "12px", background: "var(--bg-input)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>Pulang</div>
                <div style={{ fontSize: "20px", fontWeight: 700, fontFamily: "monospace", color: "var(--danger)" }}>{shift.endTime}</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>👥 {shift.employeeCount} karyawan</span>
              <div style={{ display: "flex", gap: "4px" }}>
                <button className="btn btn-ghost btn-sm" style={{ fontSize: "12px" }}>✏️</button>
                <button className="btn btn-ghost btn-sm" style={{ fontSize: "12px" }}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700 }}>➕ Tambah Shift</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)} style={{ fontSize: "16px" }}>✕</button>
            </div>
            <form onSubmit={e => { e.preventDefault(); setShowModal(false); }}>
              <div style={{ marginBottom: "16px" }}>
                <label className="label">Nama Shift</label>
                <input className="input" placeholder="Contoh: Shift Pagi" required />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label className="label">Jam Masuk</label>
                  <input className="input" type="time" required />
                </div>
                <div>
                  <label className="label">Jam Pulang</label>
                  <input className="input" type="time" required />
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
