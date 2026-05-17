"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Target, TrendingUp } from "lucide-react";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function KPIPage() {
  const router = useRouter();
  const [loading] = useState(false);

  // Placeholder data - will be replaced with real API calls when backend is ready
  const kpiData = [
    {
      id: "1",
      name: "Target Produksi Bulanan",
      target: 1000,
      current: 750,
      unit: "unit",
      period: "Mei 2026",
      status: "in_progress",
    },
    {
      id: "2",
      name: "Kualitas Produk",
      target: 95,
      current: 92,
      unit: "%",
      period: "Mei 2026",
      status: "in_progress",
    },
    {
      id: "3",
      name: "Efisiensi Waktu",
      target: 90,
      current: 88,
      unit: "%",
      period: "Mei 2026",
      status: "in_progress",
    },
  ];

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return "var(--success)";
    if (percentage >= 70) return "var(--warning)";
    return "var(--danger)";
  };

  return (
    <div className="phone-screen feature-screen" style={{ display: "flex", flexDirection: "column", gap: "20px", position: "relative", minHeight: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => router.back()}>
          <ArrowLeft size={24} />
          <h1 style={{ fontSize: "20px", fontWeight: 700 }}>KPI</h1>
        </div>
      </div>

      {/* Info Banner */}
      <div style={{ 
        backgroundColor: "var(--info-bg)", 
        border: "1px solid var(--info)",
        borderRadius: "var(--radius-md)", 
        padding: "16px",
        display: "flex",
        alignItems: "start",
        gap: "12px"
      }}>
        <Target size={20} color="var(--info)" style={{ flexShrink: 0, marginTop: "2px" }} />
        <div>
          <p className="text-sm font-semibold text-[var(--info)] mb-1">Fitur dalam pengembangan</p>
          <p className="text-xs text-[var(--text-secondary)]">
            Backend API untuk KPI sedang dalam pengembangan. Data yang ditampilkan adalah contoh placeholder.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
        <div className="card" style={{ padding: "16px" }}>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>Total KPI</div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)" }}>3</div>
        </div>
        <div className="card" style={{ padding: "16px" }}>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>Rata-rata</div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--success)" }}>85%</div>
        </div>
      </div>

      {/* KPI List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" message="Memuat data KPI..." />
        </div>
      ) : kpiData.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-secondary)]">
          Belum ada data KPI
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "24px" }}>
          {kpiData.map((kpi) => {
            const percentage = getProgressPercentage(kpi.current, kpi.target);
            const statusColor = getStatusColor(percentage);
            
            return (
              <div
                key={kpi.id}
                className="card"
                style={{ padding: "16px", cursor: "pointer" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>{kpi.name}</h3>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{kpi.period}</p>
                  </div>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "4px",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: statusColor
                  }}>
                    <TrendingUp size={16} />
                    {percentage}%
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div style={{ marginBottom: "8px" }}>
                  <div style={{ 
                    width: "100%", 
                    height: "8px", 
                    backgroundColor: "var(--border-color)", 
                    borderRadius: "4px",
                    overflow: "hidden"
                  }}>
                    <div style={{ 
                      width: `${percentage}%`, 
                      height: "100%", 
                      backgroundColor: statusColor,
                      transition: "width 0.3s ease"
                    }} />
                  </div>
                </div>
                
                {/* Current vs Target */}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>
                    Saat ini: <strong>{kpi.current} {kpi.unit}</strong>
                  </span>
                  <span style={{ color: "var(--text-secondary)" }}>
                    Target: <strong>{kpi.target} {kpi.unit}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FAB - Disabled for now */}
      <button 
        className="fab" 
        style={{ opacity: 0.5, cursor: "not-allowed" }}
        onClick={() => {}}
        disabled
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
