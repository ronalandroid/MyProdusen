"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
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
    loading: () => <div className="card" style={{ padding: "16px", fontSize: "13px", color: "var(--text-secondary)" }}>Menyiapkan kamera selfie…</div>,
  },
);

const fullDateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
});

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
  return fullDateFormatter.format(date);
}

function formatShortDate(value: string) {
  return shortDateFormatter.format(new Date(value));
}

function formatTime(value?: string | null) {
  if (!value) return "-";
  return timeFormatter.format(new Date(value));
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


type AttendanceState = {
  profile: ClientUserProfile | null;
  todayAttendance: AttendanceRecord | null;
  history: AttendanceRecord[];
  message: string;
  error: string;
  isLoading: boolean;
  isSubmitting: boolean;
  selfieBlob: Blob | null;
  selfiePreviewUrl: string;
  gpsPosition: GeolocationPosition | null;
  gpsError: string;
  isGettingGps: boolean;
  viewerState: {
    record: AttendanceRecord;
    kind: "check-in" | "check-out";
  } | null;
};

type AttendanceAction =
  | { type: "loadStart" }
  | { type: "loadSuperadmin"; profile: ClientUserProfile }
  | { type: "loadSuccess"; profile: ClientUserProfile; today: AttendanceRecord | null; history: AttendanceRecord[] }
  | { type: "loadError"; error: string }
  | { type: "submitStart" }
  | { type: "submitError"; error: string }
  | { type: "submitSettled" }
  | { type: "submitSuccess"; message: string }
  | { type: "setSelfie"; blob: Blob; previewUrl: string }
  | { type: "clearSelfie" }
  | { type: "gpsStart" }
  | { type: "gpsSuccess"; position: GeolocationPosition }
  | { type: "gpsError"; error: string }
  | { type: "clearGps" }
  | { type: "openViewer"; record: AttendanceRecord; kind: "check-in" | "check-out" }
  | { type: "closeViewer" };

const initialAttendanceState: AttendanceState = {
  profile: null,
  todayAttendance: null,
  history: [],
  message: "",
  error: "",
  isLoading: true,
  isSubmitting: false,
  selfieBlob: null,
  selfiePreviewUrl: "",
  gpsPosition: null,
  gpsError: "",
  isGettingGps: false,
  viewerState: null,
};

function attendanceReducer(state: AttendanceState, action: AttendanceAction): AttendanceState {
  switch (action.type) {
    case "loadStart":
      return { ...state, isLoading: true, error: "" };
    case "loadSuperadmin":
      return { ...state, profile: action.profile, todayAttendance: null, history: [], isLoading: false };
    case "loadSuccess":
      return {
        ...state,
        profile: action.profile,
        todayAttendance: action.today,
        history: action.history,
        isLoading: false,
      };
    case "loadError":
      return { ...state, error: action.error, isLoading: false };
    case "submitStart":
      return { ...state, error: "", message: "", isSubmitting: true };
    case "submitError":
      return { ...state, error: action.error, isSubmitting: false };
    case "submitSettled":
      return { ...state, isSubmitting: false };
    case "submitSuccess":
      return { ...state, message: action.message };
    case "setSelfie":
      return { ...state, selfieBlob: action.blob, selfiePreviewUrl: action.previewUrl };
    case "clearSelfie":
      return { ...state, selfieBlob: null, selfiePreviewUrl: "" };
    case "gpsStart":
      return { ...state, gpsError: "", isGettingGps: true };
    case "gpsSuccess":
      return { ...state, gpsPosition: action.position, isGettingGps: false };
    case "gpsError":
      return { ...state, gpsPosition: null, gpsError: action.error, isGettingGps: false };
    case "clearGps":
      return { ...state, gpsPosition: null };
    case "openViewer":
      return { ...state, viewerState: { record: action.record, kind: action.kind } };
    case "closeViewer":
      return { ...state, viewerState: null };
    default:
      return state;
  }
}

function getInitialAutoStart() {
  if (typeof window === "undefined") return false;
  const action = new URLSearchParams(window.location.search).get("action");
  return action === "check-in" || action === "check-out";
}

function AttendanceHeader({ onBack, avatarName }: { onBack: () => void; avatarName: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <button type="button" className="flex cursor-pointer items-center gap-3" onClick={onBack} aria-label="Kembali ke halaman sebelumnya">
        <ArrowLeft size={24} />
        <h1 style={{ fontSize: "20px", fontWeight: 700 }}>Kehadiran</h1>
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Bell size={24} color="var(--text-primary)" />
        <div className="avatar flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[13px] font-bold text-[var(--text-primary)]">
          {avatarName.charAt(0).toUpperCase()}
        </div>
      </div>
    </div>
  );
}

function TodayDateRow() {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div suppressHydrationWarning style={{ fontSize: "14px", fontWeight: 500 }}>{formatDate(new Date())}</div>
      <Info size={18} color="var(--text-muted)" />
    </div>
  );
}

function AttendanceNotice({ message, error }: { message: string; error: string }) {
  if (!message && !error) return null;

  return (
    <div role={error ? "alert" : "status"} style={{ fontSize: "12px", color: error ? "var(--danger)" : "var(--success)", fontWeight: 600 }} aria-live={error ? "assertive" : "polite"}>
      {error || message}
    </div>
  );
}

function TodayStatusCard({ isLoading, statusContent }: { isLoading: boolean; statusContent: { title: string; description: string; color: string } }) {
  return (
    <div className="card flex items-start gap-3 border border-[rgba(253,199,4,0.35)] bg-[linear-gradient(135deg,#fff_0%,var(--primary-light)_100%)] p-4">
      <div className="flex items-center justify-center rounded-[14px] bg-[var(--primary)] p-2.5 text-[var(--text-primary)] shadow-[0_10px_20px_rgba(253,199,4,0.25)]" aria-hidden="true">
        <ClipboardList size={20} aria-hidden="true" />
      </div>
      <div>
        <h3 style={{ fontSize: "14px", fontWeight: 700, color: statusContent.color, marginBottom: "4px" }}>Absensi Hari Ini · {isLoading ? "Memuat…" : statusContent.title}</h3>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{statusContent.description}</p>
      </div>
    </div>
  );
}

function AttendanceActions({
  isSubmitting,
  checkInDisabled,
  checkOutDisabled,
  onCheckIn,
  onCheckOut,
}: {
  isSubmitting: boolean;
  checkInDisabled: boolean;
  checkOutDisabled: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button type="button" className="btn btn-success" style={{ flex: 1, padding: "16px", opacity: checkInDisabled ? 0.6 : 1 }} disabled={checkInDisabled} onClick={onCheckIn}>
        {isSubmitting ? "Memproses…" : "Kirim Absen Masuk"}
      </button>
      <button type="button" className="btn btn-danger-outline" style={{ flex: 1, padding: "16px", backgroundColor: "white", opacity: checkOutDisabled ? 0.6 : 1 }} disabled={checkOutDisabled} onClick={onCheckOut}>
        {isSubmitting ? "Memproses…" : "Kirim Absen Pulang"}
      </button>
    </div>
  );
}

function SuperadminAttendanceView({ onBack }: { onBack: () => void }) {
  return (
    <div className="phone-screen attendance-screen" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button type="button" className="btn btn-secondary btn-icon" onClick={onBack} aria-label="Kembali">
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

export default function AttendancePage() {
  const router = useRouter();
  const [state, dispatch] = useReducer(attendanceReducer, initialAttendanceState);
  const {
    profile,
    todayAttendance,
    history,
    message,
    error,
    isLoading,
    isSubmitting,
    selfieBlob,
    selfiePreviewUrl,
    gpsPosition,
    gpsError,
    isGettingGps,
    viewerState,
  } = state;
  const selfieFilenameRef = useRef("attendance-selfie.webp");
  const selfiePreviewUrlRef = useRef("");
  const [autoStart] = useState(getInitialAutoStart);

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
    dispatch({ type: "loadStart" });

    try {
      const currentProfile = await fetchProfile();

      if (currentProfile.role === "SUPERADMIN") {
        dispatch({ type: "loadSuperadmin", profile: currentProfile });
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

      dispatch({
        type: "loadSuccess",
        profile: currentProfile,
        today: todayPayload.data || null,
        history: (historyPayload.data || []).slice(0, 5),
      });
    } catch (err) {
      dispatch({ type: "loadError", error: getCleanAttendanceError(err, "Data absensi belum tersedia.") });
    }
  }


  function clearSelfie() {
    if (selfiePreviewUrlRef.current) {
      URL.revokeObjectURL(selfiePreviewUrlRef.current);
      selfiePreviewUrlRef.current = "";
    }
    dispatch({ type: "clearSelfie" });
  }

  async function refreshGps() {
    dispatch({ type: "gpsStart" });
    try {
      const position = await getBrowserPosition();
      dispatch({ type: "gpsSuccess", position });
    } catch (err) {
      dispatch({ type: "gpsError", error: getCleanAttendanceError(err, "GPS belum siap. Coba ambil ulang lokasi dari area terbuka.") });
    }
  }

  async function submitAttendance(type: "check-in" | "check-out") {
    dispatch({ type: "submitStart" });

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
      const selfieFilename = selfieFilenameRef.current;
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

      dispatch({ type: "submitSuccess", message: type === "check-in" ? "Check-in berhasil disimpan" : "Check-out berhasil disimpan" });
      clearSelfie();
      dispatch({ type: "clearGps" });
      await loadAttendance();
      dispatch({ type: "submitSettled" });
    } catch (err) {
      dispatch({ type: "submitError", error: getCleanAttendanceError(err, "Gagal menyimpan absensi. Silakan coba lagi.") });
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
    return <SuperadminAttendanceView onBack={() => router.back()} />;
  }

  return (
    <div className="phone-screen attendance-screen" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <AttendanceHeader onBack={() => router.back()} avatarName={employee?.fullName || profile?.username || "U"} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div suppressHydrationWarning style={{ fontSize: "14px", fontWeight: 500 }}>{formatDate(new Date())}</div>
        <Info size={18} color="var(--text-muted)" />
      </div>

      <TodayStatusCard isLoading={isLoading} statusContent={statusContent} />

      {todayAttendance && (
        <section className="card p-4" aria-labelledby="today-log-title">
          <h2 id="today-log-title" className="mb-4 text-base font-bold">Log Hari Ini</h2>
          <ol className="relative flex flex-col gap-5 pl-2">
            <span aria-hidden="true" className="absolute left-[19px] bottom-3 top-3 w-0.5 bg-[var(--border-color)]" />
            {([
              { id: "in", label: "Check-In", time: formatTime(todayAttendance.checkInTime), active: Boolean(todayAttendance.checkInTime), tone: "var(--success)" },
              { id: "out", label: "Check-Out", time: formatTime(todayAttendance.checkOutTime), active: Boolean(todayAttendance.checkOutTime), tone: "var(--danger)" },
            ] as const).map((item) => (
              <li key={item.id} className="relative flex items-center gap-4">
                <span
                  className="z-10 flex size-9 shrink-0 items-center justify-center rounded-full border-2 bg-white"
                  style={{ borderColor: item.active ? item.tone : "var(--border-color)", color: item.active ? item.tone : "var(--text-muted)" }}
                  aria-hidden="true"
                >
                  <ClipboardList size={16} />
                </span>
                <div className="flex flex-1 items-center justify-between gap-3">
                  <div>
                    <strong className="block text-sm text-[var(--text-primary)]">{item.label}</strong>
                    <span className="text-xs text-[var(--text-secondary)]">{item.active ? "Tercatat" : "Belum dilakukan"}</span>
                  </div>
                  <span className={`text-sm font-bold ${item.active ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>{item.time}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

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
          if (selfiePreviewUrlRef.current) {
            URL.revokeObjectURL(selfiePreviewUrlRef.current);
          }
          selfiePreviewUrlRef.current = previewUrl;
          const ext = meta.mimeType.split("/")[1] || "webp";
          selfieFilenameRef.current = `attendance-selfie.${ext === "jpeg" ? "jpg" : ext}`;
          dispatch({ type: "setSelfie", blob, previewUrl });
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
            <span className="mb-1 block text-xs text-[var(--text-muted)]">Status</span>
            <strong style={{ fontSize: "13px", color: gpsPosition ? "var(--success)" : "var(--danger)" }}>{gpsPosition ? "GPS siap" : "GPS belum siap"}</strong>
          </div>
          <div className="hris-card-highlight" style={{ border: "1px solid var(--border-color)", borderRadius: "16px", padding: "12px" }}>
            <span className="mb-1 block text-xs text-[var(--text-muted)]">Akurasi</span>
            <strong style={{ fontSize: "13px" }}>{gpsPosition ? `${Math.round(gpsPosition.coords.accuracy)} meter` : "-"}</strong>
          </div>
          <div className="hris-card-highlight" style={{ border: "1px solid var(--border-color)", borderRadius: "16px", padding: "12px" }}>
            <span className="mb-1 block text-xs text-[var(--text-muted)]">Jarak ke lokasi</span>
            <strong style={{ fontSize: "13px" }}>{gpsDistanceMeters !== null ? formatDistanceMeters(gpsDistanceMeters) : "-"}</strong>
          </div>
          <div className="hris-card-highlight" style={{ border: "1px solid var(--border-color)", borderRadius: "16px", padding: "12px" }}>
            <span className="mb-1 block text-xs text-[var(--text-muted)]">Radius resmi</span>
            <strong style={{ fontSize: "13px" }}>{assignedLocation ? formatDistanceMeters(assignedLocation.radius) : "-"}</strong>
          </div>
        </div>
        {isInsideRadius !== null && (
          <output
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
          </output>
        )}
        {gpsError && <div role="alert" style={{ color: "var(--danger)", fontSize: "12px", fontWeight: 600 }}>{gpsError}</div>}
        <output aria-live="polite" style={{ color: missingRequirements.length ? "var(--text-secondary)" : "var(--success)", fontSize: "12px", fontWeight: 600 }}>
          {actionHint}
        </output>
        <button type="button" className="btn btn-secondary" onClick={refreshGps} disabled={isGettingGps || isSubmitting}>
          {isGettingGps ? "Mengambil GPS…" : "Ambil Ulang GPS"}
        </button>
      </section>

      <AttendanceActions
        isSubmitting={isSubmitting}
        checkInDisabled={checkInDisabled}
        checkOutDisabled={checkOutDisabled}
        onCheckIn={() => submitAttendance("check-in")}
        onCheckOut={() => submitAttendance("check-out")}
      />

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
          <div className="relative size-20 overflow-hidden rounded-lg bg-[#eaeaea]">
            <div className="absolute inset-0 bg-[radial-gradient(#ccc_1px,transparent_1px)] bg-[length:10px_10px] opacity-50" />
            <MapPin size={24} color="var(--danger)" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700 }}>Riwayat Kehadiran</h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {history.length === 0 ? (
            <output className="card empty-state-card" style={{ padding: "32px 16px", textAlign: "center", fontSize: "12px", color: "var(--text-secondary)" }}>
              <Info size={32} className="mx-auto mb-2 text-[var(--text-muted)]" />
              Belum ada riwayat kehadiran.
            </output>
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
                      onClick={() => dispatch({ type: "openViewer", record, kind: "check-in" })}
                      style={{ fontSize: "12px" }}
                    >
                      Lihat Selfie Masuk
                    </button>
                  )}
                  {record.checkOutTime && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => dispatch({ type: "openViewer", record, kind: "check-out" })}
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
          onClose={() => dispatch({ type: "closeViewer" })}
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
