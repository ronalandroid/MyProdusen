"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Calendar, Clock, Palette, Plus, Save, Settings, ShieldAlert, Sparkles, RefreshCcw, Award, Trash2, Check } from "lucide-react";
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

type PerformancePeriod = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "CLOSED";
  createdAt: string;
};

type GamificationConfig = {
  weights: {
    attendance: number;
    kpi: number;
    leader: number;
  };
  retroactiveLeaderScoreDays: number;
};

type ThemeConfig = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  themeMode: string;
};

const numberFormatter = new Intl.NumberFormat("id-ID");

// WCAG Contrast utilities
function luminance(hex: string) {
  const cleanHex = hex.startsWith("#") ? hex : "#" + hex;
  const rgb = [1, 3, 5].map((idx) => {
    const val = parseInt(cleanHex.slice(idx, idx + 2), 16);
    const channel = isNaN(val) ? 0 : val / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function calculateContrast(a: string, b: string) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (light + 0.05) / (dark + 0.05);
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"policy" | "calendar" | "gamification" | "theme">("policy");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [progressState, setProgressState] = useState("");

  // Policy state
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [editingPolicy, setEditingPolicy] = useState<Partial<Policy> | null>(null);

  // Calendar state
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [editingHoliday, setEditingHoliday] = useState<Partial<Holiday> | null>(null);

  // Gamification Config state
  const [gamificationConfig, setGamificationConfig] = useState<GamificationConfig>({
    weights: { attendance: 30, kpi: 50, leader: 20 },
    retroactiveLeaderScoreDays: 7,
  });
  const [periods, setPeriods] = useState<PerformancePeriod[]>([]);
  const [newPeriodName, setNewPeriodName] = useState("");
  const [newPeriodStart, setNewPeriodStart] = useState("");
  const [newPeriodEnd, setNewPeriodEnd] = useState("");

  // Theme state (with color wheel support)
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>({
    primaryColor: "#FFC107",
    secondaryColor: "#111111",
    accentColor: "#E53935",
    themeMode: "default",
  });

  useEffect(() => {
    loadSettingsData();
  }, [activeTab]);

  const loadSettingsData = async () => {
    try {
      setLoading(true);
      setFeedback(null);
      setProgressState("Memuat parameter kebijakan...");

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
      } else if (activeTab === "calendar") {
        const res = await fetch("/api/work-calendar", { headers: getAuthHeaders(), cache: "no-store" });
        const payload = await res.json();
        if (payload.success) {
          setHolidays(payload.data || []);
        }
      } else if (activeTab === "gamification") {
        setProgressState("Memvalidasi bobot skor...");
        const [configRes, periodRes] = await Promise.all([
          fetch("/api/settings/gamification", { headers: getAuthHeaders(), cache: "no-store" }),
          fetch("/api/performance/periods", { headers: getAuthHeaders(), cache: "no-store" }),
        ]);

        const configPayload = await configRes.json();
        const periodPayload = await periodRes.json();

        if (configPayload.success && configPayload.data) {
          setGamificationConfig(configPayload.data);
        }
        if (periodPayload.success) {
          setPeriods(periodPayload.data || []);
        }
      } else if (activeTab === "theme") {
        const res = await fetch("/api/settings/theme", { headers: getAuthHeaders(), cache: "no-store" });
        const payload = await res.json();
        if (payload.success && payload.data) {
          setThemeConfig({
            primaryColor: payload.data.primaryColor || "#FFC107",
            secondaryColor: payload.data.secondaryColor || "#111111",
            accentColor: payload.data.accentColor || "#E53935",
            themeMode: payload.data.themeMode || "default",
          });
        }
      }
    } catch (err) {
      setFeedback({ type: "error", message: "Gagal memuat konfigurasi dari server." });
    } finally {
      setLoading(false);
      setProgressState("");
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

  const handleSaveGamificationConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    setProgressState("Memvalidasi bobot skor...");
    try {
      const totalWeight =
        Number(gamificationConfig.weights.attendance) +
        Number(gamificationConfig.weights.kpi) +
        Number(gamificationConfig.weights.leader);

      if (totalWeight !== 100) {
        throw new Error("GAMIFICATION_WEIGHT_INVALID: Total bobot performa harus tepat 100%.");
      }

      const res = await fetch("/api/settings/gamification", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(gamificationConfig),
      });

      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || "Gagal menyimpan konfigurasi gamifikasi.");
      }

      setFeedback({ type: "success", message: "Parameter konfigurasi gamifikasi berhasil disimpan!" });
      loadSettingsData();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal menyimpan konfigurasi gamifikasi.",
      });
    } finally {
      setSaving(false);
      setProgressState("");
    }
  };

  const handleOpenPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/performance/periods", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          name: newPeriodName,
          startDate: newPeriodStart,
          endDate: newPeriodEnd,
        }),
      });

      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || "Gagal membuka periode penilaian baru.");
      }

      setFeedback({ type: "success", message: "Periode penilaian performa baru berhasil dibuka!" });
      setNewPeriodName("");
      setNewPeriodStart("");
      setNewPeriodEnd("");
      loadSettingsData();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal membuka periode.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClosePeriod = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menutup periode penilaian ini? Semua snapshot performa karyawan akan dikunci.")) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/performance/periods/${id}/close`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || "Gagal menutup periode penilaian.");
      }
      setFeedback({ type: "success", message: "Periode penilaian berhasil ditutup." });
      loadSettingsData();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal menutup periode.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    setProgressState("Menyimpan tema...");
    try {
      const res = await fetch("/api/settings/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(themeConfig),
      });

      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || "Gagal menyimpan tema.");
      }

      setFeedback({ type: "success", message: "Warna tema kustomisasi berhasil diterapkan!" });
      loadSettingsData();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal menyimpan tema.",
      });
    } finally {
      setSaving(false);
      setProgressState("");
    }
  };

  const handleResetTheme = async () => {
    setSaving(true);
    setFeedback(null);
    setProgressState("Menyimpan tema...");
    try {
      const res = await fetch("/api/settings/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ reset: true }),
      });

      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || "Gagal mereset tema.");
      }

      setFeedback({ type: "success", message: "Tema berhasil direset ke warna standar MyProdusen!" });
      loadSettingsData();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal mereset tema.",
      });
    } finally {
      setSaving(false);
      setProgressState("");
    }
  };

  // Live Contrast Check (WCAG Level AA 4.5:1 ratio)
  const contrastValue = calculateContrast(themeConfig.primaryColor, themeConfig.secondaryColor);
  const isContrastValid = contrastValue >= 4.5;

  return (
    <div className="dashboard-page animate-fade-in pb-10">
      <header className="dashboard-header mb-5">
        <div className="dashboard-greeting">
          <p className="eyebrow">Pengaturan Sistem</p>
          <h1>Parameter & Kustomisasi HRIS</h1>
          <p>Kelola parameter absensi, kalender, bobot gamifikasi, dan kustomisasi warna tema.</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1 rounded-2xl bg-gray-100 mb-5 max-w-2xl">
        <button
          type="button"
          onClick={() => setActiveTab("policy")}
          className={`flex-1 min-h-[40px] px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "policy" ? "bg-white text-[var(--primary-dark)] shadow-sm" : "text-[var(--text-secondary)] hover:bg-white/40"
          }`}
        >
          <Clock size={16} />
          Kebijakan Absensi
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("calendar")}
          className={`flex-1 min-h-[40px] px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "calendar" ? "bg-white text-[var(--primary-dark)] shadow-sm" : "text-[var(--text-secondary)] hover:bg-white/40"
          }`}
        >
          <Calendar size={16} />
          Libur Pabrik
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("gamification")}
          className={`flex-1 min-h-[40px] px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "gamification" ? "bg-white text-[var(--primary-dark)] shadow-sm" : "text-[var(--text-secondary)] hover:bg-white/40"
          }`}
        >
          <Award size={16} />
          Gamifikasi
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("theme")}
          className={`flex-1 min-h-[40px] px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "theme" ? "bg-white text-[var(--primary-dark)] shadow-sm" : "text-[var(--text-secondary)] hover:bg-white/40"
          }`}
        >
          <Palette size={16} />
          Tema Warna
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
          <LoadingSpinner size="lg" message={progressState || "Memuat parameter..."} />
        </div>
      ) : activeTab === "policy" ? (
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
      ) : activeTab === "calendar" ? (
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
      ) : activeTab === "gamification" ? (
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
                    className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none text-center font-bold"
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
                    className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none text-center font-bold"
                    value={gamificationConfig.weights.kpi}
                    onChange={(e) => setGamificationConfig(prev => ({
                      ...prev,
                      weights: { ...prev.weights, kpi: Number(e.target.value) }
                    }))}
                    required
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                  Leader Score (%)
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none text-center font-bold"
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
                <div role="status" className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-[var(--danger)] font-bold flex items-start gap-1.5 leading-normal">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                  <span>Total bobot saat ini: {
                    Number(gamificationConfig.weights.attendance) +
                    Number(gamificationConfig.weights.kpi) +
                    Number(gamificationConfig.weights.leader)
                  }%. Harus tepat 100%.</span>
                </div>
              )}

              <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)] border-t border-gray-100 pt-4">
                Batas Hari Retroaktif Leader Score
                <input
                  type="number"
                  min="1"
                  max="30"
                  className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none font-bold"
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
                    className="min-h-[38px] rounded-lg border border-[var(--border-color)] p-2 text-xs focus:border-[var(--primary)] focus:outline-none"
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
                      className="min-h-[38px] rounded-lg border border-[var(--border-color)] p-2 text-xs focus:border-[var(--primary)] focus:outline-none"
                      value={newPeriodStart}
                      onChange={(e) => setNewPeriodStart(e.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-[11px] font-bold text-[var(--text-secondary)]">
                    Selesai
                    <input
                      type="date"
                      required
                      className="min-h-[38px] rounded-lg border border-[var(--border-color)] p-2 text-xs focus:border-[var(--primary)] focus:outline-none"
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
                <li><strong>Leader Score:</strong> Ulasan subjektif bulanan dari atasan langsung.</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* activeTab === "theme" -> Color Wheel & Custom Theme settings */
        <form onSubmit={handleSaveTheme} className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="card p-5 sm:p-6 flex flex-col gap-5 shadow-sm bg-white border border-[var(--border-color)]">
            <div className="border-b border-[var(--border-color)] pb-3 flex justify-between items-center gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-[var(--text-primary)]">Warna Tema Brand</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Kustomisasi identitas warna brand aplikasi MyProdusen Anda.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetTheme}
                disabled={saving}
                className="btn btn-secondary btn-sm rounded-xl font-bold flex items-center gap-1 shrink-0"
              >
                <RefreshCcw size={14} />
                <span>Reset ke Default</span>
              </button>
            </div>

            {/* Live preview container box */}
            <div className="rounded-2xl border p-4 flex flex-col gap-3 shadow-inner bg-gray-50/20" style={{ borderColor: themeConfig.primaryColor }}>
              <p className="text-xs font-extrabold text-[var(--text-muted)] uppercase tracking-widest">Live Preview Brand</p>
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-white border shadow-sm" style={{ color: themeConfig.accentColor, borderColor: themeConfig.primaryColor }}>
                  Badge Kategori
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold text-white" style={{ backgroundColor: themeConfig.accentColor }}>
                  Badge Aksi
                </span>
              </div>
              <button
                type="button"
                className="btn min-h-[44px] rounded-xl font-black text-sm flex items-center justify-center gap-1.5 max-w-xs shadow-md border-none"
                style={{ backgroundColor: themeConfig.primaryColor, color: themeConfig.secondaryColor }}
              >
                <Check size={16} strokeWidth={3} />
                <span>Tombol Utama Kontras</span>
              </button>
            </div>

            {/* Color wheel inputs */}
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                Warna Brand Utama (Primary)
                <div className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] p-2">
                  <input
                    type="color"
                    className="w-10 h-10 rounded-lg cursor-pointer border-none shrink-0"
                    value={themeConfig.primaryColor}
                    onChange={(e) => setThemeConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                  />
                  <input
                    type="text"
                    maxLength={7}
                    className="w-full text-sm font-bold focus:outline-none uppercase text-center"
                    value={themeConfig.primaryColor}
                    onChange={(e) => setThemeConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                  />
                </div>
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                Warna Teks Utama (Secondary)
                <div className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] p-2">
                  <input
                    type="color"
                    className="w-10 h-10 rounded-lg cursor-pointer border-none shrink-0"
                    value={themeConfig.secondaryColor}
                    onChange={(e) => setThemeConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                  />
                  <input
                    type="text"
                    maxLength={7}
                    className="w-full text-sm font-bold focus:outline-none uppercase text-center"
                    value={themeConfig.secondaryColor}
                    onChange={(e) => setThemeConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                  />
                </div>
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                Warna Aksen Penegasan (Accent)
                <div className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] p-2">
                  <input
                    type="color"
                    className="w-10 h-10 rounded-lg cursor-pointer border-none shrink-0"
                    value={themeConfig.accentColor}
                    onChange={(e) => setThemeConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                  />
                  <input
                    type="text"
                    maxLength={7}
                    className="w-full text-sm font-bold focus:outline-none uppercase text-center"
                    value={themeConfig.accentColor}
                    onChange={(e) => setThemeConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                  />
                </div>
              </label>
            </div>

            {/* Contrast check feedback warning */}
            {!isContrastValid && (
              <div role="status" className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-[var(--danger)] font-bold leading-normal flex items-start gap-2 animate-slide-up">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <span>
                  ⚠️ Peringatan: Kontras warna antara Brand Utama dan Teks Utama terlalu rendah ({contrastValue.toFixed(2)}:1). Silakan pilih kombinasi dengan kontras minimal 4.5:1 untuk keterbacaan WCAG.
                </span>
              </div>
            )}

            {isContrastValid && (
              <div role="status" className="rounded-xl bg-green-50 border border-green-200 p-4 text-xs text-[var(--success)] font-semibold leading-normal flex items-start gap-2">
                <Check size={18} className="shrink-0 mt-0.5" />
                <span>
                  Kombinasi warna aman! Rasio kontras ({contrastValue.toFixed(2)}:1) memenuhi rasio minimum keterbacaan WCAG AA 4.5:1.
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={saving || !isContrastValid}
              className="btn btn-primary min-h-[44px] rounded-xl font-bold flex items-center justify-center gap-1.5"
            >
              <Save size={16} />
              <span>{saving ? (progressState || "Menyimpan tema...") : "Terapkan Tema Warna"}</span>
            </button>
          </div>

          {/* Theme customizer sidebar */}
          <div className="flex flex-col gap-4">
            <div className="card p-5 flex flex-col gap-3 shadow-sm bg-gray-50/50 border border-[var(--border-color)]">
              <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Kustomisasi Kontras</h3>
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                Brand Identity default kami disusun demi kenyamanan membaca tinggi.
              </p>
              <ul className="text-[11px] leading-relaxed text-[var(--text-secondary)] space-y-1.5 font-medium">
                <li><span className="inline-block w-3 h-3 rounded-full mr-1" style={{ backgroundColor: "#FFC107" }} /> <strong>Yellow #FFC107</strong> (Brand Utama)</li>
                <li><span className="inline-block w-3 h-3 rounded-full mr-1" style={{ backgroundColor: "#111111" }} /> <strong>Charcoal #111111</strong> (Teks Utama)</li>
                <li><span className="inline-block w-3 h-3 rounded-full mr-1" style={{ backgroundColor: "#E53935" }} /> <strong>Red #E53935</strong> (Aksen Penegasan)</li>
              </ul>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
