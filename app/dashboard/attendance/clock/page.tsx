"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useReducer, useRef, useState } from "react";
import { ArrowLeft, CalendarClock, LocateFixed, ShieldCheck } from "lucide-react";
import { fetchProfile, getAuthHeaders, type ClientUserProfile } from "@/lib/auth-client";
import { useQueryClient } from "@tanstack/react-query";
import { AttendanceMap } from "@/components/attendance/AttendanceMap";

const RealtimeSelfieCamera = dynamic(
  () => import("@/components/attendance/RealtimeSelfieCamera").then((mod) => mod.RealtimeSelfieCamera),
  { ssr: false, loading: () => <div className="card p-4 text-sm text-[var(--text-secondary)]">Mengaktifkan kamera…</div> },
);

type AttendanceRecord = { id: string; checkInTime: string; checkOutTime?: string | null; status?: string | null; checkInDistance?: number | null; checkOutDistance?: number | null; checkInGeoStatus?: string | null; checkOutGeoStatus?: string | null };
type ApiResponse<T> = { success: boolean; data?: T; error?: string; message?: string };
type ClockType = "clock-in" | "clock-out";
type Step = "location" | "selfie" | "send";

const fullDateFormatter = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const shortDateFormatter = new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const shortTimeFormatter = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });
const stepItems: Array<{ id: Step; label: string }> = [
  { id: "location", label: "Lokasi" },
  { id: "selfie", label: "Selfie" },
];

type UiState = {
  step: Step;
  note: string;
  manualReason: string;
  isSubmitting: boolean;
  statusText: string;
  message: string;
  error: string;
};

const initialUiState: UiState = {
  step: "location",
  note: "",
  manualReason: "",
  isSubmitting: false,
  statusText: "Mengambil lokasi Anda…",
  message: "",
  error: "",
};

function uiReducer(state: UiState, updates: Partial<UiState>) {
  return { ...state, ...updates };
}

function formatDate(value = new Date()) {
  return fullDateFormatter.format(value);
}

// Source-contract helper
function formatTime(value?: string | null) {
  if (!value) return "-";
  return shortTimeFormatter.format(new Date(value));
}

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radius = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return radius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function formatDistanceMeters(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(1)} km` : `${Math.round(value)} m`;
}

function cleanError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  if (/denied|permission/i.test(message)) return "Lokasi tidak dapat diakses. Izinkan lokasi di browser Anda.";
  if (/accuracy|akurasi/i.test(message)) return "Akurasi GPS belum cukup baik. Coba pindah ke area terbuka.";
  if (/camera|kamera/i.test(message)) return "Kamera tidak dapat diakses. Izinkan kamera di browser Anda.";
  if (!message || /TypeError|ReferenceError|Cannot read/i.test(message)) return "Absensi belum dapat dikirim. Coba lagi.";
  return message;
}

export default function AttendanceClockPage() {
  return (
    <Suspense fallback={<div className="phone-screen attendance-screen p-4 text-sm text-[var(--text-secondary)]">Memuat absensi…</div>}>
      <AttendanceClockContent />
    </Suspense>
  );
}

function AttendanceClockContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const type = (searchParams.get("type") === "clock-out" ? "clock-out" : "clock-in") as ClockType;
  const isClockIn = type === "clock-in";
  const [ui, setUi] = useReducer(uiReducer, initialUiState);
  const [profile, setProfile] = useState<ClientUserProfile | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [gpsPosition, setGpsPosition] = useState<GeolocationPosition | null>(null);
  const [gpsError, setGpsError] = useState(() => (typeof navigator !== "undefined" && !navigator.geolocation ? "Lokasi tidak dapat diakses. Izinkan lokasi di browser Anda." : ""));
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [selfiePreviewUrl, setSelfiePreviewUrl] = useState("");
  const livenessRef = useRef({ score: 0, passed: false, unsupported: false, faceDetected: false });
  const selfieFilenameRef = useRef("attendance-selfie.webp");
  const todayAttendanceRef = useRef<AttendanceRecord | null>(null);
  const { step, note, manualReason, isSubmitting, statusText, message, error } = ui;

  const employee = profile?.employee;
  const location = employee?.defaultLocation;
  const shift = employee?.defaultShift;
  const allowedRadius = location?.radius || 150;
  const gpsDistance = gpsPosition && location ? distanceMeters(gpsPosition.coords.latitude, gpsPosition.coords.longitude, location.latitude, location.longitude) : null;
  const insideRadius = gpsDistance !== null ? gpsDistance <= allowedRadius : null;
  const hasValidGps = Boolean(gpsPosition && !gpsError);
  const missingRequirements = [
    !gpsPosition ? "GPS belum siap" : null,
    !selfieBlob ? "Selfie wajib diambil" : null,
  ].filter(Boolean);
  const canContinue = Boolean(hasValidGps && (insideRadius || manualReason.trim().length >= 10));
  const canSubmit = Boolean(selfieBlob && hasValidGps && (insideRadius || manualReason.trim().length >= 10) && !isSubmitting);

  const selfieTitle = isClockIn ? "Ambil Selfie Clock In" : "Ambil Selfie Clock Out";
  const submitLabel = isClockIn ? "Kirim Clock In" : "Kirim Clock Out";
  const shiftLabel = shift ? `${shift.name} (${shift.startTime.slice(0, 5)} - ${shift.endTime.slice(0, 5)})` : "Shift belum tersedia";

  const clearSelfie = useCallback(() => {
    setSelfieBlob(null);
    livenessRef.current = { score: 0, passed: false, unsupported: false, faceDetected: false };
    setSelfiePreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return "";
    });
  }, []);

  const loadData = useCallback(async () => {
    const current = await fetchProfile();
    if (current.role === "SUPERADMIN") {
      router.replace("/dashboard/attendance");
      return;
    }
    setProfile(current);
    const [todayRes, historyRes] = await Promise.all([
      fetch("/api/attendance/today", { headers: getAuthHeaders(), cache: "no-store" }),
      fetch("/api/attendance", { headers: getAuthHeaders(), cache: "no-store" }),
    ]);
    const today = (await todayRes.json()) as ApiResponse<AttendanceRecord | null>;
    const list = (await historyRes.json()) as ApiResponse<AttendanceRecord[]>;
    if (today.success) todayAttendanceRef.current = today.data || null;
    if (list.success) setHistory((list.data || []).slice(0, 6));
  }, [router]);

  useEffect(() => {
    let watchId: number | null = null;
    void loadData().catch((err) => setUi({ error: cleanError(err) }));
    if (!navigator.geolocation) {
      return;
    }
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsPosition(pos);
        setGpsError(pos.coords.accuracy > 100 ? "Akurasi GPS belum cukup baik. Coba pindah ke area terbuka." : "");
        setUi({ statusText: "Memvalidasi lokasi…" });
      },
      (err) => {
        setGpsPosition(null);
        setGpsError(cleanError(err));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      clearSelfie();
    };
  }, [clearSelfie, loadData]);

  function handleRecenter() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGpsError("Lokasi tidak dapat diakses. Izinkan lokasi di browser Anda.");
      return;
    }
    setUi({ statusText: "Memperbarui lokasi…" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsPosition(pos);
        setGpsError(pos.coords.accuracy > 100 ? "Akurasi GPS belum cukup baik. Coba pindah ke area terbuka." : "");
        setUi({ statusText: "Memvalidasi lokasi…" });
      },
      (err) => {
        setGpsError(cleanError(err));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  async function submitAttendance() {
    if (!canSubmit || !selfieBlob || !employee?.defaultLocation?.id) return;
    setUi({ step: "send", isSubmitting: true, error: "", message: "" });
    try {
      setUi({ statusText: "Mengoptimalkan foto…" });
      const formData = new FormData();
      formData.set("latitude", String(gpsPosition!.coords.latitude));
      formData.set("longitude", String(gpsPosition!.coords.longitude));
      formData.set("accuracy", String(gpsPosition!.coords.accuracy));
      formData.set("gpsTimestamp", new Date(gpsPosition!.timestamp || Date.now()).toISOString());
      formData.set("distance", String(Math.round(gpsDistance || 0)));
      formData.set("type", type);
      formData.set("deviceInfo", navigator.userAgent);
      formData.set("livenessScore", String(livenessRef.current.score));
      formData.set("livenessPassed", String(livenessRef.current.passed));
      formData.set("faceDetected", String(livenessRef.current.faceDetected));
      formData.set("livenessUnsupported", String(livenessRef.current.unsupported));
      const selfieFilename = selfieFilenameRef.current;
      formData.set("selfie", selfieBlob, selfieFilename);
      if (note.trim()) formData.set("note", note.trim());
      if (isClockIn) {
        formData.set("workLocationId", employee.defaultLocation.id);
        if (employee.defaultShift?.id) formData.set("shiftId", employee.defaultShift.id);
      } else if (todayAttendanceRef.current?.id) {
        formData.set("attendanceId", todayAttendanceRef.current.id);
      }
      
      // If outside geofence, submit the manual correction reason
      if (insideRadius === false && manualReason.trim()) {
        formData.set("manualReason", manualReason.trim());
      }
      
      setUi({ statusText: "Mengirim absensi…" });
      const response = await fetch(`/api/attendance/${isClockIn ? "check-in" : "check-out"}`, { method: "POST", headers: getAuthHeaders(), body: formData });
      const result = (await response.json()) as ApiResponse<AttendanceRecord & { isPendingGeoReview?: boolean }>;
      if (!response.ok || !result.success) throw new Error(result.error || result.message || "Gagal menyimpan absensi");
      setUi({ statusText: "Menyimpan riwayat…", message: isClockIn ? "Clock In berhasil." : "Clock Out berhasil." });
      clearSelfie();
      // Invalidate the dashboard cache so beranda reflects this clock event
      // the instant the user navigates back — no 30s poll wait, no stale card.
      void queryClient.invalidateQueries({ queryKey: ["employee-beranda"] });
      const pending = result.data?.isPendingGeoReview || insideRadius === false ? "&pending=1" : "";
      router.push(`/dashboard/attendance/success?type=${type}${pending}`);
    } catch (err) {
      setUi({ step: "selfie", error: cleanError(err) });
    } finally {
      setUi({ isSubmitting: false });
    }
  }

  return (
    <div className="phone-screen attendance-screen pb-[calc(96px+env(safe-area-inset-bottom))]" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <header className="flex items-center gap-3">
        <button type="button" className="btn btn-secondary btn-icon min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]" onClick={() => (step === "location" ? router.back() : setUi({ step: "location" }))} aria-label="Kembali"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="text-xl font-black text-[var(--text-primary)]">{isClockIn ? "Clock In" : "Clock Out"}</h1>
          <p className="text-xs font-bold text-[var(--text-secondary)]">{step === "location" ? "Langkah 1 dari 2" : "Langkah 2 dari 2"}</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2" aria-label="Step indicator">
        {stepItems.map((item, index) => <div key={item.id} className={`rounded-full px-3 py-2 text-center text-xs font-extrabold transition-all ${item.id === step ? "bg-[var(--primary)] text-[var(--text-primary)]" : "bg-white text-[var(--text-secondary)] border border-[var(--border-color)]"}`}>Langkah {index + 1}: {item.label}</div>)}
      </div>

      {(message || error) && <div role={error ? "alert" : "status"} className={`text-xs font-bold ${error ? "text-[var(--danger)] bg-red-50 border border-red-200 rounded-2xl p-3" : "text-[var(--success)] bg-green-50 border border-green-200 rounded-2xl p-3"}`}>{error || message}</div>}

      <section className="card flex items-center gap-3 border border-[var(--attn-warn-border-soft)] bg-gradient-to-br from-[var(--attn-warn-bg)] to-white p-3" aria-label="Shift aktif">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)] text-[var(--text-primary)]" aria-hidden="true">
          <CalendarClock size={20} />
        </span>
        <div className="min-w-0">
          <strong className="block truncate text-sm font-extrabold text-[var(--text-primary)]">{shift?.name || "Shift belum tersedia"}</strong>
          <span className="text-xs font-semibold text-[var(--text-secondary)]" suppressHydrationWarning>
            {shortDateFormatter.format(new Date())}{shift ? ` · ${shift.startTime.slice(0, 5)} - ${shift.endTime.slice(0, 5)}` : ""}
          </span>
        </div>
      </section>


      {step === "location" && (
        <>
          {location && (
            <section className="card overflow-hidden border border-[var(--border-color)] bg-white p-1" aria-label="Map lokasi absensi">
              <AttendanceMap
                officeLatitude={Number(location.latitude)}
                officeLongitude={Number(location.longitude)}
                radiusMeters={allowedRadius}
                userLatitude={gpsPosition?.coords.latitude}
                userLongitude={gpsPosition?.coords.longitude}
                height={280}
                onRecenter={handleRecenter}
              />
            </section>
          )}

          <section className="card p-4 flex flex-col gap-3" aria-labelledby="gps-title">
            <div className="flex items-center justify-between"><h2 id="gps-title" className="text-base font-extrabold">Validasi Lokasi</h2><LocateFixed className="text-[var(--primary-dark)] animate-pulse" size={22} /></div>
            
            {insideRadius === true && (
              <div className="flex items-center gap-3 rounded-2xl p-4 text-xs font-extrabold leading-normal animate-fade-in" style={{ background: "rgba(46,125,50,0.10)", border: "1px solid rgba(46,125,50,0.35)", color: "var(--attn-success)" }}>
                <ShieldCheck size={20} className="shrink-0" style={{ color: "var(--attn-success)" }} />
                <div>Anda berada di lokasi yang valid. Radius area absensi {allowedRadius} meter.</div>
              </div>
            )}

            <div className="card p-4 border border-[var(--border-color)] bg-white flex items-center gap-3">
              <ShieldCheck size={18} className="text-[var(--text-secondary)] shrink-0" />
              <span className="text-xs font-bold text-[var(--text-secondary)]">Pastikan Anda berada di lokasi absensi yang valid.</span>
            </div>

            <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border-color)] p-3 bg-white"><span className="block text-[var(--text-muted)] font-semibold mb-0.5">Lokasi Anda</span><strong>{gpsPosition ? `${gpsPosition.coords.latitude.toFixed(6)}, ${gpsPosition.coords.longitude.toFixed(6)}` : "GPS belum siap"}</strong></div>
              <div className="rounded-2xl border border-[var(--border-color)] p-3 bg-white"><span className="block text-[var(--text-muted)] font-semibold mb-0.5">Lokasi kerja</span><strong>{location?.name || "Produsen Dimsum Medan"}</strong></div>
              <div className="rounded-2xl border border-[var(--border-color)] p-3 bg-white"><span className="block text-[var(--text-muted)] font-semibold mb-0.5">Jarak ke lokasi</span><strong>{gpsDistance === null ? "-" : formatDistanceMeters(gpsDistance)}</strong></div>
              <div className="rounded-2xl border border-[var(--border-color)] p-3 bg-white"><span className="block text-[var(--text-muted)] font-semibold mb-0.5">Akurasi GPS</span><strong>{gpsPosition ? `${Math.round(gpsPosition.coords.accuracy)} m` : "GPS belum siap"}</strong></div>
              <div className="rounded-2xl border border-[var(--border-color)] p-3 bg-white"><span className="block text-[var(--text-muted)] font-semibold mb-0.5">Jarak Anda:</span><strong>{gpsDistance === null ? "-" : formatDistanceMeters(gpsDistance)}</strong></div>
              <div className="rounded-2xl border border-[var(--border-color)] p-3 bg-white"><span className="block text-[var(--text-muted)] font-semibold mb-0.5">Radius diizinkan:</span><strong>{formatDistanceMeters(allowedRadius)}</strong></div>
              <div className="rounded-2xl border border-[var(--border-color)] p-3 bg-white"><span className="block text-[var(--text-muted)] font-semibold mb-0.5">Status:</span><strong>{insideRadius === false ? "Di luar radius" : insideRadius === true ? "Dalam radius" : "Memvalidasi lokasi"}</strong></div>
            </div>
            
            {gpsError && <p role="alert" className="text-xs font-bold text-[var(--danger)] bg-red-50 border border-red-200 rounded-2xl p-3">{gpsError}</p>}
            {insideRadius === false && (
              <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 text-xs font-bold text-[var(--danger)] leading-relaxed animate-fade-in flex flex-col gap-2">
                <p>Anda berada di luar radius lokasi kerja.</p>
                <div className="mt-1 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[var(--text-primary)]">
                  <label className="text-xs font-extrabold text-amber-800" htmlFor="manual-reason">Ajukan Koreksi Manual</label>
                  <textarea id="manual-reason" className="mt-2 w-full rounded-2xl border border-amber-200 p-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]" rows={3} value={manualReason} onChange={(event) => setUi({ manualReason: event.target.value })} minLength={10} placeholder="Alasan koreksi minimal 10 karakter dan wajib approval Superadmin." />
                  <p className="mt-2 text-[10px] font-semibold text-amber-700">Audit log dibuat dan koreksi tidak bypass Superadmin approval.</p>
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {step === "selfie" && (
        <>
          <RealtimeSelfieCamera capturedPreviewUrl={selfiePreviewUrl} disabled={isSubmitting} autoStart captureLabel="Ambil Foto" retakeLabel="Ulangi Foto" onCapture={({ blob, previewUrl, meta, liveness }) => { if (selfiePreviewUrl) URL.revokeObjectURL(selfiePreviewUrl); setSelfieBlob(blob); setSelfiePreviewUrl(previewUrl); livenessRef.current = liveness; const ext = meta.mimeType.split("/")[1] || "webp"; selfieFilenameRef.current = `attendance-selfie.${ext === "jpeg" ? "jpg" : ext}`; }} onClear={clearSelfie} />
          
          <section className="card p-4"><label className="text-sm font-extrabold" htmlFor="attendance-note">Catatan (opsional)</label><textarea id="attendance-note" maxLength={150} className="mt-2 w-full rounded-2xl border border-[var(--border-color)] p-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]" rows={3} value={note} onChange={(event) => setUi({ note: event.target.value })} placeholder="Tulis catatan jika diperlukan…" /><div className="mt-1 text-right text-[10px] font-semibold text-[var(--text-muted)]">{note.length}/150</div></section>
        </>
      )}

      {step === "location" && (
      <section className="card p-4 border border-[var(--border-color)] bg-white" aria-label="Riwayat absensi terbaru">
        {history.length === 0 ? (
          <output className="text-xs font-semibold text-[var(--text-secondary)]">Belum ada riwayat absensi.</output>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((record) => (
              <div key={record.id} className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)]">
                <span>{shortDateFormatter.format(new Date(record.checkInTime))}</span>
                <span>{formatTime(record.checkInTime)} - {formatTime(record.checkOutTime)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border-color)] bg-white/95 p-4 pb-[calc(16px+env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex max-w-[520px] flex-col gap-2">
          <output className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]" aria-live="polite"><ShieldCheck size={14} />{isSubmitting ? statusText : step === "location" ? (gpsError || (gpsPosition ? "Memvalidasi lokasi…" : "Mengambil lokasi Anda…")) : canSubmit ? "Siap dikirim" : (missingRequirements.join(", ") || "Ambil foto untuk melanjutkan")}</output>
          {step === "location" ? <button type="button" className="min-h-[52px] w-full rounded-2xl font-extrabold text-white bg-[var(--attn-red)] hover:bg-[var(--attn-red-hover)] disabled:bg-gray-200 disabled:text-gray-400 transition-all" disabled={!canContinue} onClick={() => setUi({ step: "selfie" })}>Lanjutkan</button> : <button type="button" className="min-h-[52px] w-full rounded-2xl font-extrabold text-white bg-[var(--attn-red)] hover:bg-[var(--attn-red-hover)] disabled:bg-gray-200 disabled:text-gray-400 transition-all" disabled={!canSubmit} onClick={submitAttendance}>{isSubmitting ? statusText : submitLabel}</button>}
          <Link href="/dashboard/attendance" className="text-center text-xs font-bold text-[var(--text-secondary)] underline-offset-2 hover:underline mt-1">Daftar Absensi</Link>
        </div>
      </div>
    </div>
  );
}
