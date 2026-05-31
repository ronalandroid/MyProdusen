"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, LocateFixed, MapPin, ShieldCheck } from "lucide-react";
import { fetchProfile, getAuthHeaders, type ClientUserProfile } from "@/lib/auth-client";

const RealtimeSelfieCamera = dynamic(
  () => import("@/components/attendance/RealtimeSelfieCamera").then((mod) => mod.RealtimeSelfieCamera),
  { ssr: false, loading: () => <div className="card p-4 text-sm text-[var(--text-secondary)]">Mengaktifkan kamera…</div> },
);

type AttendanceRecord = { id: string; checkInTime: string; checkOutTime?: string | null; status?: string | null };
type ApiResponse<T> = { success: boolean; data?: T; error?: string; message?: string };

type ClockType = "clock-in" | "clock-out";

function formatDate(value = new Date()) {
  return new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(value);
}

function formatTime(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
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
  if (/camera|kamera/i.test(message)) return "Kamera tidak dapat diakses. Izinkan kamera di browser Anda.";
  if (/gps|location|lokasi|permission|denied/i.test(message)) return "GPS belum siap. Izinkan lokasi dan coba lagi.";
  if (!message || /TypeError|ReferenceError|Cannot read/i.test(message)) return "Absensi belum dapat dikirim. Coba lagi.";
  return message;
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("GPS belum siap"));
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  });
}

export default function AttendanceCapturePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = (searchParams.get("type") === "clock-out" ? "clock-out" : "clock-in") as ClockType;
  const isClockIn = type === "clock-in";
  const title = isClockIn ? "Clock In" : "Clock Out";
  const [profile, setProfile] = useState<ClientUserProfile | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [gpsPosition, setGpsPosition] = useState<GeolocationPosition | null>(null);
  const [gpsError, setGpsError] = useState("");
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [selfiePreviewUrl, setSelfiePreviewUrl] = useState("");
  const [selfieFilename, setSelfieFilename] = useState("attendance-selfie.webp");
  const [note, setNote] = useState("");
  const [manualReason, setManualReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("Mengaktifkan kamera…");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const employee = profile?.employee;
  const location = employee?.defaultLocation;
  const shift = employee?.defaultShift;
  const radius = location?.radius || 150;
  const gpsDistance = gpsPosition && location ? distanceMeters(gpsPosition.coords.latitude, gpsPosition.coords.longitude, location.latitude, location.longitude) : null;
  const insideRadius = gpsDistance !== null ? gpsDistance <= radius : null;
  const canSubmit = Boolean(selfieBlob && gpsPosition && insideRadius !== false && !isSubmitting);

  const shiftLabel = useMemo(() => {
    if (!shift) return "Shift belum tersedia";
    return `${shift.name} (${shift.startTime.slice(0, 5)} - ${shift.endTime.slice(0, 5)})`;
  }, [shift]);

  function clearSelfie() {
    setSelfieBlob(null);
    setSelfiePreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return "";
    });
  }

  async function refreshGps() {
    setStatusText("Memvalidasi GPS…");
    setGpsError("");
    try {
      setGpsPosition(await getPosition());
    } catch (err) {
      setGpsPosition(null);
      setGpsError(cleanError(err));
    }
  }

  async function loadData() {
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
    if (today.success) setTodayAttendance(today.data || null);
    if (list.success) setHistory((list.data || []).slice(0, 6));
  }

  useEffect(() => {
    void loadData().catch((err) => setError(cleanError(err)));
    void refreshGps();
    return () => clearSelfie();
  }, []);

  async function submitAttendance() {
    if (!canSubmit || !employee?.defaultLocation?.id) return;
    setIsSubmitting(true);
    setError("");
    setMessage("");
    try {
      setStatusText("Mengoptimalkan selfie…");
      const formData = new FormData();
      formData.set("latitude", String(gpsPosition!.coords.latitude));
      formData.set("longitude", String(gpsPosition!.coords.longitude));
      formData.set("accuracy", String(gpsPosition!.coords.accuracy));
      formData.set("gpsTimestamp", new Date(gpsPosition!.timestamp || Date.now()).toISOString());
      formData.set("deviceInfo", navigator.userAgent);
      formData.set("selfie", selfieBlob!, selfieFilename);
      if (note.trim()) formData.set("note", note.trim());
      if (isClockIn) {
        formData.set("workLocationId", employee.defaultLocation.id);
        if (employee.defaultShift?.id) formData.set("shiftId", employee.defaultShift.id);
      } else if (todayAttendance?.id) {
        formData.set("attendanceId", todayAttendance.id);
      }
      setStatusText("Mengirim absensi…");
      const response = await fetch(`/api/attendance/${isClockIn ? "check-in" : "check-out"}`, { method: "POST", headers: getAuthHeaders(), body: formData });
      const result = (await response.json()) as ApiResponse<AttendanceRecord>;
      if (!response.ok || !result.success) throw new Error(result.error || result.message || "Gagal menyimpan absensi");
      setStatusText("Menyimpan riwayat…");
      setMessage(isClockIn ? "Clock In berhasil." : "Clock Out berhasil.");
      clearSelfie();
      await loadData();
      setTimeout(() => router.push("/dashboard/attendance"), 700);
    } catch (err) {
      setError(cleanError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="phone-screen attendance-screen pb-[calc(96px+env(safe-area-inset-bottom))]" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <header className="flex items-center gap-3">
        <button type="button" className="btn btn-secondary btn-icon min-h-[44px]" onClick={() => router.back()} aria-label="Kembali"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="text-xl font-extrabold text-[var(--text-primary)]">{title}</h1>
          <p className="text-xs font-semibold text-[var(--text-secondary)]">{formatDate()} · {shiftLabel}</p>
        </div>
      </header>

      <section className="card border border-[#FFECB3] bg-gradient-to-br from-[#FFFDEB] to-white p-4" aria-label="Ringkasan jadwal absensi">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-[var(--primary)] p-3 text-[var(--text-primary)]"><MapPin size={18} /></div>
          <div>
            <h2 className="text-base font-extrabold">{location?.name || "Produsen Dimsum Medan"}</h2>
            <p className="text-xs font-semibold text-[var(--text-secondary)]">{formatDate()} ({shift?.startTime?.slice(0, 5) || "08:00"} - {shift?.endTime?.slice(0, 5) || "16:00"})</p>
          </div>
        </div>
      </section>

      {(message || error) && <div role={error ? "alert" : "status"} className={`text-sm font-bold ${error ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>{error || message}</div>}

      <span className="sr-only">Posisikan wajah di dalam frame</span>
      <RealtimeSelfieCamera
        capturedPreviewUrl={selfiePreviewUrl}
        disabled={isSubmitting}
        autoStart
        onCapture={({ blob, previewUrl, meta }) => {
          if (selfiePreviewUrl) URL.revokeObjectURL(selfiePreviewUrl);
          setSelfieBlob(blob);
          setSelfiePreviewUrl(previewUrl);
          const ext = meta.mimeType.split("/")[1] || "webp";
          setSelfieFilename(`attendance-selfie.${ext === "jpeg" ? "jpg" : ext}`);
        }}
        onClear={clearSelfie}
      />

      <section className="card p-4" aria-labelledby="gps-validation-title">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 id="gps-validation-title" className="text-base font-extrabold">Memvalidasi lokasi…</h2>
            <p className="text-xs font-semibold text-[var(--text-secondary)]">GPS/radius/distance validation tetap dicek ulang server.</p>
          </div>
          <LocateFixed size={22} className="text-[var(--primary-dark)]" />
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-2xl border border-[var(--border-color)] p-3"><span className="block text-[var(--text-muted)]">Akurasi</span><strong>{gpsPosition ? `${Math.round(gpsPosition.coords.accuracy)} m` : "GPS belum siap"}</strong></div>
          <div className="rounded-2xl border border-[var(--border-color)] p-3"><span className="block text-[var(--text-muted)]">Jarak ke lokasi</span><strong>{gpsDistance === null ? "-" : `${Math.round(gpsDistance)} m`}</strong></div>
          <div className="rounded-2xl border border-[var(--border-color)] p-3"><span className="block text-[var(--text-muted)]">Radius diizinkan</span><strong>{radius} m</strong></div>
          <div className="rounded-2xl border border-[var(--border-color)] p-3"><span className="block text-[var(--text-muted)]">Status</span><strong>{insideRadius === null ? "GPS belum siap" : insideRadius ? "Di dalam radius" : "Di luar radius"}</strong></div>
        </div>
        {insideRadius === false && <p role="alert" className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-[var(--danger)]">Anda berada di luar radius lokasi kerja.</p>}
        {gpsError && <p role="alert" className="mt-3 text-xs font-bold text-[var(--danger)]">{gpsError}</p>}
        <button type="button" className="btn btn-secondary mt-3 min-h-[44px] w-full" onClick={refreshGps} disabled={isSubmitting}>Ambil Ulang GPS</button>
      </section>

      <section className="card p-4">
        <label className="text-sm font-extrabold" htmlFor="attendance-note">Catatan (opsional)</label>
        <textarea id="attendance-note" className="mt-2 w-full rounded-2xl border border-[var(--border-color)] p-3 text-sm" rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Contoh: lupa membawa atribut, sinyal GPS lemah, dll." />
        {insideRadius === false && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
            <label className="text-sm font-extrabold" htmlFor="manual-reason">Ajukan Koreksi Manual</label>
            <textarea id="manual-reason" className="mt-2 w-full rounded-2xl border border-amber-200 p-3 text-sm" rows={3} value={manualReason} onChange={(event) => setManualReason(event.target.value)} minLength={10} placeholder="Alasan koreksi minimal 10 karakter dan wajib approval Superadmin." />
            <p className="mt-2 text-xs font-semibold text-amber-800">Audit log dibuat dan Superadmin approval required.</p>
          </div>
        )}
      </section>

      <section className="card p-4" aria-labelledby="attendance-history-title">
        <h2 id="attendance-history-title" className="mb-3 text-base font-extrabold">Daftar Absensi</h2>
        {history.length === 0 ? <p className="text-sm text-[var(--text-secondary)]">Belum ada riwayat absensi.</p> : (
          <div className="flex flex-col divide-y divide-[var(--border-color)]">
            {history.map((item) => <div key={item.id} className="flex min-h-[56px] items-center justify-between gap-3 py-3"><div><strong className="block text-sm">{formatTime(item.checkInTime)}</strong><span className="text-xs text-[var(--text-secondary)]">{new Date(item.checkInTime).toLocaleDateString("id-ID", { day: "numeric", month: "long" })}</span></div><span className="text-sm font-bold">Clock In</span><ChevronRight size={16} /></div>)}
          </div>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border-color)] bg-white/95 p-4 pb-[calc(16px+env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex max-w-[520px] flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]"><ShieldCheck size={14} />{isSubmitting ? statusText : canSubmit ? "Siap dikirim" : selfieBlob ? "Memvalidasi GPS…" : "Ambil selfie untuk melanjutkan"}</div>
          <button type="button" className="btn btn-primary min-h-[52px] w-full rounded-2xl font-extrabold" disabled={!canSubmit} onClick={submitAttendance}>{isSubmitting ? statusText : isClockIn ? "Kirim Clock In" : "Kirim Clock Out"}</button>
        </div>
      </div>
    </div>
  );
}
