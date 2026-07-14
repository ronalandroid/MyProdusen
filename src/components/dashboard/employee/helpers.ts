import {
  Bell,
  Clock,
  Calendar,
  Banknote,
  TimerReset,
  FileText,
  User,
  BarChart3,
} from "lucide-react";
import type { RealtimeEventType } from "@/lib/realtime/events";
import type { ClientUserProfile } from "@/lib/auth-client";
import type { GpsState, WorkLocationDetail } from "./types";

export const statusLabel: Record<string, string> = {
  PRESENT: "Hadir",
  LATE: "Terlambat",
  ABSENT: "Tidak Hadir",
  LEAVE: "Cuti",
  SICK: "Sakit",
  PERMISSION: "Izin",
};

export const statusTone: Record<string, { bg: string; color: string }> = {
  PRESENT: { bg: "rgba(34,197,94,0.12)", color: "var(--success)" },
  LATE: { bg: "rgba(245,158,11,0.18)", color: "var(--warning)" },
  ABSENT: { bg: "rgba(229,57,53,0.12)", color: "var(--danger)" },
  LEAVE: { bg: "rgba(255,193,7,0.18)", color: "var(--primary-dark)" },
  SICK: { bg: "rgba(229,57,53,0.12)", color: "var(--danger)" },
  PERMISSION: { bg: "rgba(59,130,246,0.12)", color: "var(--info)" },
};

const shortDateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  day: "numeric",
  month: "short",
});
const timeFormatter = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });
export const longDateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
export const notificationDateFormatter = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export const quickActions = [
  { name: "Absensi", path: "/dashboard/attendance", icon: Clock, bg: "var(--primary-light)", text: "var(--primary-dark)" },
  { name: "Cuti", path: "/dashboard/leave", icon: Calendar, bg: "rgba(34,197,94,0.1)", text: "var(--success)" },
  { name: "KPI Saya", path: "/dashboard/kpi", icon: BarChart3, bg: "rgba(59,130,246,0.1)", text: "var(--info)" },
  { name: "Payroll Saya", path: "/dashboard/payroll", icon: Banknote, bg: "rgba(245,158,11,0.1)", text: "var(--warning)" },
  { name: "Lembur", path: "/dashboard/overtime", icon: TimerReset, bg: "rgba(229,57,53,0.1)", text: "var(--danger)" },
  { name: "Dokumen", path: "/dashboard/documents", icon: FileText, bg: "rgba(107,114,128,0.1)", text: "#6B7280" },
  { name: "Notifikasi", path: "/dashboard/notifications", icon: Bell, bg: "rgba(124,58,237,0.1)", text: "#7C3AED" },
  { name: "Akun", path: "/dashboard/profile", icon: User, bg: "rgba(251,191,36,0.15)", text: "#D97706" },
];

/**
 * The employee's own work location comes from their profile, which already resolves
 * it. Never fetch GET /api/work-locations/[id] for this: that route is gated behind
 * LOCATION_READ (SUPERADMIN only) and 403s for every EMPLOYEE/LEADER.
 */
export function resolveWorkLocation(profile: ClientUserProfile | null): WorkLocationDetail | null {
  const location = profile?.employee?.defaultLocation;
  if (!location) return null;

  return {
    id: location.id,
    name: location.name,
    address: location.address,
    latitude: location.latitude,
    longitude: location.longitude,
    radius: location.radius,
  };
}

export function startOfMonth(): Date {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
}

export function isoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatShortDate(value: string): string {
  return shortDateFormatter.format(new Date(value));
}

export function formatTime(value?: string | null): string {
  if (!value) return "-";
  return timeFormatter.format(new Date(value));
}

export function isSameLocalDate(value: string, date = new Date()): boolean {
  const parsed = new Date(value);
  return (
    parsed.getFullYear() === date.getFullYear() &&
    parsed.getMonth() === date.getMonth() &&
    parsed.getDate() === date.getDate()
  );
}

export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthRadiusMeters = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(deltaPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  return earthRadiusMeters * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function formatDistance(distance: number | null): string {
  if (distance === null) return "-";
  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(1)} km`;
  }
  return `${Math.round(distance)} m`;
}

export function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "Selamat pagi";
  if (hour >= 11 && hour < 15) return "Selamat siang";
  if (hour >= 15 && hour < 19) return "Selamat sore";
  return "Selamat malam";
}

export function getScoreTone(score: number) {
  if (score >= 90) return { label: "Excellent", text: "text-[var(--success)]", ring: "#15803D", bg: "bg-green-50", border: "border-green-200" };
  if (score >= 75) return { label: "Good", text: "text-[var(--info)]", ring: "#1D4ED8", bg: "bg-blue-50", border: "border-blue-200" };
  if (score >= 60) return { label: "Perlu dijaga", text: "text-[var(--warning)]", ring: "#B45309", bg: "bg-amber-50", border: "border-amber-200" };
  return { label: "Butuh perhatian", text: "text-[var(--danger)]", ring: "#C62828", bg: "bg-red-50", border: "border-red-200" };
}

export function buildStreakCalendar(heatmap: Record<string, string>) {
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const leadingBlankDays = first.getDay();
  return [
    ...Array.from({ length: leadingBlankDays }, (_, index) => ({ key: `blank-${index}`, blank: true as const })),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth(), index + 1);
      const key = isoDate(date);
      const status = heatmap[key];
      const isFuture = date > today;
      return { key, blank: false as const, day: index + 1, status: isFuture ? "FUTURE" : status || (date.getDay() === 0 ? "OFF" : "EMPTY"), isToday: key === isoDate(today) };
    }),
  ];
}

export function getCurrentStreak(heatmap: Record<string, string>) {
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 45; i += 1) {
    const key = isoDate(cursor);
    const status = heatmap[key];
    if (status === "PRESENT" || status === "LATE") streak += 1;
    else if (status && status !== "LEAVE" && status !== "SICK" && status !== "PERMISSION") break;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function gpsReducer(_state: GpsState, nextState: GpsState) {
  return nextState;
}

export const initialGpsState: GpsState = { position: null, error: "", isGetting: false };
export const emptyHeatmap: Record<string, string> = {};
export const dashboardRealtimeEvents: RealtimeEventType[] = ["attendance.updated", "dashboard.updated"];
