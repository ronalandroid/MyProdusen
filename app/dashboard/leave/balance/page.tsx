"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, TrendingDown, TrendingUp, RefreshCcw, AlertCircle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { fetchApiData, fetchApiList } from "@/hooks/useDashboardQueries";

interface LeaveBalance {
  available: number;
  used: number;
  pending: number;
  total: number;
  year: number;
}

interface LeaveTransaction {
  id: string;
  transactionType: string;
  amount: number;
  balanceYear: number;
  reason: string;
  createdAt: string;
  createdBy?: string | null;
  leaveRequestId?: string | null;
}

const transactionTypeLabels: Record<string, string> = {
  ENTITLEMENT: "Hak Cuti Tahunan",
  CARRY_FORWARD: "Sisa Tahun Lalu",
  REQUEST_HOLD: "Pengajuan Pending",
  REQUEST_APPROVED: "Cuti Disetujui",
  REQUEST_REJECTED_RELEASE: "Pengajuan Ditolak",
  MANUAL_ADJUSTMENT: "Penyesuaian Manual",
  EXPIRY: "Cuti Hangus",
};

const transactionTypeColors: Record<string, string> = {
  ENTITLEMENT: "var(--success)",
  CARRY_FORWARD: "var(--info)",
  REQUEST_HOLD: "var(--warning)",
  REQUEST_APPROVED: "var(--danger)",
  REQUEST_REJECTED_RELEASE: "var(--success)",
  MANUAL_ADJUSTMENT: "var(--info)",
  EXPIRY: "var(--danger)",
};

export default function LeaveBalancePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: balanceData, isLoading: balanceLoading, error: balanceError } = useQuery({
    queryKey: ["leave", "balance", selectedYear],
    queryFn: () => fetchApiData<LeaveBalance>(`/api/leave/balance?year=${selectedYear}`, "Gagal memuat saldo cuti"),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const { data: transactionsData } = useQuery({
    queryKey: ["leave", "balance", "history", selectedYear],
    queryFn: () => fetchApiList<LeaveTransaction>(`/api/leave/balance/history?year=${selectedYear}`, "Gagal memuat riwayat transaksi"),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const balance = balanceData ?? null;
  const transactions = transactionsData ?? [];
  const loading = balanceLoading;
  const error = balanceError?.message || "";

  const loadBalanceData = () => {
    queryClient.invalidateQueries({ queryKey: ["leave", "balance"] });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Memuat saldo cuti..." />
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i);

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-3 text-[var(--text-primary)]"
        >
          <ArrowLeft size={24} />
          <span className="text-xl font-bold">Saldo Cuti</span>
        </button>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="input"
            style={{ width: "120px" }}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <Button variant="secondary" onClick={loadBalanceData} disabled={loading}>
            <RefreshCcw size={16} />
          </Button>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="card" role="alert" style={{ padding: "16px", borderColor: "var(--danger)", display: "flex", gap: "12px", alignItems: "center" }}>
          <AlertCircle size={20} style={{ color: "var(--danger)", flexShrink: 0 }} />
          <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>
        </div>
      )}

      {/* Balance Summary Cards */}
      {balance && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          <div className="card" style={{ padding: "20px", textAlign: "center" }}>
            <p className="eyebrow" style={{ marginBottom: "8px" }}>Total Hak Cuti</p>
            <p className="text-3xl font-bold" style={{ color: "var(--info)" }}>{balance.total}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)", marginTop: "4px" }}>hari per tahun</p>
          </div>

          <div className="card" style={{ padding: "20px", textAlign: "center" }}>
            <p className="eyebrow" style={{ marginBottom: "8px" }}>Tersedia</p>
            <p className="text-3xl font-bold" style={{ color: "var(--success)" }}>{balance.available}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)", marginTop: "4px" }}>hari tersisa</p>
          </div>

          <div className="card" style={{ padding: "20px", textAlign: "center" }}>
            <p className="eyebrow" style={{ marginBottom: "8px" }}>Terpakai</p>
            <p className="text-3xl font-bold" style={{ color: "var(--danger)" }}>{balance.used}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)", marginTop: "4px" }}>hari digunakan</p>
          </div>

          <div className="card" style={{ padding: "20px", textAlign: "center" }}>
            <p className="eyebrow" style={{ marginBottom: "8px" }}>Pending</p>
            <p className="text-3xl font-bold" style={{ color: "var(--warning)" }}>{balance.pending}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)", marginTop: "4px" }}>hari menunggu approval</p>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <section className="card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 className="text-lg font-bold">Riwayat Transaksi</h2>
          <span className="eyebrow">{transactions.length} transaksi</span>
        </div>

        {transactions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <Calendar size={48} style={{ color: "var(--text-muted)", margin: "0 auto 16px" }} />
            <p style={{ color: "var(--text-muted)" }}>Belum ada transaksi cuti untuk tahun {selectedYear}</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {transactions.map((transaction) => {
              const isPositive = ["ENTITLEMENT", "CARRY_FORWARD", "REQUEST_REJECTED_RELEASE"].includes(transaction.transactionType);
              const isNegative = ["REQUEST_APPROVED", "EXPIRY"].includes(transaction.transactionType);
              
              return (
                <div
                  key={transaction.id}
                  className="card"
                  style={{
                    padding: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                    borderLeft: `4px solid ${transactionTypeColors[transaction.transactionType] || "var(--border)"}`,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      {isPositive && <TrendingUp size={16} style={{ color: "var(--success)" }} />}
                      {isNegative && <TrendingDown size={16} style={{ color: "var(--danger)" }} />}
                      <strong className="text-sm">{transactionTypeLabels[transaction.transactionType] || transaction.transactionType}</strong>
                    </div>
                    <p className="text-xs" style={{ color: "var(--text-muted)", marginBottom: "4px" }}>
                      {transaction.reason}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {new Date(transaction.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p
                      className="text-xl font-bold"
                      style={{
                        color: isPositive ? "var(--success)" : isNegative ? "var(--danger)" : "var(--text-primary)",
                      }}
                    >
                      {isPositive ? "+" : ""}{transaction.amount} hari
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Info Card */}
      <div className="card" style={{ padding: "16px", backgroundColor: "var(--info-bg)", borderColor: "var(--info)" }}>
        <div style={{ display: "flex", gap: "12px" }}>
          <AlertCircle size={20} style={{ color: "var(--info)", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong className="text-sm" style={{ color: "var(--info)", display: "block", marginBottom: "4px" }}>
              Informasi Saldo Cuti
            </strong>
            <ul className="text-xs" style={{ color: "var(--text-primary)", paddingLeft: "16px", margin: 0 }}>
              <li>Saldo cuti dihitung per tahun kalender (Januari - Desember)</li>
              <li>Cuti yang tidak digunakan dapat hangus di akhir tahun (tergantung kebijakan perusahaan)</li>
              <li>Pengajuan cuti yang pending akan mengurangi saldo tersedia sementara</li>
              <li>Jika pengajuan ditolak, saldo akan dikembalikan otomatis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
