"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Calendar, Clock, Palette, Plus, Save, Settings, ShieldAlert, Trash2 } from "lucide-react";
import { getAuthHeaders } from "@/lib/auth-client";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

type Policy = {
  id: string;
  name: string;
  active: boolean;
  appliesScopeType: string;
  appliesScopeId: string | null;
  graceMinutes: number;
  lateTier1Min: number;
  lateTier1Max: number;
  lateTier1Deduction: number;
  lateTier2Min: number;
  lateTier2Max: number;
  lateTier2Deduction: number;
  halfDayAfterMinutes: number;
  halfDayPayFactor: number;
  geofenceRadiusMeters: number;
  payrollSyncEnabled: boolean;
};

type Holiday = {
  id: string;
  date: string;
  name: string;
  type: string;
  isPaidHoliday: boolean;
  payMultiplier: number;
};

const numberFormatter = new Intl.NumberFormat("id-ID");

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"policy" | "calendar">("policy");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [themeColor, setThemeColor] = useState("#FFC107");

  // Policy state
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [editingPolicy, setEditingPolicy] = useState<Partial<Policy> | null>(null);

  // Calendar state
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [editingHoliday, setEditingHoliday] = useState<Partial<Holiday> | null>(null);

  useEffect(() => {
    loadSettingsData();
  }, [activeTab]);

  const loadSettingsData = async () => {
    try {
      setLoading(true);
      setFeedback(null);
      if (activeTab === "policy") {
        const res = await fetch("/api/attendance/policies", { headers: getAuthHeaders(), cache: "no-store" });
        const payload = await res.json();
        if (payload.success) {
          setPolicies(payload.data || []);
          if (payload.data && payload.data.length > 0) {
            setEditingPolicy(payload.data[0]);
          } else {
            setEditingPolicy({
              name: "Kebijakan Absensi Utama",
              active: true,
              appliesScopeType: "COMPANY",
              graceMinutes: 0,
              lateTier1Min: 1,
              lateTier1Max: 15,
              lateTier1Deduction: 5000,
              lateTier2Min: 16,
              lateTier2Max: 30,
              lateTier2Deduction: 10000,
              halfDayAfterMinutes: 30,
              halfDayPayFactor: 0.5,
              geofenceRadiusMeters: 150,
              payrollSyncEnabled: true,
            });
          }
        }
      } else {
        const res = await fetch("/api/work-calendar", { headers: getAuthHeaders(), cache: "no-store" });
        const payload = await res.json();
        if (payload.success) {
          setHolidays(payload.data || []);
        }
      }
    } catch (err) {
      setFeedback({ type: "error", message: "Gagal memuat konfigurasi dari server." });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPolicy) return;
    setSaving(true);
    setFeedback(null);
    try {
      const isNew = !editingPolicy.id;
      const endpoint = "/api/attendance/policies";
      const method = isNew ? "POST" : "PUT";
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(editingPolicy),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Gagal menyimpan kebijakan absensi");
      }
      setFeedback({ type: "success", message: "Kebijakan absensi berhasil disimpan!" });
      loadSettingsData();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Gagal menyimpan kebijakan absensi" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHoliday) return;
    setSaving(true);
    setFeedback(null);
    try {
      const isNew = !editingHoliday.id;
      const endpoint = "/api/work-calendar";
      const method = isNew ? "POST" : "PUT";
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(editingHoliday),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Gagal menyimpan hari kalender");
      }
      setFeedback({ type: "success", message: "Hari kalender berhasil disimpan!" });
      setEditingHoliday(null);
      loadSettingsData();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Gagal menyimpan hari kalender" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-page animate-fade-in pb-10">
      <header className="dashboard-header mb-5">
        <div className="dashboard-greeting">
          <p className="eyebrow">Pengaturan Sistem</p>
          <h1>Kebijakan & Kalender Kerja</h1>
          <p>Kelola parameter absensi, potongan terlambat, radius geofence, dan libur kerja.</p>
        </div>
      </header>

      <section className="card p-5 mb-5 theme-color-wheel-panel" aria-labelledby="theme-color-wheel-title">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Theme</p>
            <h2 id="theme-color-wheel-title" className="text-base sm:text-lg font-extrabold">Color Wheel</h2>
            <p className="text-xs text-[var(--text-secondary)]">Preview warna brand sebelum deploy.</p>
          </div>
          <Palette size={22} className="text-[var(--primary-dark)]" aria-hidden="true" />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-[160px_1fr] items-center">
          <label className="theme-color-wheel" aria-label="Theme color wheel">
            <input type="color" value={themeColor} onChange={(event) => setThemeColor(event.target.value)} />
            <span style={{ backgroundColor: themeColor }} />
          </label>
          <div className="theme-color-preview" style={{ borderColor: themeColor }}>
            <strong style={{ color: themeColor }}>{themeColor.toUpperCase()}</strong>
            <p>Accent badge, tombol utama, dan progress bar memakai token warna sama.</p>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-2xl bg-gray-100 mb-5 max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab("policy")}
          className={`flex-1 min-h-[40px] rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "policy" ? "bg-white text-[var(--primary-dark)] shadow-sm" : "text-[var(--text-secondary)] hover:bg-white/40"
          }`}
        >
          <Clock size={16} />
          Kebijakan Absensi
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("calendar")}
          className={`flex-1 min-h-[40px] rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "calendar" ? "bg-white text-[var(--primary-dark)] shadow-sm" : "text-[var(--text-secondary)] hover:bg-white/40"
          }`}
        >
          <Calendar size={16} />
          Kalender & Hari Libur
        </button>
      </div>

      {feedback && (
        <div
          role="status"
          className={`rounded-2xl p-4 text-xs sm:text-sm font-semibold mb-5 flex items-start gap-2 border ${
            feedback.type === "success" ? "bg-green-50 text-[var(--success)] border-green-200" : "bg-red-50 text-[var(--danger)] border-red-200"
          }`}
        >
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <span>{feedback.message}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" message="Memuat parameter kebijakan..." />
        </div>
      ) : activeTab === "policy" ? (
        <form onSubmit={handleSavePolicy} className="grid gap-5 lg:grid-cols-[1fr_320px]">
          {/* Main Policy Settings */}
          <div className="card p-5 sm:p-6 flex flex-col gap-5 shadow-sm">
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
                  className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none"
                  value={editingPolicy?.graceMinutes ?? 0}
                  onChange={(e) => setEditingPolicy(prev => ({ ...prev, graceMinutes: Number(e.target.value) }))}
                  required
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                Radius Geofence (Meter)
                <input
                  type="number"
                  className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none"
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
                    className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none"
                    value={editingPolicy?.lateTier1Min ?? 1}
                    onChange={(e) => setEditingPolicy(prev => ({ ...prev, lateTier1Min: Number(e.target.value) }))}
                    required
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                  Max Menit
                  <input
                    type="number"
                    className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none"
                    value={editingPolicy?.lateTier1Max ?? 15}
                    onChange={(e) => setEditingPolicy(prev => ({ ...prev, lateTier1Max: Number(e.target.value) }))}
                    required
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                  Potongan (Rp)
                  <input
                    type="number"
                    className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none"
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
                    className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none"
                    value={editingPolicy?.lateTier2Min ?? 16}
                    onChange={(e) => setEditingPolicy(prev => ({ ...prev, lateTier2Min: Number(e.target.value) }))}
                    required
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                  Max Menit
                  <input
                    type="number"
                    className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none"
                    value={editingPolicy?.lateTier2Max ?? 30}
                    onChange={(e) => setEditingPolicy(prev => ({ ...prev, lateTier2Max: Number(e.target.value) }))}
                    required
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                  Potongan (Rp)
                  <input
                    type="number"
                    className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none"
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
                    className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none"
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
                    className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none"
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
            <div className="card p-5 flex flex-col gap-3 shadow-sm bg-gray-50/50">
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
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          {/* Holidays List */}
          <div className="card p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
            <div className="border-b border-[var(--border-color)] pb-3 flex justify-between items-center gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-[var(--text-primary)]">Kalender Kerja & Hari Libur</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Kelola hari libur pabrik dan hitungan multiplier lembur/masuk.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingHoliday({ date: new Date().toISOString().slice(0, 10), name: "", type: "COMPANY_HOLIDAY", isPaidHoliday: true, payMultiplier: 2 })}
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
                  <div key={holiday.id} className="flex justify-between items-center gap-3 rounded-2xl border border-[var(--border-color)] p-4 hover:border-[var(--primary)] transition-all">
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
              <form onSubmit={handleSaveHoliday} className="card p-5 flex flex-col gap-4 shadow-sm border border-[var(--primary)]">
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
              <div className="card p-5 flex flex-col gap-3 shadow-sm bg-gray-50/50">
                <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Aturan Libur</h3>
                <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                  Karyawan yang melakukan Clock In pada hari kalender bertipe HOLIDAY atau COMPANY_HOLIDAY akan secara otomatis dihitung dengan bonus pengali gaji (default 2x) jika linked ke rule payroll.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
