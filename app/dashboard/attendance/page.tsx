"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, ArrowLeft, Info, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { ClientUserProfile, fetchProfile, getAuthHeaders } from "@/lib/auth-client";
import { RealtimeSelfieCamera } from "@/components/attendance/RealtimeSelfieCamera";

type AttendanceRecord = {
  id: string;
  checkInTime: string;
  checkOutTime?: string | null;
  status: string;
  workLocation?: {
    name: string;
    address: string;
  } | null;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getBrowserPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Browser tidak mendukung GPS"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  });
}


export default function AttendancePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ClientUserProfile | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [selfiePreviewUrl, setSelfiePreviewUrl] = useState("");

  const employee = profile?.employee;
  const locationName = todayAttendance?.workLocation?.name || employee?.defaultLocation?.name || "Lokasi kerja belum tersedia";
  const locationAddress = todayAttendance?.workLocation?.address || employee?.defaultLocation?.address || "Hubungi HR untuk pengaturan lokasi kerja.";

  const statusContent = useMemo(() => {
    if (!todayAttendance) {
      return {
        title: "Belum Check-In",
        description: "Jangan lupa check-in saat tiba di lokasi kerja.",
        color: "#D97706",
      };
    }

    if (!todayAttendance.checkOutTime) {
      return {
        title: "Sudah Check-In",
        description: `Check-in pukul ${formatTime(todayAttendance.checkInTime)}. Jangan lupa check-out saat pulang.`,
        color: "var(--success)",
      };
    }

    return {
      title: "Kehadiran Selesai",
      description: `Check-out pukul ${formatTime(todayAttendance.checkOutTime)}. Terima kasih sudah bekerja hari ini.`,
      color: "var(--text-primary)",
    };
  }, [todayAttendance]);

  async function loadAttendance() {
    setIsLoading(true);
    setError("");

    try {
      const currentProfile = await fetchProfile();
      setProfile(currentProfile);

      const [todayResponse, historyResponse] = await Promise.all([
        fetch("/api/attendance/today", { headers: getAuthHeaders(), cache: "no-store" }),
        fetch("/api/attendance", { headers: getAuthHeaders(), cache: "no-store" }),
      ]);

      const todayPayload = (await todayResponse.json()) as ApiResponse<AttendanceRecord | null>;
      const historyPayload = (await historyResponse.json()) as ApiResponse<AttendanceRecord[]>;

      if (!todayResponse.ok || !todayPayload.success) {
        throw new Error(todayPayload.error || "Gagal mengambil absensi hari ini");
      }

      if (!historyResponse.ok || !historyPayload.success) {
        throw new Error(historyPayload.error || "Gagal mengambil riwayat absensi");
      }

      setTodayAttendance(todayPayload.data || null);
      setHistory((historyPayload.data || []).slice(0, 5));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat absensi");
    } finally {
      setIsLoading(false);
    }
  }


  function clearSelfie() {
    setSelfieBlob(null);
    setSelfiePreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return "";
    });
  }

  async function submitAttendance(type: "check-in" | "check-out") {
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      if (!employee?.defaultLocation?.id) {
        throw new Error("Lokasi kerja default belum diatur oleh HR");
      }

      if (!selfieBlob) {
        throw new Error("Selfie realtime wajib diambil untuk melanjutkan absensi.");
      }

      const position = await getBrowserPosition();
      const formData = new FormData();
      formData.set("latitude", String(position.coords.latitude));
      formData.set("longitude", String(position.coords.longitude));
      formData.set("accuracy", String(position.coords.accuracy));
      formData.set("deviceInfo", navigator.userAgent);
      formData.set("selfie", selfieBlob, `attendance-${type}.jpg`);

      if (type === "check-in") {
        formData.set("workLocationId", employee.defaultLocation.id);
        if (employee.defaultShift?.id) {
          formData.set("shiftId", employee.defaultShift.id);
        }
      } else if (todayAttendance?.id) {
        formData.set("attendanceId", todayAttendance.id);
      }

      if (type === "check-out" && !todayAttendance?.id) {
        throw new Error("Belum ada data check-in hari ini");
      }

      const response = await fetch(`/api/attendance/${type}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      const result = (await response.json()) as ApiResponse<AttendanceRecord>;

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Gagal menyimpan absensi");
      }

      setMessage(type === "check-in" ? "Check-in berhasil disimpan" : "Check-out berhasil disimpan");
      clearSelfie();
      await loadAttendance();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan absensi");
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    loadAttendance();
  }, []);

  useEffect(() => () => clearSelfie(), []);

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => router.back()}>
          <ArrowLeft size={24} />
          <h1 style={{ fontSize: "20px", fontWeight: 700 }}>Kehadiran</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Bell size={24} color="var(--text-primary)" />
          <div className="avatar" style={{ width: "32px", height: "32px", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", borderRadius: "50%", flexShrink: 0 }}>
              {(employee?.fullName || profile?.username || "U").charAt(0).toUpperCase()}
            </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "14px", fontWeight: 500 }}>{formatDate(new Date())}</div>
        <Info size={18} color="var(--text-muted)" />
      </div>

      <div style={{ backgroundColor: "var(--warning-bg)", borderRadius: "var(--radius-lg)", padding: "16px", display: "flex", gap: "12px", alignItems: "flex-start", border: "1px solid rgba(255, 193, 7, 0.3)" }}>
        <div style={{ backgroundColor: "rgba(255, 193, 7, 0.2)", padding: "8px", borderRadius: "8px" }}>
          <span style={{ fontSize: "20px" }}>📋</span>
        </div>
        <div>
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: statusContent.color, marginBottom: "4px" }}>{isLoading ? "Memuat..." : statusContent.title}</h3>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{statusContent.description}</p>
        </div>
      </div>

      {(message || error) && (
        <div role={error ? "alert" : "status"} style={{ fontSize: "12px", color: error ? "var(--danger)" : "var(--success)", fontWeight: 600 }} aria-live={error ? "assertive" : "polite"}>
          {error || message}
        </div>
      )}

      <RealtimeSelfieCamera
        capturedPreviewUrl={selfiePreviewUrl}
        disabled={isSubmitting}
        onCapture={({ blob, previewUrl }) => {
          if (selfiePreviewUrl) {
            URL.revokeObjectURL(selfiePreviewUrl);
          }
          setSelfieBlob(blob);
          setSelfiePreviewUrl(previewUrl);
        }}
        onClear={clearSelfie}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="btn btn-success"
          style={{ flex: 1, padding: "16px", opacity: todayAttendance || isSubmitting ? 0.6 : 1 }}
          disabled={Boolean(todayAttendance) || isSubmitting || !selfieBlob}
          onClick={() => submitAttendance("check-in")}
        >
          {isSubmitting ? "Memproses..." : "Check-In"}
        </button>
        <button
          className="btn btn-danger-outline"
          style={{ flex: 1, padding: "16px", backgroundColor: "white", opacity: !todayAttendance || todayAttendance.checkOutTime || isSubmitting ? 0.6 : 1 }}
          disabled={!todayAttendance || Boolean(todayAttendance.checkOutTime) || isSubmitting || !selfieBlob}
          onClick={() => submitAttendance("check-out")}
        >
          {isSubmitting ? "Memproses..." : "Check-Out"}
        </button>
      </div>

      <div>
        <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>Lokasi Kerja</h2>
        <div className="card" style={{ padding: "16px", display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>{locationName}</div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{locationAddress}</div>
          </div>
          <div style={{ width: "80px", height: "80px", backgroundColor: "#EAEAEA", borderRadius: "8px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: "radial-gradient(#ccc 1px, transparent 1px)", backgroundSize: "10px 10px", opacity: 0.5 }}></div>
            <MapPin size={24} color="var(--danger)" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
          </div>
        </div>
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700 }}>Riwayat Kehadiran</h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {history.length === 0 ? (
            <div className="card empty-state-card" role="status" style={{ padding: "32px 16px", textAlign: "center", fontSize: "12px", color: "var(--text-secondary)" }}>
              <Info size={32} className="mx-auto mb-2 text-[var(--text-muted)]" />
              Belum ada riwayat kehadiran.
            </div>
          ) : (
            history.map((record) => (
              <div key={record.id} style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>{formatShortDate(record.checkInTime)}</div>
                <div style={{ display: "flex", gap: "24px" }}>
                  <div>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Check-In</span>
                    <div style={{ fontSize: "14px", fontWeight: 600 }}>{formatTime(record.checkInTime)}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Check-Out</span>
                    <div style={{ fontSize: "14px", fontWeight: 600 }}>{formatTime(record.checkOutTime)}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
