"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders, type ClientUserProfile } from "@/lib/auth-client";
import { useRealtime } from "@/hooks/useRealtime";
import type {
  DashboardData,
  HeatmapResponse,
  AttendanceResponse,
  WorkLocationResponse,
  AttendanceRecord,
  NotificationItem,
  PerformanceHistoryItem,
  PerformanceBadge,
} from "./types";
import {
  startOfMonth,
  isoDate,
  isSameLocalDate,
  calculateDistanceMeters,
  getTimeOfDayGreeting,
  getScoreTone,
  buildStreakCalendar,
  getCurrentStreak,
  longDateFormatter,
  gpsReducer,
  initialGpsState,
  emptyHeatmap,
  dashboardRealtimeEvents,
} from "./helpers";

export function useEmployeeBeranda(profile: ClientUserProfile | null) {
  const locationId = profile?.employee?.defaultLocation?.id;
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    isFetching: dashboardFetching,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useQuery<DashboardData>({
    queryKey: ["employee-beranda", locationId],
    queryFn: async () => {
      const [heatmapRes, attendanceRes, balanceRes, notifRes, perfRes, historyRes, badgesRes] = await Promise.all([
        fetch("/api/dashboard/heatmap", { headers: getAuthHeaders(), cache: "no-store" }),
        fetch("/api/attendance", { headers: getAuthHeaders(), cache: "no-store" }),
        fetch("/api/leave/balance", { headers: getAuthHeaders(), cache: "no-store" }),
        fetch("/api/notifications", { headers: getAuthHeaders(), cache: "no-store" }),
        fetch("/api/performance/me", { headers: getAuthHeaders(), cache: "no-store" }),
        fetch("/api/performance/me/history", { headers: getAuthHeaders(), cache: "no-store" }),
        fetch("/api/performance/me/badges", { headers: getAuthHeaders(), cache: "no-store" }),
      ]);

      const [heatmapPayload, attendancePayload, balancePayload, notifPayload, perfPayload, historyPayload, badgesPayload] = await Promise.all([
        heatmapRes.json().catch(() => null) as Promise<HeatmapResponse | null>,
        attendanceRes.json().catch(() => null) as Promise<AttendanceResponse | null>,
        balanceRes.ok ? balanceRes.json().catch(() => null) : null,
        notifRes.ok ? notifRes.json().catch(() => null) : null,
        perfRes.ok ? perfRes.json().catch(() => null) : null,
        historyRes.ok ? historyRes.json().catch(() => null) : null,
        badgesRes.ok ? badgesRes.json().catch(() => null) : null,
      ]);

      let workLocationPayload: WorkLocationResponse | null = null;
      if (locationId) {
        const detailRes = await fetch(`/api/work-locations/${locationId}`, {
          headers: getAuthHeaders(),
          cache: "no-store",
        });
        workLocationPayload = (await detailRes.json().catch(() => null)) as WorkLocationResponse | null;
      }

      return {
        heatmap: heatmapRes.ok && heatmapPayload?.success ? heatmapPayload.data?.heatmap ?? {} : {},
        history: attendanceRes.ok && attendancePayload?.success ? attendancePayload.data?.slice(0, 5) ?? [] : [],
        leaveBalance: balancePayload?.success ? balancePayload.data ?? null : null,
        notifications: notifPayload?.success ? notifPayload.data?.slice(0, 3) ?? [] : [],
        perfScore: perfPayload?.success ? perfPayload.data ?? null : null,
        perfHistory: historyPayload?.success ? historyPayload.data ?? [] : [],
        perfBadges: badgesPayload?.success ? badgesPayload.data ?? [] : [],
        workLocation: workLocationPayload?.success ? workLocationPayload.data ?? null : null,
      };
    },
    // Keep the beranda fresh in near-real-time: refetch the moment the user
    // returns to the tab (e.g. straight after a clock-in) and poll on an
    // interval so attendance/notification state never lags behind the DB.
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  useRealtime({
    eventTypes: dashboardRealtimeEvents,
    onEvent: () => {
      void refetchDashboard();
    },
  });

  const heatmap: Record<string, string> = dashboardData?.heatmap ?? emptyHeatmap;
  const history: AttendanceRecord[] = dashboardData?.history ?? [];
  const workLocation = dashboardData?.workLocation ?? null;
  const leaveBalance = dashboardData?.leaveBalance ?? null;
  const notifications: NotificationItem[] = dashboardData?.notifications ?? [];
  const loadError = dashboardError instanceof Error ? dashboardError.message : "";
  const perfScore = dashboardData?.perfScore ?? null;
  const perfHistory: PerformanceHistoryItem[] = dashboardData?.perfHistory ?? [];
  const perfBadges: PerformanceBadge[] = dashboardData?.perfBadges ?? [];
  const isPerfLoading = dashboardLoading;
  const perfProgressState = dashboardFetching ? "Memuat skor performa… Menghitung proyeksi kenaikan…" : "";

  const [gpsState, setGpsState] = useReducer(gpsReducer, initialGpsState);
  // Progressive disclosure: keep the beranda focused on attendance + score;
  // the heavy performance detail (streak calendar, history chart, badges) is
  // collapsed by default and revealed on demand.
  const [showPerformanceDetail, setShowPerformanceDetail] = useState(false);
  const { position: gpsPosition, error: gpsError, isGetting: isGettingGps } = gpsState;

  // eslint-disable-next-line react-doctor/no-cascading-set-state
  useEffect(() => {
    let cancelled = false;

    // Trigger GPS acquisition on mount
    if (typeof window !== "undefined" && navigator.geolocation) {
      setGpsState({ position: null, error: "", isGetting: true });
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!cancelled) {
            setGpsState({ position: pos, error: "", isGetting: false });
          }
        },
        (err) => {
          if (!cancelled) {
            setGpsState({ position: null, error: err.message || "GPS belum siap", isGetting: false });
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    return () => {
      cancelled = true;
    };
  }, [profile?.employee?.defaultLocation?.id]);

  const monthCounts = useMemo(() => {
    const counts = { hadir: 0, izin: 0, cuti: 0, sakit: 0 };
    const monthStart = startOfMonth();
    const today = new Date();
    for (let cursor = new Date(monthStart); cursor <= today; cursor.setDate(cursor.getDate() + 1)) {
      const key = isoDate(cursor);
      const status = heatmap[key];
      if (!status) continue;
      if (status === "PRESENT" || status === "LATE") counts.hadir += 1;
      else if (status === "PERMISSION") counts.izin += 1;
      else if (status === "LEAVE") counts.cuti += 1;
      else if (status === "SICK") counts.sakit += 1;
    }
    return counts;
  }, [heatmap]);

  const displayName = profile?.employee?.fullName || profile?.username || "Karyawan";
  const initials = displayName.substring(0, 2).toUpperCase();
  const currentScore = Math.round(perfScore?.currentScore ?? 100);
  const currentScoreOutOfTen = (currentScore / 10).toFixed(1);
  const scoreTone = getScoreTone(currentScore);
  const streakCalendar = useMemo(() => buildStreakCalendar(heatmap), [heatmap]);
  const currentStreak = useMemo(() => getCurrentStreak(heatmap), [heatmap]);
  const onTimeDays = useMemo(() => Object.values(heatmap).filter((status) => status === "PRESENT").length, [heatmap]);
  const motivationCopy = currentStreak >= 7
    ? "Mantap, ritme kerja sudah konsisten. Jaga kualitas produksi hari ini."
    : `Sedikit lagi menuju streak 7 hari. Datang tepat waktu membantu skor tetap ${currentScore}.`;
  const todayRecord = history.find((record) => isSameLocalDate(record.checkInTime));

  // Geofencing calculations
  const gpsDistanceMeters = gpsPosition && workLocation?.latitude != null && workLocation?.longitude != null
    ? calculateDistanceMeters(
        gpsPosition.coords.latitude,
        gpsPosition.coords.longitude,
        Number(workLocation.latitude),
        Number(workLocation.longitude),
      )
    : null;

  const isInsideRadius = gpsDistanceMeters !== null && workLocation?.radius != null
    ? gpsDistanceMeters <= Number(workLocation.radius)
    : null;

  const defaultShift = profile?.employee?.defaultShift;
  const shiftTimeText = defaultShift
    ? `${defaultShift.name} (${defaultShift.startTime.slice(0, 5)} - ${defaultShift.endTime.slice(0, 5)})`
    : "Shift belum tersedia";

  // Clock status checks
  const hasCheckedIn = Boolean(todayRecord?.checkInTime);
  const hasCheckedOut = Boolean(todayRecord?.checkOutTime);

  const greetingTitle = getTimeOfDayGreeting();
  const todayLabel = useMemo(() => longDateFormatter.format(new Date()), []);

  return {
    workLocation,
    leaveBalance,
    notifications,
    loadError,
    perfScore,
    perfHistory,
    perfBadges,
    isPerfLoading,
    perfProgressState,
    showPerformanceDetail,
    setShowPerformanceDetail,
    gpsPosition,
    gpsError,
    isGettingGps,
    monthCounts,
    displayName,
    initials,
    currentScoreOutOfTen,
    scoreTone,
    streakCalendar,
    currentStreak,
    onTimeDays,
    motivationCopy,
    todayRecord,
    gpsDistanceMeters,
    isInsideRadius,
    shiftTimeText,
    hasCheckedIn,
    hasCheckedOut,
    greetingTitle,
    todayLabel,
  };
}
