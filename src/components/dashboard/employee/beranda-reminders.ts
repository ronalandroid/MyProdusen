export type BerandaReminderTone = "info" | "warning";

export type BerandaReminder = {
  id: string;
  tone: BerandaReminderTone;
  message: string;
};

export type BerandaReminderInput = {
  hasShift: boolean;
  hasLocation: boolean;
  hasProfilePhoto: boolean;
  hasPhone: boolean;
  hasAddress: boolean;
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  /** "HH:MM" or "HH:MM:SS"; null when no shift is assigned. */
  shiftStartTime: string | null;
  shiftEndTime: string | null;
  /** True only when GPS is resolved AND the position falls outside the geofence. */
  isOutsideRadius: boolean;
  now: Date;
};

/** Pop-ups are capped so the beranda never floods the employee. */
export const MAX_VISIBLE_REMINDERS = 2;

const COPY = {
  shiftMissing:
    "Jadwal shift Anda belum diatur. Hubungi Superadmin ya — begitu shift terpasang, Anda langsung bisa mulai absen.",
  locationMissing:
    "Lokasi kerja Anda belum ditentukan. Minta bantuan Superadmin ya, supaya absensi Anda berjalan lancar.",
  clockOutDue:
    "Shift hari ini sudah selesai. Sebelum pulang, jangan lupa Clock Out ya — terima kasih untuk hari ini!",
  clockInDue: "Shift Anda sudah dimulai. Yuk, Clock In dulu — prosesnya hanya sebentar kok.",
  outsideRadius:
    "Sepertinya Anda sedang di luar area kantor. Tetap bisa absen kok — cukup tulis keterangan singkat saat absen.",
  photoMissing: "Yuk, pasang foto profil di menu Akun — biar rekan kerja makin mudah mengenali Anda.",
  contactMissing:
    "Profil Anda belum lengkap. Lengkapi nomor HP dan alamat di menu Akun ya — penting saat ada info mendesak.",
} as const;

function toMinutes(time: string | null): number | null {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

/** Overnight shifts (end <= start) wrap past midnight. */
function isWithinShift(nowMin: number, startMin: number, endMin: number): boolean {
  if (endMin <= startMin) return nowMin >= startMin || nowMin < endMin;
  return nowMin >= startMin && nowMin < endMin;
}

function isAfterShift(nowMin: number, startMin: number, endMin: number): boolean {
  if (endMin <= startMin) return nowMin >= endMin && nowMin < startMin;
  return nowMin >= endMin;
}

export function resolveBerandaReminders(input: BerandaReminderInput): BerandaReminder[] {
  const reminders: BerandaReminder[] = [];

  if (!input.hasShift) {
    reminders.push({ id: "shift-missing", tone: "warning", message: COPY.shiftMissing });
  }

  if (!input.hasLocation) {
    reminders.push({ id: "location-missing", tone: "warning", message: COPY.locationMissing });
  }

  const nowMin = input.now.getHours() * 60 + input.now.getMinutes();
  const startMin = toMinutes(input.shiftStartTime);
  const endMin = toMinutes(input.shiftEndTime);
  const hasShiftWindow = input.hasShift && startMin !== null && endMin !== null;

  if (hasShiftWindow && input.hasCheckedIn && !input.hasCheckedOut && isAfterShift(nowMin, startMin, endMin)) {
    reminders.push({ id: "clockout-due", tone: "info", message: COPY.clockOutDue });
  }

  if (
    hasShiftWindow &&
    input.hasLocation &&
    !input.hasCheckedIn &&
    !input.hasCheckedOut &&
    isWithinShift(nowMin, startMin, endMin)
  ) {
    reminders.push({ id: "clockin-due", tone: "info", message: COPY.clockInDue });
  }

  if (input.isOutsideRadius && input.hasLocation && !input.hasCheckedOut) {
    reminders.push({ id: "outside-radius", tone: "warning", message: COPY.outsideRadius });
  }

  if (!input.hasProfilePhoto) {
    reminders.push({ id: "photo-missing", tone: "info", message: COPY.photoMissing });
  }

  if (!input.hasPhone || !input.hasAddress) {
    reminders.push({ id: "contact-missing", tone: "info", message: COPY.contactMissing });
  }

  return reminders.slice(0, MAX_VISIBLE_REMINDERS);
}
