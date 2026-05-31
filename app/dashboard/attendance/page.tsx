"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, ArrowLeft, ClipboardList, Info, MapPin, Navigation } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ClientUserProfile, fetchProfile, getAuthHeaders } from "@/lib/auth-client";
import { SelfieViewer } from "@/components/attendance/SelfieViewer";
import { MyExceptionPanel } from "@/components/attendance/MyExceptionPanel";

const RealtimeSelfieCamera = dynamic(
  () => import("@/components/attendance/RealtimeSelfieCamera").then((mod) => mod.RealtimeSelfieCamera),
  {
    ssr: false,
    loading: () => <div className="card" style={{ padding: "16px", fontSize: "13px", color: "var(--text-secondary)" }}>Menyiapkan kamera selfie...</div>,
  },
);

type AttendanceRecord = {
  id: string;
  checkInTime: string;
  checkOutTime?: string | null;
  status: string;
  workLocation?: {
    name: string;
    address: string;
  } | null;
  checkInSelfieUploadedAt?: string | null;
  checkInSelfieSizeBytes?: number | null;
  checkInSelfieMimeType?: string | null;
  checkOutSelfieUploadedAt?: string | null;
  checkOutSelfieSizeBytes?: number | null;
  checkOutSelfieMimeType?: string | null;
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

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthRadiusMeters = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(deltaPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  return earthRadiusMeters * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function formatDistanceMeters(distance: number) {
  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(1)} km`;
  }
  return `${Math.round(distance)} m`;
}


function getCleanAttendanceError(error: unknown, fallback = "Terjadi kendala saat memuat data. Silakan coba lagi.") {
  const message = error instanceof Error ? error.message : String(error || "");

  if (!message || /Cannot read properties|undefined|null|TypeError|ReferenceError|SyntaxError/i.test(message)) {
    return fallback;
  }

  if (/permission|denied|izin|lokasi/i.test(message)) {
    return "Lokasi tidak dapat diakses. Izinkan lokasi agar absensi bisa divalidasi.";
  }

  if (/timeout|timed out|position unavailable/i.test(message)) {
    return "GPS belum siap. Coba ambil ulang lokasi dari area terbuka.";
  }

  return message;
}

function getBrowserPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Lokasi tidak dapat diakses. Izinkan lokasi agar absensi bisa divalidasi."));
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
  const [selfieFilename, setSelfieFilename] = useState("attendance-selfie.webp");
  const [gpsPosition, setGpsPosition] = useState<GeolocationPosition | null>(null);
  const [gpsError, setGpsError] = useState("");
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [autoStart, setAutoStart] = useState(false);
  const [viewerState, setViewerState] = useState<{
    record: AttendanceRecord;
    kind: "check-in" | "check-out";
  } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const action = searchParams.get("action");
      if (action === "check-in" || action === "check-out") {
        setAutoStart(true);
      }
    }
  }, []);
  const isSuperadminAttendanceViewer = profile?.role === "SUPERADMIN";

  const employee = profile?.employee;
  const locationName = todayAttendance?.workLocation?.name || employee?.defaultLocation?.name || "Lokasi kerja belum tersedia";
  const locationAddress = todayAttendance?.workLocation?.address || employee?.defaultLocation?.address || "Hubungi HR untuk pengaturan lokasi kerja.";
  const assignedLocation = employee?.defaultLocation;
  const gpsDistanceMeters = gpsPosition && assignedLocation
    ? calculateDistanceMeters(
        gpsPosition.coords.latitude,
        gpsPosition.coords.longitude,
        assignedLocation.latitude,
        assignedLocation.longitude,
      )
    : null;
  const isInsideRadius = gpsDistanceMeters !== null && assignedLocation ? gpsDistanceMeters <= assignedLocation.radius : null;

  const statusContent = useMemo(() => {
    if (!todayAttendance) {
      return {
        title: "Belum Check-In",
        description: "Jangan lupa check-in saat tiba di lokasi kerja.",
        color: "var(--warning)",
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

      if (currentProfile.role === "SUPERADMIN") {
        setTodayAttendance(null);
        setHistory([]);
        return;
      }

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
      setError(getCleanAttendanceError(err, "Data absensi belum tersedia."));
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

  async function refreshGps() {
    setGpsError("");
    setIsGettingGps(true);
    try {
      const position = await getBrowserPosition();
      setGpsPosition(position);
    } catch (err) {
      setGpsPosition(null);
      setGpsError(getCleanAttendanceError(err, "GPS belum siap. Coba ambil ulang lokasi dari area terbuka."));
    } finally {
      setIsGettingGps(false);
    }
  }

  async function submitAttendance(type: "check-in" | "check-out") {
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      if (!employee?.defaultLocation?.id) {
        throw new Error("Lokasi kerja belum tersedia. Hubungi Superadmin.");
      }

      if (!selfieBlob) {
        throw new Error("Selfie realtime wajib diambil untuk melanjutkan absensi.");
      }

      const position = gpsPosition || await getBrowserPosition();
      const formData = new FormData();
      formData.set("latitude", String(position.coords.latitude));
      formData.set("longitude", String(position.coords.longitude));
      formData.set("accuracy", String(position.coords.accuracy));
      formData.set("gpsTimestamp", new Date(position.timestamp || Date.now()).toISOString());
      formData.set("deviceInfo", navigator.userAgent);
      formData.set("selfie", selfieBlob, selfieFilename);

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
      setGpsPosition(null);
      await loadAttendance();
    } catch (err) {
      setError(getCleanAttendanceError(err, "Gagal menyimpan absensi. Silakan coba lagi."));
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    loadAttendance();
  }, []);

  useEffect(() => () => clearSelfie(), []);
  useEffect(() => {
    void refreshGps();
  }, []);

  const missingRequirements = [
    !employee?.defaultLocation?.id ? "Lokasi kerja belum tersedia. Hubungi Superadmin." : null,
    !gpsPosition ? "GPS belum siap" : null,
    !selfieBlob ? "Selfie wajib diambil" : null,
    isInsideRadius === false ? "Anda berada di luar radius lokasi kerja" : null,
  ].filter(Boolean) as string[];
  const checkInDisabled = Boolean(todayAttendance) || isSubmitting || missingRequirements.length > 0;
  const checkOutDisabled = !todayAttendance || Boolean(todayAttendance?.checkOutTime) || isSubmitting || missingRequirements.length > 0;
  const actionHint = isSubmitting
    ? "Absensi sedang diproses."
    : missingRequirements.length > 0
      ? missingRequirements.join(" • ")
      : "Data siap. Server tetap memvalidasi GPS, selfie, dan geofence.";

  if (isSuperadminAttendanceViewer) {
    return (
      <div className="phone-screen attendance-screen" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button type="button" className="btn btn-secondary btn-icon" onClick={() => router.back()} aria-label="Kembali">
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 700 }}>Kehadiran</h1>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
              Superadmin mengelola monitoring, approval, dan laporan. Absensi selfie mandiri hanya untuk Karyawan dan Leader.
            </p>
          </div>
        </div>

        <section className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }} aria-labelledby="admin-attendance-title">
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <div style={{ backgroundColor: "var(--primary)", padding: "10px", borderRadius: "14px", color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center" }} aria-hidden="true">
              <ClipboardList size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 id="admin-attendance-title" style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>Laporan Kehadiran</h2>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Gunakan halaman laporan dan approval untuk memantau absensi, geo-fence, dan bukti selfie terlindungi.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/dashboard/reports/attendance" className="btn btn-primary min-h-[44px]">Buka Laporan Kehadiran</Link>
            <Link href="/dashboard/attendance/exceptions" className="btn btn-secondary min-h-[44px]">Approval Absensi</Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="phone-screen attendance-screen" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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

      <div className="card" style={{ background: "linear-gradient(135deg, #fff 0%, var(--primary-light) 100%)", padding: "16px", display: "flex", gap: "12px", alignItems: "flex-start", border: "1px solid rgba(253, 199, 4, 0.35)" }}>
        <div style={{ backgroundColor: "var(--primary)", padding: "10px", borderRadius: "14px", boxShadow: "0 10px 20px rgba(253,199,4,.25)", color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center" }} aria-hidden="true">
          <ClipboardList size={20} aria-hidden="true" />
        </div>
        <div>
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: statusContent.color, marginBottom: "4px" }}>Absensi Hari Ini · {isLoading ? "Memuat..." : statusContent.title}</h3>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{statusContent.description}</p>
        </div>
      </div>

      {(message || error) && (
        <div role={error ? "alert" : "status"} style={{ fontSize: "12px", color: error ? "var(--danger)" : "var(--success)", fontWeight: 600 }} aria-live={error ? "assertive" : "polite"}>
          {error || message}
        </div>
      )}

      {todayAttendance && (todayAttendance as any).checkInGeoStatus && (
        <div className="card" style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Status geo masuk</div>
          <span
            className="text-xs font-semibold"
            style={{
              padding: "2px 10px",
              borderRadius: "999px",
              background:
                (todayAttendance as any).checkInGeoStatus === "INSIDE_RADIUS"
                  ? "rgba(34,197,94,0.12)"
                  : (todayAttendance as any).checkInGeoStatus === "PENDING_REVIEW"
                  ? "rgba(245,158,11,0.16)"
                  : (todayAttendance as any).checkInGeoStatus === "APPROVED_MANUAL"
                  ? "rgba(34,197,94,0.12)"
                  : "rgba(220,38,38,0.12)",
              color:
                (todayAttendance as any).checkInGeoStatus === "INSIDE_RADIUS"
                  ? "var(--success)"
                  : (todayAttendance as any).checkInGeoStatus === "PENDING_REVIEW"
                  ? "var(--warning)"
                  : (todayAttendance as any).checkInGeoStatus === "APPROVED_MANUAL"
                  ? "var(--success)"
                  : "var(--danger)",
            }}
          >
            {String((todayAttendance as any).checkInGeoStatus).replace(/_/g, " ")}
          </span>
        </div>
      )}

      <RealtimeSelfieCamera
        capturedPreviewUrl={selfiePreviewUrl}
        disabled={isSubmitting}
        autoStart={autoStart}
        onCapture={({ blob, previewUrl, meta }) => {
          if (selfiePreviewUrl) {
            URL.revokeObjectURL(selfiePreviewUrl);
          }
          setSelfieBlob(blob);
          setSelfiePreviewUrl(previewUrl);
          const ext = meta.mimeType.split("/")[1] || "webp";
          setSelfieFilename(`attendance-selfie.${ext === "jpeg" ? "jpg" : ext}`);
        }}
        onClear={clearSelfie}
      />

      <section className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }} aria-labelledby="gps-proof-title">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
          <div>
            <h2 id="gps-proof-title" style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>Bukti Lokasi GPS</h2>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              Server tetap menghitung jarak resmi dari lokasi kerja. Data frontend hanya bukti awal.
            </p>
          </div>
          <Navigation size={22} color="var(--primary)" aria-hidden="true" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px" }}>
          <div className="hris-card-highlight" style={{ border: "1px solid var(--border-color)", borderRadius: "16px", padding: "12px" }}>
            <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>Status</span>
            <strong style={{ fontSize: "13px", color: gpsPosition ? "var(--success)" : "var(--danger)" }}>{gpsPosition ? "GPS siap" : "GPS belum siap"}</strong>
          </div>
          <div className="hris-card-highlight" style={{ border: "1px solid var(--border-color)", borderRadius: "16px", padding: "12px" }}>
            <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>Akurasi</span>
            <strong style={{ fontSize: "13px" }}>{gpsPosition ? `${Math.round(gpsPosition.coords.accuracy)} meter` : "-"}</strong>
          </div>
          <div className="hris-card-highlight" style={{ border: "1px solid var(--border-color)", borderRadius: "16px", padding: "12px" }}>
            <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>Jarak ke lokasi</span>
            <strong style={{ fontSize: "13px" }}>{gpsDistanceMeters !== null ? formatDistanceMeters(gpsDistanceMeters) : "-"}</strong>
          </div>
          <div className="hris-card-highlight" style={{ border: "1px solid var(--border-color)", borderRadius: "16px", padding: "12px" }}>
            <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>Radius resmi</span>
            <strong style={{ fontSize: "13px" }}>{assignedLocation ? formatDistanceMeters(assignedLocation.radius) : "-"}</strong>
          </div>
        </div>
        {isInsideRadius !== null && (
          <div
            role="status"
            style={{
              color: isInsideRadius ? "var(--success)" : "var(--danger)",
              background: isInsideRadius ? "rgba(34,197,94,0.10)" : "rgba(220,38,38,0.10)",
              borderRadius: "14px",
              padding: "10px 12px",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            {`Jarak Anda: ${formatDistanceMeters(gpsDistanceMeters || 0)} dari lokasi resmi · Radius diizinkan: ${assignedLocation ? formatDistanceMeters(assignedLocation.radius) : "-"} · Status: ${isInsideRadius ? "Di dalam radius" : "Di luar radius"}`}
          </div>
        )}
        {gpsError && <div role="alert" style={{ color: "var(--danger)", fontSize: "12px", fontWeight: 600 }}>{gpsError}</div>}
        <div role="status" aria-live="polite" style={{ color: missingRequirements.length ? "var(--text-secondary)" : "var(--success)", fontSize: "12px", fontWeight: 600 }}>
          {actionHint}
        </div>
        <button type="button" className="btn btn-secondary" onClick={refreshGps} disabled={isGettingGps || isSubmitting}>
          {isGettingGps ? "Mengambil GPS..." : "Ambil Ulang GPS"}
        </button>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="btn btn-success"
          style={{ flex: 1, padding: "16px", opacity: checkInDisabled ? 0.6 : 1 }}
          disabled={checkInDisabled}
          onClick={() => submitAttendance("check-in")}
        >
          {isSubmitting ? "Memproses..." : "Kirim Absen Masuk"}
        </button>
        <button
          className="btn btn-danger-outline"
          style={{ flex: 1, padding: "16px", backgroundColor: "white", opacity: checkOutDisabled ? 0.6 : 1 }}
          disabled={checkOutDisabled}
          onClick={() => submitAttendance("check-out")}
        >
          {isSubmitting ? "Memproses..." : "Kirim Absen Pulang"}
        </button>
      </div>

      <div>
        <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>Lokasi Kerja</h2>
        <div className="card" style={{ padding: "16px", display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>{locationName}</div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{locationAddress}</div>
            {assignedLocation && (
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                {assignedLocation.latitude.toFixed(7)}, {assignedLocation.longitude.toFixed(7)} • Radius {assignedLocation.radius} m
              </div>
            )}
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
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
                  {record.checkInTime && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setViewerState({ record, kind: "check-in" })}
                      style={{ fontSize: "12px" }}
                    >
                      Lihat Selfie Masuk
                    </button>
                  )}
                  {record.checkOutTime && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setViewerState({ record, kind: "check-out" })}
                      style={{ fontSize: "12px" }}
                    >
                      Lihat Selfie Pulang
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {viewerState && (
        <SelfieViewer
          attendanceId={viewerState.record.id}
          kind={viewerState.kind}
          open
          onClose={() => setViewerState(null)}
          takenAt={
            viewerState.kind === "check-in"
              ? viewerState.record.checkInSelfieUploadedAt || viewerState.record.checkInTime
              : viewerState.record.checkOutSelfieUploadedAt || viewerState.record.checkOutTime
          }
          sizeBytes={
            viewerState.kind === "check-in"
              ? viewerState.record.checkInSelfieSizeBytes
              : viewerState.record.checkOutSelfieSizeBytes
          }
          mimeType={
            viewerState.kind === "check-in"
              ? viewerState.record.checkInSelfieMimeType
              : viewerState.record.checkOutSelfieMimeType
          }
        />
      )}

      <MyExceptionPanel todayAttendanceId={todayAttendance?.id || null} />
    </div>
  );
}
