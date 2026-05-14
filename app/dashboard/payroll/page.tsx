"use client";

import { ArrowLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PayrollPage() {
  const router = useRouter();

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => router.back()}>
        <ArrowLeft size={24} />
        <h1 style={{ fontSize: "20px", fontWeight: 700 }}>Penggajian</h1>
      </div>

      {/* Month Selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", cursor: "pointer" }}>
        <span style={{ fontSize: "14px", fontWeight: 600 }}>Juni 2025</span>
        <ChevronRight size={18} color="var(--text-muted)" />
      </div>

      {/* Main Card */}
      <div style={{ backgroundColor: "var(--primary)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>Total Gaji Bersih</div>
        <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "4px" }}>Rp 5.250.000</div>
        <div style={{ fontSize: "10px", color: "var(--text-primary)", opacity: 0.8 }}>Dibayarkan 25 Juni 2025</div>
      </div>

      {/* Rincian Komponen */}
      <div>
        <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "16px" }}>Rincian Komponen</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Gaji Pokok</span>
            <span style={{ fontSize: "12px", fontWeight: 500 }}>Rp 4.500.000</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Tunjangan</span>
            <span style={{ fontSize: "12px", fontWeight: 500 }}>Rp 1.000.000</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Potongan</span>
            <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--danger)" }}>- Rp 250.000</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Lain-lain</span>
            <span style={{ fontSize: "12px", fontWeight: 500 }}>Rp 0</span>
          </div>
          
          <div style={{ height: "1px", backgroundColor: "var(--border-color)", margin: "4px 0" }} />
          
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", fontWeight: 700 }}>Total Bersih</span>
            <span style={{ fontSize: "12px", fontWeight: 700 }}>Rp 5.250.000</span>
          </div>
        </div>
      </div>

      {/* Riwayat Penggajian */}
      <div style={{ marginTop: "8px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "16px" }}>Riwayat Penggajian</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <span style={{ fontSize: "12px", fontWeight: 500 }}>Mei 2025</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Rp 5.250.000</span>
              <ChevronRight size={18} color="var(--text-muted)" />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <span style={{ fontSize: "12px", fontWeight: 500 }}>April 2025</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Rp 5.150.000</span>
              <ChevronRight size={18} color="var(--text-muted)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
