"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Target, TrendingUp, Package, Users, PlusCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getAuthHeaders } from "@/lib/auth-client";
import { useToast } from "@/components/ui/Toast";

export default function KPIPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  
  const [role, setRole] = useState<string>("EMPLOYEE");
  const [loading, setLoading] = useState(true);
  
  // Tab control untuk Supervisor
  const [activeTab, setActiveTab] = useState<"input" | "team">("input");
  
  // Data State
  const [employees, setEmployees] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    employeeId: "",
    jenisDimsum: "Siomay Ayam",
    jumlahPack: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Placeholder data - KPI Karyawan
  const kpiData = [
    {
      id: "1",
      name: "Target Produksi Bulanan",
      target: 1000,
      current: 750,
      unit: "pack",
      period: "Mei 2026",
    },
    {
      id: "2",
      name: "Kualitas Produk (Lolos QC)",
      target: 95,
      current: 92,
      unit: "%",
      period: "Mei 2026",
    },
    {
      id: "3",
      name: "Kehadiran",
      target: 100,
      current: 95,
      unit: "%",
      period: "Mei 2026",
    },
  ];

  useEffect(() => {
    fetchInitData();
  }, []);

  const fetchInitData = async () => {
    try {
      setLoading(true);
      const statsRes = await fetch("/api/dashboard/stats", { headers: getAuthHeaders() });
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setRole(stats.data.role);
        
        if (stats.data.role === "SUPERVISOR") {
          fetchEmployees();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees?limit=50", { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setEmployees(data.data || []);
      }
    } catch (err) {
      console.error("Gagal memuat tim", err);
    }
  };

  const handleSubmitProduksi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.jumlahPack) {
      showError("Mohon pilih karyawan dan masukkan jumlah pack.");
      return;
    }

    setSubmitting(true);
    
    // Simulasi penyimpanan KPI pencetakan dimsum (karena backend API KPI masih tahap integrasi)
    setTimeout(() => {
      success(`Berhasil mencatat ${formData.jumlahPack} pack ${formData.jenisDimsum}`);
      setFormData({ ...formData, jumlahPack: "" });
      setSubmitting(false);
    }, 1000);
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return "var(--success)";
    if (percentage >= 70) return "var(--primary)";
    return "var(--danger)";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[300px]">
        <LoadingSpinner size="lg" message="Memuat modul KPI..." />
      </div>
    );
  }

  return (
    <div className="phone-screen feature-screen" style={{ display: "flex", flexDirection: "column", gap: "20px", position: "relative", minHeight: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => router.back()}>
          <ArrowLeft size={24} />
          <h1 style={{ fontSize: "20px", fontWeight: 700 }}>{role === "SUPERVISOR" ? "Input Produksi (Leader)" : "KPI Saya"}</h1>
        </div>
      </div>

      {role === "SUPERVISOR" && (
        <div style={{ display: "flex", backgroundColor: "white", borderRadius: "8px", padding: "4px", border: "1px solid var(--border-color)", marginBottom: "8px" }}>
          <div 
            onClick={() => setActiveTab("input")}
            style={{ 
              flex: 1, textAlign: "center", padding: "10px", borderRadius: "6px", fontSize: "14px", fontWeight: 600, cursor: "pointer",
              backgroundColor: activeTab === "input" ? "var(--primary)" : "transparent",
              color: activeTab === "input" ? "black" : "var(--text-secondary)",
              transition: "all 0.2s"
            }}
          >
            Input Pencetakan
          </div>
          <div 
            onClick={() => setActiveTab("team")}
            style={{ 
              flex: 1, textAlign: "center", padding: "10px", borderRadius: "6px", fontSize: "14px", fontWeight: 600, cursor: "pointer",
              backgroundColor: activeTab === "team" ? "var(--primary)" : "transparent",
              color: activeTab === "team" ? "black" : "var(--text-secondary)",
              transition: "all 0.2s"
            }}
          >
            KPI Tim
          </div>
        </div>
      )}

      {role === "SUPERVISOR" && activeTab === "input" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ 
            backgroundColor: "white", 
            border: "1px solid var(--primary)",
            borderRadius: "var(--radius-md)", 
            padding: "16px",
            display: "flex",
            alignItems: "start",
            gap: "12px"
          }}>
            <Package size={24} color="var(--primary)" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <p className="text-sm font-semibold mb-1">Catat Hasil Produksi Harian</p>
              <p className="text-xs text-[var(--text-secondary)]">
                Pilih anggota tim Anda, jenis dimsum yang dicetak, dan jumlah pack yang dihasilkan. Data ini otomatis masuk ke skor KPI bulanan.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitProduksi} className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">Anggota Tim (Operator)</label>
              <select
                className="input"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                required
              >
                <option value="">-- Pilih Karyawan --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.fullName} - {emp.nip}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">Jenis Dimsum</label>
              <select
                className="input"
                value={formData.jenisDimsum}
                onChange={(e) => setFormData({ ...formData, jenisDimsum: e.target.value })}
                required
              >
                <option value="Siomay Ayam">Siomay Ayam</option>
                <option value="Siomay Udang">Siomay Udang</option>
                <option value="Hakau">Hakau</option>
                <option value="Lumpia Kulit Tahu">Lumpia Kulit Tahu</option>
                <option value="Kwo Tie">Kwo Tie</option>
                <option value="Pangsit Goreng">Pangsit Goreng</option>
                <option value="Bakpao">Bakpao</option>
              </select>
            </div>

            <Input
              label="Jumlah Pack"
              type="number"
              placeholder="Contoh: 150"
              value={formData.jumlahPack}
              onChange={(e) => setFormData({ ...formData, jumlahPack: e.target.value })}
              required
              min="1"
            />

            <Button 
              type="submit" 
              loading={submitting} 
              style={{ marginTop: "8px", width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
            >
              <PlusCircle size={18} /> Simpan Hasil Cetak
            </Button>
          </form>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Info Banner untuk Employee atau Tab Team */}
          {role === "EMPLOYEE" && (
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
                <p className="text-sm font-semibold text-[var(--info)] mb-1">Fitur dalam tahap integrasi</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Skor pencetakan dimsum Anda diinput oleh Leader. Data di bawah ini adalah estimasi sementara.
                </p>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
            <div className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>Total Pack Dicetak</div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)" }}>
                {role === "SUPERVISOR" ? "3,450" : "750"}
              </div>
            </div>
            <div className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>Rata-rata Skor</div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--success)" }}>85%</div>
            </div>
          </div>

          {/* KPI List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingBottom: "24px" }}>
            {kpiData.map((kpi) => {
              const percentage = getProgressPercentage(kpi.current, kpi.target);
              const statusColor = getStatusColor(percentage);
              
              return (
                <div key={kpi.id} className="card" style={{ padding: "16px" }}>
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
                      fontWeight: 700,
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
        </div>
      )}
    </div>
  );
}
