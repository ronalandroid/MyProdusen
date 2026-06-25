export type Policy = {
  id: string;
  name: string;
  active: boolean;
  appliesScopeType: string;
  appliesScopeId: string | null;
  graceMinutes: number;
  lateTier1Min: number;
  lateTier1Max: number;
  lateTier1Deduction: number;
  lateTier2Min: number;
  lateTier2Max: number;
  lateTier2Deduction: number;
  halfDayAfterMinutes: number;
  halfDayPayFactor: number;
  geofenceRadiusMeters: number;
  payrollSyncEnabled: boolean;
};

export type Holiday = {
  id: string;
  date: string;
  name: string;
  type: string;
  isPaidHoliday: boolean;
  payMultiplier: number;
};

export type PerformancePeriod = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "CLOSED";
  createdAt: string;
};

export type GamificationConfig = {
  weights: {
    attendance: number;
    kpi: number;
    culture?: number;
    leader: number;
  };
  retroactiveLeaderScoreDays: number;
  cultureScoreSuperadminPriority?: boolean;
  cultureSubcriteriaEnabled?: boolean;
};

export type ThemeConfig = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  themeMode: string;
};

// WCAG Contrast utilities
export function luminance(hex: string) {
  const cleanHex = hex.startsWith("#") ? hex : "#" + hex;
  const rgb = [1, 3, 5].map((idx) => {
    const val = parseInt(cleanHex.slice(idx, idx + 2), 16);
    const channel = isNaN(val) ? 0 : val / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

export function calculateContrast(a: string, b: string) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (light + 0.05) / (dark + 0.05);
}
