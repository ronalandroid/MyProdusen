"use client";

import { Plus } from "lucide-react";
import type { Holiday } from "./types";

type Props = {
  holidays: Holiday[];
  editingHoliday: Partial<Holiday> | null;
  setEditingHoliday: React.Dispatch<React.SetStateAction<Partial<Holiday> | null>>;
  saving: boolean;
  handleSaveHoliday: (e: React.FormEvent) => void;
  handleCreateHoliday: () => void;
};

export default function WorkCalendarTab({
  holidays,
  editingHoliday,
  setEditingHoliday,
  saving,
  handleSaveHoliday,
  handleCreateHoliday,
}: Props) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      {/* Holidays List */}
      <div className="card p-5 sm:p-6 flex flex-col gap-4 shadow-sm bg-white border border-[var(--border-color)]">
        <div className="border-b border-[var(--border-color)] pb-3 flex justify-between items-center gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[var(--text-primary)]">Kalender Kerja & Hari Libur</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Kelola hari libur pabrik dan hitungan multiplier lembur/masuk.</p>
          </div>
          <button
            type="button"
            onClick={handleCreateHoliday}
            className="btn btn-primary btn-sm rounded-xl font-bold flex items-center gap-1 shrink-0"
          >
            <Plus size={14} />
            Tambah Hari
          </button>
        </div>

        {holidays.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)] font-semibold bg-gray-50/50 rounded-2xl border border-dashed border-[var(--border-color)]">
            Belum ada hari libur/spesial terdaftar.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {holidays.map((holiday) => (
              <div key={holiday.id} className="flex justify-between items-center gap-3 rounded-2xl border border-[var(--border-color)] p-4 hover:border-[var(--primary)] transition-all bg-white">
                <div>
                  <h3 className="font-extrabold text-sm text-[var(--text-primary)]">{holiday.name}</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {new Date(holiday.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} · {holiday.type.replace(/_/g, " ")}
                  </p>
                  {holiday.payMultiplier > 1 && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-[var(--success)] border border-green-200 mt-2">
                      {holiday.payMultiplier}x Gaji Jika Masuk
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingHoliday(holiday)}
                    className="btn btn-secondary btn-sm rounded-xl"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Holiday Editor Sidebar */}
      <div>
        {editingHoliday ? (
          <form onSubmit={handleSaveHoliday} className="card p-5 flex flex-col gap-4 shadow-sm border border-[var(--primary)] bg-white">
            <h3 className="text-sm font-extrabold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2">
              {editingHoliday.id ? "Edit Hari Kalender" : "Tambah Hari Kalender"}
            </h3>

            <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
              Tanggal
              <input
                type="date"
                className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none"
                value={editingHoliday.date || ""}
                onChange={(e) => setEditingHoliday(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
              Nama Hari / Libur
              <input
                type="text"
                placeholder="Contoh: Hari Buruh"
                className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none"
                value={editingHoliday.name || ""}
                onChange={(e) => setEditingHoliday(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
              Tipe Hari
              <select
                className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none"
                value={editingHoliday.type || "COMPANY_HOLIDAY"}
                onChange={(e) => setEditingHoliday(prev => ({ ...prev, type: e.target.value }))}
                required
              >
                <option value="COMPANY_HOLIDAY">Libur Perusahaan (Company Holiday)</option>
                <option value="HOLIDAY">Libur Nasional (Holiday)</option>
                <option value="SPECIAL_WORKDAY">Hari Kerja Khusus (Special Workday)</option>
                <option value="WORKDAY">Hari Kerja Normal (Workday)</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
              Pengali Gaji Lembur / Masuk
              <input
                type="number"
                step="0.5"
                className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none"
                value={editingHoliday.payMultiplier ?? 2}
                onChange={(e) => setEditingHoliday(prev => ({ ...prev, payMultiplier: Number(e.target.value) }))}
                required
              />
            </label>

            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary flex-1 min-h-[44px]"
              >
                {saving ? "..." : "Simpan"}
              </button>
              <button
                type="button"
                onClick={() => setEditingHoliday(null)}
                className="btn btn-secondary flex-1 min-h-[44px]"
              >
                Batal
              </button>
            </div>
          </form>
        ) : (
          <div className="card p-5 flex flex-col gap-3 shadow-sm bg-gray-50/50 border border-[var(--border-color)]">
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Aturan Libur</h3>
            <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
              Karyawan yang melakukan Clock In pada hari kalender bertipe HOLIDAY atau COMPANY_HOLIDAY akan secara otomatis dihitung dengan bonus pengali gaji (default 2x) jika linked ke rule payroll.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
