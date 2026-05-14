"use client";

import { ArrowLeft, FileText, Search, ChevronDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

const employeesData = [
  { id: 1, name: "Deni Lesmana", role: "HRGA Manager", nip: "NIP: 1001", status: "Aktif", avatar: "DL" },
  { id: 2, name: "Rina Putri", role: "Finance Staff", nip: "NIP: 1002", status: "Aktif", avatar: "RP" },
  { id: 3, name: "Budi Santoso", role: "Produksi Leader", nip: "NIP: 1003", status: "Aktif", avatar: "BS" },
  { id: 4, name: "Siti Aisyah", role: "Outlet Supervisor", nip: "NIP: 1004", status: "Cuti", avatar: "SA" },
  { id: 5, name: "Andi Saputra", role: "Produksi Staff", nip: "NIP: 1005", status: "Aktif", avatar: "AS" },
];

export default function EmployeesPage() {
  const router = useRouter();

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px", position: "relative", minHeight: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => router.back()}>
          <ArrowLeft size={24} />
          <h1 style={{ fontSize: "20px", fontWeight: 700 }}>Karyawan</h1>
        </div>
        <FileText size={24} color="var(--text-primary)" />
      </div>

      {/* Search & Filter */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ position: "relative" }}>
          <Search size={18} color="var(--text-muted)" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            className="input"
            placeholder="Cari nama atau NIP..."
            style={{ paddingLeft: "40px", backgroundColor: "white" }}
          />
        </div>
        <div style={{ position: "relative" }}>
          <select className="input" style={{ appearance: "none", backgroundColor: "white", paddingRight: "40px" }}>
            <option>Semua Departemen</option>
            <option>HRGA</option>
            <option>Finance</option>
            <option>Produksi</option>
          </select>
          <ChevronDown size={18} color="var(--text-muted)" style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        </div>
      </div>

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "24px" }}>
        {employeesData.map((emp) => (
          <div key={emp.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div className="avatar" style={{ width: "40px", height: "40px", fontSize: "14px" }}>
                {emp.avatar}
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>{emp.name}</div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{emp.role}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{emp.nip}</span>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>•</span>
                  <span style={{ fontSize: "10px", fontWeight: 600, color: emp.status === "Aktif" ? "var(--success)" : "var(--text-muted)" }}>
                    {emp.status}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ color: "var(--text-muted)" }}>&gt;</div>
          </div>
        ))}
      </div>

      {/* FAB */}
      <button className="fab">
        <Plus size={24} />
      </button>
    </div>
  );
}
