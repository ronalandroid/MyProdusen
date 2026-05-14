"use client";

import { ArrowLeft, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LeavePage() {
  const router = useRouter();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => router.back()}>
            <ArrowLeft size={24} />
            <h1 style={{ fontSize: "20px", fontWeight: 700 }}>Cuti</h1>
          </div>
          <SlidersHorizontal size={24} color="var(--text-primary)" />
        </div>

        {/* Sisa Cuti Card */}
        <div style={{ backgroundColor: "var(--primary)", borderRadius: "var(--radius-lg)", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>Sisa Cuti Anda</div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)" }}>12 / 12 <span style={{ fontSize: "14px", fontWeight: 600 }}>hari</span></div>
            <div style={{ fontSize: "10px", color: "var(--text-primary)", opacity: 0.8 }}>Tahun 2025</div>
          </div>
          <div style={{ width: "48px", height: "48px", backgroundColor: "rgba(255,255,255,0.3)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "24px" }}>📋</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", marginBottom: "8px" }}>
          <div style={{ flex: 1, textAlign: "center", paddingBottom: "12px", fontSize: "14px", fontWeight: 600, color: "var(--primary)", borderBottom: "2px solid var(--primary)" }}>
            Pengajuan Saya
          </div>
          <div style={{ flex: 1, textAlign: "center", paddingBottom: "12px", fontSize: "14px", fontWeight: 500, color: "var(--text-muted)" }}>
            Riwayat
          </div>
        </div>

        {/* List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "80px" }}>
          <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>Cuti Tahunan</div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>5 - 7 Juni 2025 (3 hari)</div>
              <div style={{ fontSize: "10px", color: "#D97706", fontWeight: 600, marginTop: "4px" }}>Menunggu Persetujuan</div>
            </div>
            <div style={{ color: "var(--text-muted)" }}>&gt;</div>
          </div>

          <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>Cuti Sakit</div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>12 Mei 2025 (1 hari)</div>
              <div style={{ fontSize: "10px", color: "var(--success)", fontWeight: 600, marginTop: "4px" }}>Disetujui</div>
            </div>
            <div style={{ fontSize: "10px", color: "var(--success)", fontWeight: 600, backgroundColor: "var(--success-bg)", padding: "2px 8px", borderRadius: "100px" }}>Cuti Sakit</div>
          </div>

          <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>Cuti Tahunan</div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>2 - 4 April 2025 (3 hari)</div>
              <div style={{ fontSize: "10px", color: "var(--success)", fontWeight: 600, marginTop: "4px" }}>Disetujui</div>
            </div>
            <div style={{ fontSize: "10px", color: "var(--success)", fontWeight: 600, backgroundColor: "var(--success-bg)", padding: "2px 8px", borderRadius: "100px" }}>Cuti Tahunan</div>
          </div>

          <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>Cuti Pribadi</div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>20 Maret 2025 (1 hari)</div>
              <div style={{ fontSize: "10px", color: "var(--danger)", fontWeight: 600, marginTop: "4px" }}>Ditolak</div>
            </div>
            <div style={{ color: "var(--text-muted)" }}></div>
          </div>
        </div>
      </div>

      {/* Fixed Button */}
      <div style={{ position: "absolute", bottom: "100px", left: "24px", right: "24px", zIndex: 10 }}>
        <button className="btn btn-primary">Ajukan Cuti</button>
      </div>
    </div>
  );
}
