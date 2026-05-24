export type FeatureFlagKey =
  | 'recruitment'
  | 'lms'
  | 'reimbursement'
  | 'businessTravel'
  | 'survey'
  | 'asset'
  | 'documents'
  | 'announcements'
  | 'overtime'
  | 'attendance'
  | 'leave'
  | 'kpi'
  | 'payroll'
  | 'reports'
  | 'pwa'
  | 'notifications';

type FeatureFlagEnvKey = `FEATURE_${string}_ENABLED` | `NEXT_PUBLIC_FEATURE_${string}_ENABLED`;

const featureFlagEnvNames: Record<FeatureFlagKey, FeatureFlagEnvKey> = {
  recruitment: 'FEATURE_RECRUITMENT_ENABLED',
  lms: 'FEATURE_LMS_ENABLED',
  reimbursement: 'FEATURE_REIMBURSEMENT_ENABLED',
  businessTravel: 'FEATURE_BUSINESS_TRAVEL_ENABLED',
  survey: 'FEATURE_SURVEY_ENABLED',
  asset: 'FEATURE_ASSET_ENABLED',
  documents: 'FEATURE_DOCUMENTS_ENABLED',
  announcements: 'FEATURE_ANNOUNCEMENTS_ENABLED',
  overtime: 'FEATURE_OVERTIME_ENABLED',
  attendance: 'FEATURE_ATTENDANCE_ENABLED',
  leave: 'FEATURE_LEAVE_ENABLED',
  kpi: 'FEATURE_KPI_ENABLED',
  payroll: 'FEATURE_PAYROLL_ENABLED',
  reports: 'FEATURE_REPORTS_ENABLED',
  pwa: 'FEATURE_PWA_ENABLED',
  notifications: 'FEATURE_NOTIFICATIONS_ENABLED',
};

const publicFeatureFlagEnvNames: Record<FeatureFlagKey, FeatureFlagEnvKey> = {
  recruitment: 'NEXT_PUBLIC_FEATURE_RECRUITMENT_ENABLED',
  lms: 'NEXT_PUBLIC_FEATURE_LMS_ENABLED',
  reimbursement: 'NEXT_PUBLIC_FEATURE_REIMBURSEMENT_ENABLED',
  businessTravel: 'NEXT_PUBLIC_FEATURE_BUSINESS_TRAVEL_ENABLED',
  survey: 'NEXT_PUBLIC_FEATURE_SURVEY_ENABLED',
  asset: 'NEXT_PUBLIC_FEATURE_ASSET_ENABLED',
  documents: 'NEXT_PUBLIC_FEATURE_DOCUMENTS_ENABLED',
  announcements: 'NEXT_PUBLIC_FEATURE_ANNOUNCEMENTS_ENABLED',
  overtime: 'NEXT_PUBLIC_FEATURE_OVERTIME_ENABLED',
  attendance: 'NEXT_PUBLIC_FEATURE_ATTENDANCE_ENABLED',
  leave: 'NEXT_PUBLIC_FEATURE_LEAVE_ENABLED',
  kpi: 'NEXT_PUBLIC_FEATURE_KPI_ENABLED',
  payroll: 'NEXT_PUBLIC_FEATURE_PAYROLL_ENABLED',
  reports: 'NEXT_PUBLIC_FEATURE_REPORTS_ENABLED',
  pwa: 'NEXT_PUBLIC_FEATURE_PWA_ENABLED',
  notifications: 'NEXT_PUBLIC_FEATURE_NOTIFICATIONS_ENABLED',
};

const featureFlagDefaults: Record<FeatureFlagKey, boolean> = {
  recruitment: false,
  lms: false,
  reimbursement: false,
  businessTravel: false,
  survey: false,
  asset: false,
  documents: false,
  announcements: false,
  overtime: false,
  attendance: true,
  leave: true,
  kpi: true,
  payroll: true,
  reports: true,
  pwa: true,
  notifications: true,
};

function parseBooleanFlag(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return fallback;
}

export function getFeatureFlagDefaults(): Record<FeatureFlagKey, boolean> {
  return { ...featureFlagDefaults };
}

export function isFeatureEnabled(key: FeatureFlagKey): boolean {
  const privateValue = process.env[featureFlagEnvNames[key]];
  const publicValue = process.env[publicFeatureFlagEnvNames[key]];
  return parseBooleanFlag(publicValue ?? privateValue, featureFlagDefaults[key]);
}
