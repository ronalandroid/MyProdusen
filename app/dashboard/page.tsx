"use client";

import { Bell } from "lucide-react";

export default function DashboardPage() {
  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
            Halo, Deni! 👋
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
            Semangat bekerja hari ini!
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ position: "relative" }}>
            <Bell size={24} color="var(--text-primary)" />
            <div style={{ position: "absolute", top: "0", right: "2px", width: "8px", height: "8px", backgroundColor: "var(--danger)", borderRadius: "50%", border: "2px solid var(--bg-main)" }}></div>
          </div>
          <div className="avatar" style={{ width: "40px", height: "40px", backgroundColor: "#EAEAEA" }}>
            <img src="/logo.png" alt="Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
          </div>
        </div>
      </div>

      {/* Ringkasan Hari Ini */}
      <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>Ringkasan Hari Ini</h2>
      <div className="card" style={{ padding: "20px", marginBottom: "24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
              <span style={{ color: "var(--info)" }}>👥</span> Karyawan
            </div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--info)" }}>128</div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Total aktif</div>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
              <span style={{ color: "var(--success)" }}>✅</span> Hadir Hari Ini
            </div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--success)" }}>96%</div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>123 / 128</div>
          </div>
        </div>
        <div style={{ height: "1px", backgroundColor: "var(--border-color)", marginBottom: "16px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
              <span style={{ color: "var(--warning)" }}>⏳</span> Cuti Pengajuan
            </div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--warning)" }}>8</div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Menunggu</div>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
              <span style={{ color: "var(--primary)" }}>💰</span> Penggajian
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>Rp 312 jt</div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Juni 2025</div>
          </div>
        </div>
      </div>

      {/* Kehadiran Minggu Ini */}
      <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>Kehadiran Minggu Ini</h2>
      <div className="card" style={{ padding: "16px", marginBottom: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)", height: "80px", position: "relative" }}>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", position: "absolute", left: 0, top: 0, bottom: 0, paddingRight: "8px" }}>
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>
            <div style={{ width: "100%", marginLeft: "24px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", paddingBottom: "12px" }}>
              {[80, 90, 85, 95, 90, 40, 20].map((val, i) => (
                <div key={i} style={{ width: "16px", height: "100%", display: "flex", alignItems: "flex-end", position: "relative" }}>
                  <div style={{ width: "100%", height: `${val}%`, backgroundColor: "var(--success)", borderRadius: "2px 2px 0 0" }}></div>
                  <span style={{ position: "absolute", bottom: "-16px", left: "50%", transform: "translateX(-50%)", fontSize: "10px" }}>
                    {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Penggajian Bulan Ini */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 700 }}>Penggajian Bulan Ini</h2>
        <a href="/dashboard/payroll" style={{ fontSize: "12px", color: "var(--text-muted)", textDecoration: "none" }}>Lihat Semua &gt;</a>
      </div>
      <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }} onClick={() => window.location.href='/dashboard/payroll'}>
        <div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Total Payout</div>
          <div style={{ fontSize: "20px", fontWeight: 700 }}>Rp 312.450.000</div>
        </div>
        <div style={{ position: "relative", width: "60px", height: "60px" }}>
          {/* Simple doughnut chart mockup using CSS conic-gradient */}
          <div style={{ 
            width: "100%", height: "100%", borderRadius: "50%", 
            background: "conic-gradient(var(--success) 0% 70%, var(--danger) 70% 85%, var(--primary) 85% 100%)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <div style={{ width: "40px", height: "40px", backgroundColor: "var(--bg-card)", borderRadius: "50%" }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
