"use client";

import { Save, ShieldAlert } from "lucide-react";
import type { Policy } from "./types";

type Props = {
  editingPolicy: Partial<Policy> | null;
  setEditingPolicy: React.Dispatch<React.SetStateAction<Partial<Policy> | null>>;
  saving: boolean;
  handleSavePolicy: (e: React.FormEvent) => void;
};

export default function AttendancePolicyTab({ editingPolicy, setEditingPolicy, saving, handleSavePolicy }: Props) {
  return (
    <form onSubmit={handleSavePolicy} className="grid gap-5 lg:grid-cols-[1fr_320px]">
      {/* Main Policy Settings */}
      <div className="card p-5 sm:p-6 flex flex-col gap-5 shadow-sm bg-white border border-[var(--border-color)]">
        <div className="border-b border-[var(--border-color)] pb-3">
          <h2 className="text-base sm:text-lg font-extrabold text-[var(--text-primary)]">Konfigurasi Aturan Absensi</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">Edit aturan toleransi waktu, radius geofence, dan potongan gaji.</p>
        </div>

        {/* Grace and Geofence */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
            Toleransi Terlambat (Menit)
            <input
              type="number"
              className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              value={editingPolicy?.graceMinutes ?? 0}
              onChange={(e) => setEditingPolicy(prev => ({ ...prev, graceMinutes: Number(e.target.value) }))}
              required
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
            Radius Geofence (Meter)
            <input
              type="number"
              className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              value={editingPolicy?.geofenceRadiusMeters ?? 150}
              onChange={(e) => setEditingPolicy(prev => ({ ...prev, geofenceRadiusMeters: Number(e.target.value) }))}
              required
            />
          </label>
        </div>

        {/* Late Tier 1 */}
        <div className="border-t border-[var(--border-color)] pt-4">
          <h3 className="text-sm font-extrabold text-[var(--text-primary)] mb-3">Tingkat Terlambat 1 (Tier 1)</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
              Min Menit
              <input
                type="number"
                className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                value={editingPolicy?.lateTier1Min ?? 1}
                onChange={(e) => setEditingPolicy(prev => ({ ...prev, lateTier1Min: Number(e.target.value) }))}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
              Max Menit
              <input
                type="number"
                className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                value={editingPolicy?.lateTier1Max ?? 15}
                onChange={(e) => setEditingPolicy(prev => ({ ...prev, lateTier1Max: Number(e.target.value) }))}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
              Potongan (Rp)
              <input
                type="number"
                className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                value={editingPolicy?.lateTier1Deduction ?? 5000}
                onChange={(e) => setEditingPolicy(prev => ({ ...prev, lateTier1Deduction: Number(e.target.value) }))}
                required
              />
            </label>
          </div>
        </div>

        {/* Late Tier 2 */}
        <div className="border-t border-[var(--border-color)] pt-4">
          <h3 className="text-sm font-extrabold text-[var(--text-primary)] mb-3">Tingkat Terlambat 2 (Tier 2)</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
              Min Menit
              <input
                type="number"
                className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                value={editingPolicy?.lateTier2Min ?? 16}
                onChange={(e) => setEditingPolicy(prev => ({ ...prev, lateTier2Min: Number(e.target.value) }))}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
              Max Menit
              <input
                type="number"
                className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                value={editingPolicy?.lateTier2Max ?? 30}
                onChange={(e) => setEditingPolicy(prev => ({ ...prev, lateTier2Max: Number(e.target.value) }))}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
              Potongan (Rp)
              <input
                type="number"
                className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                value={editingPolicy?.lateTier2Deduction ?? 10000}
                onChange={(e) => setEditingPolicy(prev => ({ ...prev, lateTier2Deduction: Number(e.target.value) }))}
                required
              />
            </label>
          </div>
        </div>

        {/* Half Day policy */}
        <div className="border-t border-[var(--border-color)] pt-4">
          <h3 className="text-sm font-extrabold text-[var(--text-primary)] mb-3">Ketentuan Setengah Hari (&gt;30 Menit)</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
              Batas Menit Terlambat Setengah Hari
              <input
                type="number"
                className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                value={editingPolicy?.halfDayAfterMinutes ?? 30}
                onChange={(e) => setEditingPolicy(prev => ({ ...prev, halfDayAfterMinutes: Number(e.target.value) }))}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
              Faktor Gaji (Default 0.5)
              <input
                type="number"
                step="0.1"
                className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                value={editingPolicy?.halfDayPayFactor ?? 0.5}
                onChange={(e) => setEditingPolicy(prev => ({ ...prev, halfDayPayFactor: Number(e.target.value) }))}
                required
              />
            </label>
          </div>
        </div>

        {/* Company policy notice */}
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800 font-semibold leading-relaxed flex items-start gap-2">
          <ShieldAlert size={18} className="shrink-0 mt-0.5 text-amber-600" />
          <span>Kebijakan potongan gaji wajib mengikuti aturan perusahaan yang berlaku.</span>
        </div>

        {/* Sync switch */}
        <div className="border-t border-[var(--border-color)] pt-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-extrabold text-[var(--text-primary)]">Sinkronisasi Realtime Payroll</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Potongan absensi langsung mengurangi estimasi slip gaji.</p>
          </div>
          <button
            type="button"
            aria-label="Toggle sinkronisasi realtime payroll"
            className={`w-14 h-8 rounded-full transition-all relative ${
              editingPolicy?.payrollSyncEnabled ? "bg-[var(--primary)]" : "bg-gray-300"
            }`}
            onClick={() => setEditingPolicy(prev => ({ ...prev, payrollSyncEnabled: !prev?.payrollSyncEnabled }))}
          >
            <span className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-all ${
              editingPolicy?.payrollSyncEnabled ? "right-1" : "left-1"
            }`} />
          </button>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary min-h-[44px] rounded-xl font-bold flex items-center justify-center gap-1.5 mt-2"
        >
          <Save size={16} />
          {saving ? "Menyimpan..." : "Simpan Kebijakan Absensi"}
        </button>
      </div>

      {/* Sidebar / Instructions */}
      <div className="flex flex-col gap-4">
        <div className="card p-5 flex flex-col gap-3 shadow-sm bg-gray-50/50 border border-[var(--border-color)]">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Informasi Aturan</h3>
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
            Kebijakan ini berlaku secara global untuk seluruh karyawan di Produsen Dimsum Medan. Sistem real-time menghitung keterlambatan berdasarkan shift aktif karyawan saat mereka melakukan Clock In.
          </p>
          <ul className="text-xs leading-relaxed text-[var(--text-secondary)] list-disc list-inside space-y-1 mt-1">
            <li>Toleransi default 0 menit.</li>
            <li>Deduction Tier 1: Rp5.000.</li>
            <li>Deduction Tier 2: Rp10.000.</li>
            <li>Deduction Tier 3: Setengah Hari.</li>
          </ul>
        </div>
      </div>
    </form>
  );
}
