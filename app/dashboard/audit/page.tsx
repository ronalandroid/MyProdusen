"use client";

import { useState } from "react";

const auditData = [
  { id: 1, user: "Admin", action: "LOGIN", entity: "Auth", detail: "Login berhasil", ip: "192.168.1.10", createdAt: "2026-05-14 08:00:15" },
  { id: 2, user: "HR Admin", action: "CREATE", entity: "Employee", detail: "Membuat karyawan baru: Maya Putri (EMP-008)", ip: "192.168.1.11", createdAt: "2026-05-14 09:15:30" },
  { id: 3, user: "Ahmad Fadlan", action: "CHECK_IN", entity: "Attendance", detail: "Check-in di Pabrik Utama (dalam radius)", ip: "103.15.226.50", createdAt: "2026-05-14 07:55:00" },
  { id: 4, user: "Budi Santoso", action: "CHECK_IN", entity: "Attendance", detail: "Check-in terlambat 32 menit di Gudang", ip: "103.15.226.51", createdAt: "2026-05-14 08:32:00" },
  { id: 5, user: "HR Admin", action: "UPDATE", entity: "Employee", detail: "Mengubah divisi Dewi Kartini: Produksi → Admin", ip: "192.168.1.11", createdAt: "2026-05-14 10:05:22" },
  { id: 6, user: "Supervisor", action: "APPROVE", entity: "Leave", detail: "Menyetujui cuti Dewi Kartini (14 Mei 2026)", ip: "192.168.1.12", createdAt: "2026-05-13 14:30:00" },
  { id: 7, user: "Admin", action: "UPDATE", entity: "Shift", detail: "Mengubah Shift Malam: status Aktif → Nonaktif", ip: "192.168.1.10", createdAt: "2026-05-13 11:20:00" },
  { id: 8, user: "Admin", action: "EXPORT", entity: "Report", detail: "Export laporan kehadiran bulanan April 2026", ip: "192.168.1.10", createdAt: "2026-05-12 16:45:00" },
  { id: 9, user: "Eko Prasetyo", action: "CHECK_OUT", entity: "Attendance", detail: "Check-out di Kantor (dalam radius)", ip: "103.15.226.52", createdAt: "2026-05-13 17:30:00" },
  { id: 10, user: "HR Admin", action: "REJECT", entity: "Leave", detail: "Menolak cuti Maya Putri (20-22 April): Kuota habis", ip: "192.168.1.11", createdAt: "2026-05-12 09:15:00" },
];

export default function AuditPage() {
  const [search, setSearch] = useState("");

  const getActionBadge = (action: string) => {
    switch (action) {
      case "LOGIN": return { class: "badge-info", label: "Login" };
      case "CREATE": return { class: "badge-success", label: "Create" };
      case "UPDATE": return { class: "badge-warning", label: "Update" };
      case "DELETE": return { class: "badge-danger", label: "Delete" };
      case "CHECK_IN": return { class: "badge-success", label: "Check-in" };
      case "CHECK_OUT": return { class: "badge-info", label: "Check-out" };
      case "APPROVE": return { class: "badge-success", label: "Approve" };
      case "REJECT": return { class: "badge-danger", label: "Reject" };
      case "EXPORT": return { class: "badge-primary", label: "Export" };
      default: return { class: "badge-primary", label: action };
    }
  };

  const filtered = auditData.filter(log =>
    log.user.toLowerCase().includes(search.toLowerCase()) ||
    log.detail.toLowerCase().includes(search.toLowerCase()) ||
    log.entity.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800 }}>🔍 Audit Log</h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>Riwayat aktivitas sistem untuk transparansi</p>
        </div>
        <button className="btn btn-secondary btn-sm">📤 Export</button>
      </div>

      {/* Search */}
      <div className="card" style={{ padding: "16px 20px", marginBottom: "20px" }}>
        <div className="input-group" style={{ maxWidth: "400px" }}>
          <span className="input-icon" style={{ fontSize: "14px" }}>🔍</span>
          <input className="input" placeholder="Cari log..." value={search} onChange={e => setSearch(e.target.value)} style={{ fontSize: "13px" }} />
        </div>
      </div>

      {/* Log Timeline */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div className="table-container" style={{ border: "none" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>User</th>
                <th>Aksi</th>
                <th>Entity</th>
                <th>Detail</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => {
                const badge = getActionBadge(log.action);
                return (
                  <tr key={log.id}>
                    <td style={{ fontFamily: "monospace", fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{log.createdAt}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div className="avatar avatar-sm" style={{ width: "28px", height: "28px", fontSize: "11px" }}>{log.user.charAt(0)}</div>
                        <span style={{ fontSize: "13px", fontWeight: 500 }}>{log.user}</span>
                      </div>
                    </td>
                    <td><span className={`badge ${badge.class}`} style={{ fontSize: "10px" }}>{badge.label}</span></td>
                    <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{log.entity}</td>
                    <td style={{ fontSize: "12px", color: "var(--text-secondary)", maxWidth: "300px" }}>{log.detail}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "12px", color: "var(--text-muted)" }}>{log.ip}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
