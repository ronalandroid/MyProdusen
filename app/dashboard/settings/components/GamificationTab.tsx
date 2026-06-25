"use client";

import { AlertTriangle, Plus, Save } from "lucide-react";
import type { GamificationConfig, PerformancePeriod } from "./types";

type Props = {
  gamificationConfig: GamificationConfig;
  setGamificationConfig: React.Dispatch<React.SetStateAction<GamificationConfig>>;
  periods: PerformancePeriod[];
  newPeriodName: string;
  setNewPeriodName: React.Dispatch<React.SetStateAction<string>>;
  newPeriodStart: string;
  setNewPeriodStart: React.Dispatch<React.SetStateAction<string>>;
  newPeriodEnd: string;
  setNewPeriodEnd: React.Dispatch<React.SetStateAction<string>>;
  saving: boolean;
  handleSaveGamificationConfig: (e: React.FormEvent) => void;
  handleOpenPeriod: (e: React.FormEvent) => void;
  handleClosePeriod: (id: string) => void;
};

export default function GamificationTab({
  gamificationConfig,
  setGamificationConfig,
  periods,
  newPeriodName,
  setNewPeriodName,
  newPeriodStart,
  setNewPeriodStart,
  newPeriodEnd,
  setNewPeriodEnd,
  saving,
  handleSaveGamificationConfig,
  handleOpenPeriod,
  handleClosePeriod,
}: Props) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      {/* Gamification Weight Form */}
      <div className="card p-5 sm:p-6 flex flex-col gap-5 shadow-sm bg-white border border-[var(--border-color)]">
        <div className="border-b border-[var(--border-color)] pb-3">
          <h2 className="text-base sm:text-lg font-extrabold text-[var(--text-primary)]">Bobot Performa & Gamifikasi</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Konfigurasi persentase penilaian performa karyawan (Total harus 100%).
          </p>
        </div>

        <form onSubmit={handleSaveGamificationConfig} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
              Absensi (%)
              <input
                type="number"
                min="0"
                max="100"
                className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] text-center font-bold"
                value={gamificationConfig.weights.attendance}
                onChange={(e) => setGamificationConfig(prev => ({
                  ...prev,
                  weights: { ...prev.weights, attendance: Number(e.target.value) }
                }))}
                required
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
              KPI Cetak (%)
              <input
                type="number"
                min="0"
                max="100"
                className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] text-center font-bold"
                value={gamificationConfig.weights.kpi}
                onChange={(e) => setGamificationConfig(prev => ({
                  ...prev,
                  weights: { ...prev.weights, kpi: Number(e.target.value) }
                }))}
                required
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
              Perilaku Kerja (%)
              <input
                type="number"
                min="0"
                max="100"
                className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] text-center font-bold"
                value={gamificationConfig.weights.leader}
                onChange={(e) => setGamificationConfig(prev => ({
                  ...prev,
                  weights: { ...prev.weights, leader: Number(e.target.value) }
                }))}
                required
              />
            </label>
          </div>

          {/* Total weight warning */}
          {Number(gamificationConfig.weights.attendance) +
            Number(gamificationConfig.weights.kpi) +
            Number(gamificationConfig.weights.leader) !== 100 && (
            <output className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-[var(--danger)] font-bold flex items-start gap-1.5 leading-normal">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>Total bobot saat ini: {
                Number(gamificationConfig.weights.attendance) +
                Number(gamificationConfig.weights.kpi) +
                Number(gamificationConfig.weights.leader)
              }%. Harus tepat 100%.</span>
            </output>
          )}

          <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)] border-t border-gray-100 pt-4">
            Batas Hari Retroaktif Penilaian Perilaku
            <input
              type="number"
              min="1"
              max="30"
              className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] font-bold"
              value={gamificationConfig.retroactiveLeaderScoreDays}
              onChange={(e) => setGamificationConfig(prev => ({
                ...prev,
                retroactiveLeaderScoreDays: Number(e.target.value)
              }))}
              required
            />
          </label>

          <button
            type="submit"
            disabled={saving || (
              Number(gamificationConfig.weights.attendance) +
              Number(gamificationConfig.weights.kpi) +
              Number(gamificationConfig.weights.leader) !== 100
            )}
            className="btn btn-primary min-h-[44px] rounded-xl font-bold flex items-center justify-center gap-1.5"
          >
            <Save size={16} />
            <span>{saving ? "Menyimpan..." : "Simpan Bobot Performa"}</span>
          </button>
        </form>

        {/* Performance Period Manager */}
        <div className="border-t border-[var(--border-color)] pt-5">
          <h3 className="text-base font-extrabold text-[var(--text-primary)] mb-3">Manajemen Periode Penilaian</h3>

          {/* Active periods list */}
          <div className="flex flex-col gap-2 mb-4">
            {periods.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] font-semibold italic bg-gray-50 p-3 rounded-xl border border-dashed text-center">
                Belum ada periode penilaian terbuka.
              </p>
            ) : (
              periods.map((period) => (
                <div key={period.id} className="flex justify-between items-center gap-3 p-3 rounded-2xl border border-[var(--border-color)] bg-gray-50/20">
                  <div>
                    <strong className="text-xs text-[var(--text-primary)] font-extrabold block">{period.name}</strong>
                    <span className="text-[10px] text-[var(--text-secondary)] font-bold block mt-0.5">
                      {new Date(period.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} - {new Date(period.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  {period.status === "ACTIVE" ? (
                    <button
                      type="button"
                      onClick={() => handleClosePeriod(period.id)}
                      className="btn btn-danger-outline btn-xs rounded-xl text-[10px] py-1 font-bold min-h-[28px]"
                    >
                      Tutup & Kunci
                    </button>
                  ) : (
                    <span className="badge badge-secondary text-[9px] font-black">TERKUNCI</span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Form to open new period */}
          <form onSubmit={handleOpenPeriod} className="rounded-2xl border border-[var(--border-color)] p-4 flex flex-col gap-3 bg-gray-50/30">
            <p className="text-xs font-bold text-[var(--text-primary)]">Buka Periode Penilaian Baru</p>

            <label className="flex flex-col gap-1 text-[11px] font-bold text-[var(--text-secondary)]">
              Nama Periode (e.g. Mei 2026)
              <input
                type="text"
                required
                placeholder="Contoh: Penilaian Mei 2026"
                className="min-h-[38px] rounded-lg border border-[var(--border-color)] p-2 text-xs focus:border-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                value={newPeriodName}
                onChange={(e) => setNewPeriodName(e.target.value)}
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-[11px] font-bold text-[var(--text-secondary)]">
                Mulai
                <input
                  type="date"
                  required
                  className="min-h-[38px] rounded-lg border border-[var(--border-color)] p-2 text-xs focus:border-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                  value={newPeriodStart}
                  onChange={(e) => setNewPeriodStart(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-[11px] font-bold text-[var(--text-secondary)]">
                Selesai
                <input
                  type="date"
                  required
                  className="min-h-[38px] rounded-lg border border-[var(--border-color)] p-2 text-xs focus:border-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                  value={newPeriodEnd}
                  onChange={(e) => setNewPeriodEnd(e.target.value)}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={saving || !newPeriodName || !newPeriodStart || !newPeriodEnd}
              className="btn btn-primary btn-sm rounded-lg font-bold min-h-[36px] flex items-center justify-center gap-1.5"
            >
              <Plus size={14} />
              <span>Buka Periode</span>
            </button>
          </form>
        </div>
      </div>

      {/* Gamification Sidebar */}
      <div className="flex flex-col gap-4">
        <div className="card p-5 flex flex-col gap-3 shadow-sm bg-gray-50/50 border border-[var(--border-color)]">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Aturan Gamifikasi</h3>
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
            Pengaturan bobot ini langsung mempengaruhi perhitungan Indeks Performa harian karyawan secara realtime.
          </p>
          <ul className="text-xs leading-relaxed text-[var(--text-secondary)] list-disc list-inside space-y-1">
            <li><strong>Absensi:</strong> Dihitung otomatis dari riwayat clock-in/out.</li>
            <li><strong>KPI Cetak:</strong> Diinput bulanan/harian oleh Leader.</li>
            <li><strong>Penilaian Perilaku:</strong> Ulasan subjektif bulanan dari atasan langsung.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
