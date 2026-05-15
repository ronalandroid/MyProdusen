export enum CacheTTL {
  SHORT = 60,           // 1 minute - frequently changing data
  MEDIUM = 300,         // 5 minutes - moderately stable data
  LONG = 1800,          // 30 minutes - stable data
  VERY_LONG = 3600,     // 1 hour - rarely changing data
}

export const CacheStrategy = {
  // Attendance - changes frequently during work hours
  attendanceToday: CacheTTL.SHORT,
  attendanceList: CacheTTL.MEDIUM,
  attendanceSummary: CacheTTL.MEDIUM,
  attendanceStats: CacheTTL.SHORT,

  // Employees - changes less frequently
  employeeList: CacheTTL.MEDIUM,
  employeeDetail: CacheTTL.MEDIUM,
  employeeCount: CacheTTL.MEDIUM,

  // Work locations - stable configuration
  workLocationActive: CacheTTL.LONG,
  workLocationDetail: CacheTTL.LONG,
  workLocationList: CacheTTL.LONG,

  // Shifts - stable configuration
  shiftActive: CacheTTL.LONG,
  shiftDetail: CacheTTL.LONG,
  shiftList: CacheTTL.LONG,

  // Leave requests - moderate changes
  leavePending: CacheTTL.MEDIUM,
  leaveList: CacheTTL.MEDIUM,
  leaveDetail: CacheTTL.MEDIUM,

  // Dashboard - aggregated data
  dashboardStats: CacheTTL.SHORT,
  dashboardCharts: CacheTTL.MEDIUM,
  dashboardSummary: CacheTTL.MEDIUM,
};

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  compress?: boolean;
}

export const DEFAULT_CACHE_TTL = parseInt(
  process.env.CACHE_DEFAULT_TTL || '300',
  10
);

export const CACHE_ENABLED = process.env.CACHE_ENABLED !== 'false';
