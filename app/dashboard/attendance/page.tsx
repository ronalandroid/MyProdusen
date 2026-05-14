"use client";

import { Bell, ArrowLeft, Info, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AttendancePage() {
  const router = useRouter();

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => router.back()}>
          <ArrowLeft size={24} />
          <h1 style={{ fontSize: "20px", fontWeight: 700 }}>Kehadiran</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Bell size={24} color="var(--text-primary)" />
          <div className="avatar" style={{ width: "32px", height: "32px", backgroundColor: "#EAEAEA" }}>
            <img src="/logo.png" alt="Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "14px", fontWeight: 500 }}>Jumat, 6 Juni 2025</div>
        <Info size={18} color="var(--text-muted)" />
      </div>

      {/* Warning Card */}
      <div style={{ backgroundColor: "var(--warning-bg)", borderRadius: "var(--radius-lg)", padding: "16px", display: "flex", gap: "12px", alignItems: "flex-start", border: "1px solid rgba(255, 193, 7, 0.3)" }}>
        <div style={{ backgroundColor: "rgba(255, 193, 7, 0.2)", padding: "8px", borderRadius: "8px" }}>
          <span style={{ fontSize: "20px" }}>📋</span>
        </div>
        <div>
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#D97706", marginBottom: "4px" }}>Belum Check-In</h3>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Jangan lupa check-in saat tiba di lokasi kerja.</p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "12px" }}>
        <button className="btn btn-success" style={{ flex: 1, padding: "16px" }}>Check-In</button>
        <button className="btn btn-danger-outline" style={{ flex: 1, padding: "16px", backgroundColor: "white" }}>Check-Out</button>
      </div>

      {/* Lokasi Kerja */}
      <div>
        <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>Lokasi Kerja</h2>
        <div className="card" style={{ padding: "16px", display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>Produsen Dimsum Medan</div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Jl. Sutomo Ujung No. 123<br/>Medan, Sumatera Utara</div>
          </div>
          <div style={{ width: "80px", height: "80px", backgroundColor: "#EAEAEA", borderRadius: "8px", position: "relative", overflow: "hidden" }}>
            {/* Map Placeholder */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: "radial-gradient(#ccc 1px, transparent 1px)", backgroundSize: "10px 10px", opacity: 0.5 }}></div>
            <MapPin size={24} color="var(--danger)" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
          </div>
        </div>
      </div>

      {/* Riwayat Kehadiran */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700 }}>Riwayat Kehadiran</h2>
          <a href="#" style={{ fontSize: "12px", color: "var(--text-muted)", textDecoration: "none" }}>&gt;</a>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>Kamis, 5 Juni 2025</div>
            <div style={{ display: "flex", gap: "24px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Check-In</span>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>08:02</div>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Check-Out</span>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>17:18</div>
              </div>
            </div>
          </div>

          <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>Rabu, 4 Juni 2025</div>
            <div style={{ display: "flex", gap: "24px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Check-In</span>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>07:59</div>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Check-Out</span>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>17:02</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
