import type { ClientUserProfile } from "@/lib/auth-client";

export interface AttendanceRecord {
  id: string;
  checkInTime: string;
  checkOutTime?: string | null;
  status?: string | null;
  workLocation?: { name?: string | null; address?: string | null } | null;
}

export interface HeatmapResponse {
  success: boolean;
  data?: { heatmap: Record<string, string> };
  error?: string;
}

export interface AttendanceResponse {
  success: boolean;
  data?: AttendanceRecord[];
  error?: string;
}

export interface WorkLocationDetail {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

export interface LeaveBalance {
  year: number;
  entitlement: number;
  used: number;
  pending: number;
  available: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export type PerformanceScore = any;
export type PerformanceHistoryItem = any;
export type PerformanceBadge = any;

export interface DashboardData {
  heatmap: Record<string, string>;
  history: AttendanceRecord[];
  leaveBalance: LeaveBalance | null;
  notifications: NotificationItem[];
  perfScore: PerformanceScore | null;
  perfHistory: PerformanceHistoryItem[];
  perfBadges: PerformanceBadge[];
}

export interface Props {
  profile: ClientUserProfile | null;
}

export type GpsState = {
  position: GeolocationPosition | null;
  error: string;
  isGetting: boolean;
};
