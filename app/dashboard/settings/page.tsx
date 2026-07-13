"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Calendar, Clock, Palette, Award, UserPlus } from "lucide-react";
import { getAuthHeaders } from "@/lib/auth-client";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { fetchApiData, fetchApiList } from "@/hooks/useDashboardQueries";
import { calculateContrast } from "./components/types";
import type { Policy, Holiday, PerformancePeriod, GamificationConfig, ThemeConfig } from "./components/types";
import AttendancePolicyTab from "./components/AttendancePolicyTab";
import WorkCalendarTab from "./components/WorkCalendarTab";
import GamificationTab from "./components/GamificationTab";
import ThemeTab from "./components/ThemeTab";
import RegistrationTab from "./components/RegistrationTab";

// eslint-disable-next-line react-doctor/no-giant-component, react-doctor/prefer-useReducer
export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"policy" | "calendar" | "gamification" | "theme" | "registration">("policy");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [progressState, setProgressState] = useState("");
  const actionError = feedback?.type === "error" ? feedback.message : "";

  // Policy state
  const [editingPolicy, setEditingPolicy] = useState<Partial<Policy> | null>(null);

  // Calendar state
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [editingHoliday, setEditingHoliday] = useState<Partial<Holiday> | null>(null);

  // Gamification Config state
  const [gamificationConfig, setGamificationConfig] = useState<GamificationConfig>({
    weights: { attendance: 30, kpi: 50, culture: 20, leader: 20 },
    retroactiveLeaderScoreDays: 7,
    cultureScoreSuperadminPriority: true,
    cultureSubcriteriaEnabled: false,
  });
  const [periods, setPeriods] = useState<PerformancePeriod[]>([]);
  const [newPeriodName, setNewPeriodName] = useState("");
  const [newPeriodStart, setNewPeriodStart] = useState("");
  const [newPeriodEnd, setNewPeriodEnd] = useState("");
  const todayDateRef = useRef("");

  // Theme state (with color wheel support)
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>({
    primaryColor: "#FFC107",
    secondaryColor: "var(--text-primary)",
    accentColor: "#E53935",
    themeMode: "default",
  });

  const { data: policiesData, isLoading: policiesLoading, error: policiesError } = useQuery({
    queryKey: ["settings", "attendance-policies"],
    queryFn: () => fetchApiList<Policy>("/api/attendance/policies", "Gagal memuat konfigurasi dari server."),
    enabled: activeTab === "policy",
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const { data: holidaysData, isLoading: holidaysLoading, error: holidaysError } = useQuery({
    queryKey: ["settings", "work-calendar"],
    queryFn: () => fetchApiList<Holiday>("/api/work-calendar", "Gagal memuat konfigurasi dari server."),
    enabled: activeTab === "calendar",
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const { data: gamificationData, isLoading: gamificationLoading, error: gamificationError } = useQuery({
    queryKey: ["settings", "gamification"],
    queryFn: () => fetchApiData<GamificationConfig>("/api/settings/gamification", "Gagal memuat konfigurasi dari server."),
    enabled: activeTab === "gamification",
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const { data: periodsData, isLoading: periodsLoading, error: periodsError } = useQuery({
    queryKey: ["settings", "performance-periods"],
    queryFn: () => fetchApiList<PerformancePeriod>("/api/performance/periods", "Gagal memuat konfigurasi dari server."),
    enabled: activeTab === "gamification",
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const { data: registrationData, isLoading: registrationLoading, error: registrationError } = useQuery({
    queryKey: ["settings", "registration"],
    queryFn: () => fetchApiData<{ open: boolean }>("/api/settings/registration", "Gagal memuat konfigurasi dari server."),
    enabled: activeTab === "registration",
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const { data: themeData, isLoading: themeLoading, error: themeError } = useQuery({
    queryKey: ["settings", "theme"],
    queryFn: () => fetchApiData<Partial<ThemeConfig>>("/api/settings/theme", "Gagal memuat konfigurasi dari server."),
    enabled: activeTab === "theme",
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  useEffect(() => {
    if (policiesData) {
      if (policiesData.length > 0) {
        setEditingPolicy(policiesData[0]);
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
  }, [policiesData]);

  useEffect(() => {
    if (holidaysData) setHolidays(holidaysData);
  }, [holidaysData]);

  useEffect(() => {
    if (gamificationData) setGamificationConfig(gamificationData);
  }, [gamificationData]);

  useEffect(() => {
    if (periodsData) setPeriods(periodsData);
  }, [periodsData]);

  useEffect(() => {
    if (themeData) {
      setThemeConfig({
        primaryColor: themeData.primaryColor || "#FFC107",
        secondaryColor: themeData.secondaryColor || "var(--text-primary)",
        accentColor: themeData.accentColor || "#E53935",
        themeMode: themeData.themeMode || "default",
      });
    }
  }, [themeData]);

  const loading =
    activeTab === "policy"
      ? policiesLoading
      : activeTab === "calendar"
        ? holidaysLoading
        : activeTab === "gamification"
          ? (gamificationLoading ? gamificationLoading : periodsLoading)
          : activeTab === "registration"
            ? registrationLoading
            : themeLoading;
  const loadError =
    activeTab === "policy"
      ? policiesError
      : activeTab === "calendar"
        ? holidaysError
        : activeTab === "gamification"
          ? (gamificationLoading ? gamificationError : periodsError)
          : activeTab === "registration"
            ? registrationError
            : themeError;
  const error = actionError || loadError?.message || "";
  const displayFeedback = feedback || (error ? { type: "error" as const, message: error } : null);
  const loadSettingsData = () => queryClient.invalidateQueries({ queryKey: ["settings"] });

  useEffect(() => {
    if (loading) setProgressState(activeTab === "gamification" ? "Memvalidasi bobot skor..." : "Memuat parameter kebijakan...");
    else setProgressState("");
  }, [activeTab, loading]);

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

  const handleToggleRegistration = async (nextOpen: boolean) => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/settings/registration", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ open: nextOpen }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || "Gagal mengubah status pendaftaran.");
      }
      setFeedback({ type: "success", message: payload.message || "Status pendaftaran diperbarui." });
      loadSettingsData();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Gagal mengubah status pendaftaran." });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateHoliday = () => {
    todayDateRef.current = new Date().toISOString().slice(0, 10);
    setEditingHoliday({ date: todayDateRef.current, name: "", type: "COMPANY_HOLIDAY", isPaidHoliday: true, payMultiplier: 2 });
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
          onClick={() => setActiveTab("registration")}
          className={`flex-1 min-h-[40px] px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "registration" ? "bg-white text-[var(--primary-dark)] shadow-sm" : "text-[var(--text-secondary)] hover:bg-white/40"
          }`}
        >
          <UserPlus size={16} />
          Pendaftaran
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

      {displayFeedback && (
        <output
          className={`rounded-2xl p-4 text-xs sm:text-sm font-semibold mb-5 flex items-start gap-2 border ${
            displayFeedback.type === "success" ? "bg-green-50 text-[var(--success)] border-green-200" : "bg-red-50 text-[var(--danger)] border-red-200"
          }`}
        >
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <span>{displayFeedback.message}</span>
        </output>
      )}

      {loading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" message={progressState || "Memuat parameter..."} />
        </div>
      ) : activeTab === "policy" ? (
        <AttendancePolicyTab
          editingPolicy={editingPolicy}
          setEditingPolicy={setEditingPolicy}
          saving={saving}
          handleSavePolicy={handleSavePolicy}
        />
      ) : activeTab === "calendar" ? (
        <WorkCalendarTab
          holidays={holidays}
          editingHoliday={editingHoliday}
          setEditingHoliday={setEditingHoliday}
          saving={saving}
          handleSaveHoliday={handleSaveHoliday}
          handleCreateHoliday={handleCreateHoliday}
        />
      ) : activeTab === "gamification" ? (
        <GamificationTab
          gamificationConfig={gamificationConfig}
          setGamificationConfig={setGamificationConfig}
          periods={periods}
          newPeriodName={newPeriodName}
          setNewPeriodName={setNewPeriodName}
          newPeriodStart={newPeriodStart}
          setNewPeriodStart={setNewPeriodStart}
          newPeriodEnd={newPeriodEnd}
          setNewPeriodEnd={setNewPeriodEnd}
          saving={saving}
          handleSaveGamificationConfig={handleSaveGamificationConfig}
          handleOpenPeriod={handleOpenPeriod}
          handleClosePeriod={handleClosePeriod}
        />
      ) : activeTab === "registration" ? (
        <RegistrationTab
          isOpen={registrationData?.open !== false}
          saving={saving}
          onToggle={handleToggleRegistration}
        />
      ) : (
        <ThemeTab
          themeConfig={themeConfig}
          setThemeConfig={setThemeConfig}
          saving={saving}
          progressState={progressState}
          contrastValue={contrastValue}
          isContrastValid={isContrastValid}
          handleSaveTheme={handleSaveTheme}
          handleResetTheme={handleResetTheme}
        />
      )}
    </div>
  );
}
