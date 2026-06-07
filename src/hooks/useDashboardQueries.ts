"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProfile, getAuthHeaders, type ClientUserProfile } from "@/lib/auth-client";
import { parseJsonResponse } from "@/lib/api/safe-json";
import type { UserRole } from "@/lib/permissions";

export type ProfileMe = {
  role: UserRole;
  fullName: string;
  phone: string;
  address: string;
  profilePhoto: string;
  profileCompleted: boolean;
  assignmentStatus: {
    hasDivision: boolean;
    hasPosition: boolean;
    hasLocation: boolean;
    hasShift: boolean;
    hasTeam: boolean;
  };
};

export type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  error?: string | { message?: string };
  message?: string;
};

export const dashboardQueryKeys = {
  profile: ["auth", "profile"] as const,
  profileMe: ["profile", "me"] as const,
  dashboardStats: ["dashboard", "stats"] as const,
  performanceScores: ["performance", "scores"] as const,
  performanceAnomalies: ["performance", "anomalies"] as const,
};

function payloadMessage(payload: ApiEnvelope<unknown> | null, fallback: string) {
  if (!payload) return fallback;
  if (typeof payload.error === "string") return payload.error;
  return payload.error?.message || payload.message || fallback;
}

export async function fetchApiData<T>(url: string, fallbackMessage: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    ...init,
    headers: {
      ...getAuthHeaders(),
      ...(init?.headers || {}),
    },
  });
  const result = await parseJsonResponse<ApiEnvelope<T>>(response);
  const payload = result.data;
  if (!response.ok || !payload?.success) {
    throw new Error(payloadMessage(payload ?? null, fallbackMessage));
  }
  return payload.data as T;
}

export function useCachedProfile() {
  return useQuery<ClientUserProfile>({
    queryKey: dashboardQueryKeys.profile,
    queryFn: fetchProfile,
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });
}

export function useProfileMe() {
  return useQuery<ProfileMe>({
    queryKey: dashboardQueryKeys.profileMe,
    queryFn: () => fetchApiData<ProfileMe>("/api/profile/me", "Sesi tidak valid"),
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });
}

export function useDashboardStats<T>() {
  return useQuery<T>({
    queryKey: dashboardQueryKeys.dashboardStats,
    queryFn: () => fetchApiData<T>("/api/dashboard/stats", "Sebagian data dashboard gagal dimuat."),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function usePerformanceScores<T>(enabled: boolean) {
  return useQuery<T[]>({
    queryKey: dashboardQueryKeys.performanceScores,
    queryFn: () => fetchApiData<T[]>("/api/performance/scores", "Data performa gagal dimuat."),
    enabled,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
}

export function usePerformanceAnomalies<T>(enabled: boolean) {
  return useQuery<T[]>({
    queryKey: dashboardQueryKeys.performanceAnomalies,
    queryFn: () => fetchApiData<T[]>("/api/performance/anomalies", "Data anomali performa gagal dimuat."),
    enabled,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
}

export function useInvalidateDashboardData() {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.profile }),
      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.profileMe }),
      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.dashboardStats }),
      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.performanceScores }),
      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.performanceAnomalies }),
    ]);
  };
}
