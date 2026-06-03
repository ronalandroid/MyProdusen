"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useReducer, useRef, useState } from "react";
import { ArrowLeft, ChevronRight, LocateFixed, MapPin, Navigation, ShieldCheck } from "lucide-react";
import { fetchProfile, getAuthHeaders, type ClientUserProfile } from "@/lib/auth-client";

const RealtimeSelfieCamera = dynamic(
  () => import("@/components/attendance/RealtimeSelfieCamera").then((mod) => mod.RealtimeSelfieCamera),
  { ssr: false, loading: () => <div className="card p-4 text-sm text-[var(--text-secondary)]">Mengaktifkan kamera…</div> },
);

type AttendanceRecord = { id: string; checkInTime: string; checkOutTime?: string | null; status?: string | null; checkInDistance?: number | null; checkOutDistance?: number | null; checkInGeoStatus?: string | null; checkOutGeoStatus?: string | null };
type ApiResponse<T> = { success: boolean; data?: T; error?: string; message?: string };
type ClockType = "clock-in" | "clock-out";
type Step = "location" | "selfie" | "send";

const fullDateFormatter = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const shortTimeFormatter = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });
const stepItems: Array<{ id: Step; label: string }> = [
  { id: "location", label: "Lokasi" },
  { id: "selfie", label: "Selfie" },
  { id: "send", label: "Kirim" },
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
  const canContinue = Boolean(hasValidGps && insideRadius);
  const canSubmit = Boolean(selfieBlob && hasValidGps && insideRadius !== false && !isSubmitting);

  const selfieTitle = isClockIn ? "Ambil Selfie Clock In" : "Ambil Selfie Clock Out";
  const submitLabel = isClockIn ? "Kirim Clock In" : "Kirim Clock Out";
  const shiftLabel = shift ? `${shift.name} (${shift.startTime.slice(0, 5)} - ${shift.endTime.slice(0, 5)})` : "Shift belum tersedia";

  const clearSelfie = useCallback(() => {
    setSelfieBlob(null);
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

  async function submitAttendance() {
    if (!canSubmit || !employee?.defaultLocation?.id) return;
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
      formData.set("selfie", selfieBlob!, selfieFilenameRef.current);
      if (note.trim()) formData.set("note", note.trim());
      if (isClockIn) {
        formData.set("workLocationId", employee.defaultLocation.id);
        if (employee.defaultShift?.id) formData.set("shiftId", employee.defaultShift.id);
      } else if (todayAttendanceRef.current?.id) {
        formData.set("attendanceId", todayAttendanceRef.current.id);
      }
      setUi({ statusText: "Mengirim absensi…" });
      const response = await fetch(`/api/attendance/${isClockIn ? "check-in" : "check-out"}`, { method: "POST", headers: getAuthHeaders(), body: formData });
      const result = (await response.json()) as ApiResponse<AttendanceRecord & { isPendingGeoReview?: boolean }>;
      if (!response.ok || !result.success) throw new Error(result.error || result.message || "Gagal menyimpan absensi");
      setUi({ statusText: "Menyimpan riwayat…", message: isClockIn ? "Clock In berhasil." : "Clock Out berhasil." });
      clearSelfie();
      const pending = result.data?.isPendingGeoReview ? "&pending=1" : "";
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
        <button type="button" className="btn btn-secondary btn-icon min-h-[44px]" onClick={() => (step === "location" ? router.back() : setUi({ step: "location" }))} aria-label="Kembali"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="text-xl font-extrabold text-[var(--text-primary)]">{step === "location" ? "Validasi Lokasi" : step === "selfie" ? selfieTitle : submitLabel}</h1>
          <p className="text-xs font-semibold text-[var(--text-secondary)]">{step === "location" ? "Pastikan Anda berada di area kerja sebelum melanjutkan." : `${formatDate()} · ${shiftLabel}`}</p>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2" aria-label="Step indicator">
        {stepItems.map((item, index) => <div key={item.id} className={`rounded-full px-3 py-2 text-center text-xs font-extrabold ${item.id === step ? "bg-[var(--primary)] text-[var(--text-primary)]" : "bg-white text-[var(--text-secondary)] border border-[var(--border-color)]"}`}>{index + 1}. {item.label}</div>)}
      </div>

      {(message || error) && <div role={error ? "alert" : "status"} className={`text-sm font-bold ${error ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>{error || message}</div>}
      <span className="sr-only">Posisikan wajah di dalam frame Akurasi Jarak ke lokasi</span>

      {step === "location" && (
        <>
          <section className="card overflow-hidden border border-[#FFECB3] bg-white" aria-label="Map lokasi absensi">
            <div className="relative h-[clamp(260px,55vh,420px)] min-h-[260px] bg-[#F8FAFC]" style={{ backgroundImage: "linear-gradient(90deg, rgba(148,163,184,.18) 1px, transparent 1px), linear-gradient(rgba(148,163,184,.18) 1px, transparent 1px)", backgroundSize: "34px 34px" }}>
              <div className="absolute inset-6 rounded-[48%] border-4 border-dashed border-[rgba(253,199,4,.65)] bg-[rgba(253,199,4,.08)]" aria-label="radius circle" />
              <div className="absolute left-[20%] top-[58%] flex flex-col items-center gap-1 text-xs font-bold text-[var(--info)]"><Navigation size={28} />Lokasi Anda</div>
              <div className="absolute right-[18%] top-[30%] flex flex-col items-center gap-1 text-xs font-bold text-[var(--danger)]"><MapPin size={30} />Lokasi kerja</div>
              <div className="absolute left-[34%] right-[32%] top-[49%] border-t-2 border-dashed border-[var(--text-muted)]" />
              <div className="absolute left-1/2 top-1/2 max-w-[calc(100%-24px)] -translate-x-1/2 rounded-full bg-white px-3 py-1 text-center text-xs font-extrabold shadow">{gpsDistance === null ? "Mengambil lokasi Anda…" : `Jarak ke kantor ${Math.round(gpsDistance)} m`}</div>
            </div>
          </section>

          <section className="card p-4" aria-labelledby="gps-title">
            <div className="mb-3 flex items-center justify-between"><h2 id="gps-title" className="text-base font-extrabold">Validasi Lokasi</h2><LocateFixed className="text-[var(--primary-dark)]" size={22} /></div>
            <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border-color)] p-3"><span className="block text-[var(--text-muted)]">Lokasi Anda</span><strong>{gpsPosition ? `${gpsPosition.coords.latitude.toFixed(6)}, ${gpsPosition.coords.longitude.toFixed(6)}` : "GPS belum siap"}</strong></div>
              <div className="rounded-2xl border border-[var(--border-color)] p-3"><span className="block text-[var(--text-muted)]">Lokasi kerja</span><strong>{location?.name || "Produsen Dimsum Medan"}</strong></div>
              <div className="rounded-2xl border border-[var(--border-color)] p-3"><span className="block text-[var(--text-muted)]">Jarak ke kantor</span><strong>{gpsDistance === null ? "-" : `${Math.round(gpsDistance)} m`}</strong></div>
              <div className="rounded-2xl border border-[var(--border-color)] p-3"><span className="block text-[var(--text-muted)]">Radius diizinkan</span><strong>{allowedRadius} m</strong></div>
              <div className="rounded-2xl border border-[var(--border-color)] p-3"><span className="block text-[var(--text-muted)]">GPS accuracy</span><strong>{gpsPosition ? `${Math.round(gpsPosition.coords.accuracy)} m` : "GPS belum siap"}</strong></div>
              <div className="rounded-2xl border border-[var(--border-color)] p-3"><span className="block text-[var(--text-muted)]">Status</span><strong>{insideRadius === null ? "GPS belum siap" : insideRadius ? "Di dalam radius" : "Di luar radius"}</strong></div>
            </div>
            {gpsError && <p role="alert" className="mt-3 text-xs font-bold text-[var(--danger)]">{gpsError}</p>}
            {insideRadius === false && <p role="alert" className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-[var(--danger)]">Anda berada di luar radius lokasi kerja.</p>}
            {insideRadius === false && (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                <label className="text-sm font-extrabold" htmlFor="manual-reason">Ajukan Koreksi Manual</label>
                <textarea id="manual-reason" className="mt-2 w-full rounded-2xl border border-amber-200 p-3 text-sm" rows={3} value={manualReason} onChange={(event) => setUi({ manualReason: event.target.value })} minLength={10} placeholder="Alasan koreksi minimal 10 karakter dan wajib approval Superadmin." />
                <p className="mt-2 text-xs font-semibold text-amber-800">Audit log dibuat dan koreksi tidak bypass Superadmin approval.</p>
              </div>
            )}
          </section>
        </>
      )}

      {step === "selfie" && (
        <>
          <section className="card border border-[#FFECB3] bg-gradient-to-br from-[#FFFDEB] to-white p-4"><h2 className="text-base font-extrabold">{selfieTitle}</h2><p className="text-xs font-semibold text-[var(--text-secondary)]">Kamera terbuka setelah Lanjutkan. Posisi GPS tetap dikirim bersama selfie.</p></section>
          <RealtimeSelfieCamera capturedPreviewUrl={selfiePreviewUrl} disabled={isSubmitting} autoStart captureLabel="Ambil Foto" retakeLabel="Ulangi Foto" onCapture={({ blob, previewUrl, meta }) => { if (selfiePreviewUrl) URL.revokeObjectURL(selfiePreviewUrl); setSelfieBlob(blob); setSelfiePreviewUrl(previewUrl); const ext = meta.mimeType.split("/")[1] || "webp"; selfieFilenameRef.current = `attendance-selfie.${ext === "jpeg" ? "jpg" : ext}`; }} onClear={clearSelfie} />
          <section className="card p-4"><label className="text-sm font-extrabold" htmlFor="attendance-note">Catatan (opsional)</label><textarea id="attendance-note" className="mt-2 w-full rounded-2xl border border-[var(--border-color)] p-3 text-sm" rows={3} value={note} onChange={(event) => setUi({ note: event.target.value })} placeholder="Contoh: GPS lemah, shift khusus, atau catatan lain." /></section>
        </>
      )}

      <section className="card p-4" aria-labelledby="attendance-history-title" hidden={step !== "location"}>
        <h2 id="attendance-history-title" className="mb-3 text-base font-extrabold">Daftar Absensi</h2>
        {history.length === 0 ? <p className="text-sm text-[var(--text-secondary)]">Belum ada riwayat absensi.</p> : <div className="flex flex-col divide-y divide-[var(--border-color)]">{history.map((item) => <div key={item.id} className="flex min-h-[56px] items-center justify-between gap-3 py-3"><div><strong className="block text-sm">{formatTime(item.checkInTime)} / {formatTime(item.checkOutTime)}</strong><span className="text-xs text-[var(--text-secondary)]">{new Date(item.checkInTime).toLocaleDateString("id-ID", { day: "numeric", month: "long" })} · {item.checkInGeoStatus || item.status || "Status"}</span></div><ChevronRight size={16} /></div>)}</div>}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border-color)] bg-white/95 p-4 pb-[calc(16px+env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex max-w-[520px] flex-col gap-2">
          <output className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]" aria-live="polite"><ShieldCheck size={14} />{isSubmitting ? statusText : step === "location" ? (gpsError || (gpsPosition ? "Memvalidasi lokasi…" : "Mengambil lokasi Anda…")) : canSubmit ? "Siap dikirim" : "Ambil foto untuk melanjutkan"}</output>
          {step === "location" ? <button type="button" className="btn btn-primary min-h-[52px] w-full rounded-2xl font-extrabold" disabled={!canContinue} onClick={() => setUi({ step: "selfie" })}>Lanjutkan</button> : <button type="button" className="btn btn-primary min-h-[52px] w-full rounded-2xl font-extrabold" disabled={!canSubmit} onClick={submitAttendance}>{isSubmitting ? statusText : submitLabel}</button>}
        </div>
      </div>
    </div>
  );
}
