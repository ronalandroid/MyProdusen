CREATE TABLE IF NOT EXISTS "PerformancePeriod" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "startDate" date NOT NULL,
  "endDate" date NOT NULL,
  "status" text DEFAULT 'OPEN' NOT NULL,
  "createdBy" text,
  "closedBy" text,
  "closedAt" timestamp,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "PerformancePeriod_status_idx" ON "PerformancePeriod" ("status");
CREATE INDEX IF NOT EXISTS "PerformancePeriod_date_idx" ON "PerformancePeriod" ("startDate", "endDate");

CREATE TABLE IF NOT EXISTS "PerformanceScoreSnapshot" (
  "id" text PRIMARY KEY NOT NULL,
  "employeeId" text NOT NULL,
  "periodId" text,
  "scoreDate" date NOT NULL,
  "attendanceScore" real DEFAULT 100 NOT NULL,
  "kpiScore" real DEFAULT 100 NOT NULL,
  "leaderScore" real DEFAULT 100 NOT NULL,
  "totalScore" real DEFAULT 100 NOT NULL,
  "tier" text DEFAULT 'Platinum' NOT NULL,
  "explanation" text NOT NULL,
  "sourceBreakdown" jsonb,
  "createdAt" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "PerformanceScoreSnapshot_employee_date_idx" ON "PerformanceScoreSnapshot" ("employeeId", "scoreDate");
CREATE INDEX IF NOT EXISTS "PerformanceScoreSnapshot_period_idx" ON "PerformanceScoreSnapshot" ("periodId");
CREATE INDEX IF NOT EXISTS "PerformanceScoreSnapshot_totalScore_idx" ON "PerformanceScoreSnapshot" ("totalScore");

CREATE TABLE IF NOT EXISTS "PerformanceScoreSummary" (
  "id" text PRIMARY KEY NOT NULL,
  "employeeId" text NOT NULL UNIQUE,
  "currentScore" real DEFAULT 100 NOT NULL,
  "attendanceScore" real DEFAULT 100 NOT NULL,
  "kpiScore" real DEFAULT 100 NOT NULL,
  "leaderScore" real DEFAULT 100 NOT NULL,
  "tier" text DEFAULT 'Platinum' NOT NULL,
  "maintainedPerfectDays" integer DEFAULT 0 NOT NULL,
  "projectedRaisePercent" real DEFAULT 0 NOT NULL,
  "lastCalculatedAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "PerformanceScoreSummary_employee_idx" ON "PerformanceScoreSummary" ("employeeId");
CREATE INDEX IF NOT EXISTS "PerformanceScoreSummary_score_idx" ON "PerformanceScoreSummary" ("currentScore");
CREATE INDEX IF NOT EXISTS "PerformanceScoreSummary_tier_idx" ON "PerformanceScoreSummary" ("tier");

CREATE TABLE IF NOT EXISTS "LeaderScoreEntry" (
  "id" text PRIMARY KEY NOT NULL,
  "employeeId" text NOT NULL,
  "leaderEmployeeId" text NOT NULL,
  "score" integer NOT NULL,
  "notes" text NOT NULL,
  "scoreDate" date NOT NULL,
  "createdBy" text NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "LeaderScoreEntry_employee_date_idx" ON "LeaderScoreEntry" ("employeeId", "scoreDate");
CREATE INDEX IF NOT EXISTS "LeaderScoreEntry_leader_idx" ON "LeaderScoreEntry" ("leaderEmployeeId");

CREATE TABLE IF NOT EXISTS "LeaderScoreAnomaly" (
  "id" text PRIMARY KEY NOT NULL,
  "leaderScoreEntryId" text NOT NULL,
  "employeeId" text NOT NULL,
  "type" text NOT NULL,
  "status" text DEFAULT 'PENDING' NOT NULL,
  "reviewedBy" text,
  "reviewNote" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "reviewedAt" timestamp
);
CREATE INDEX IF NOT EXISTS "LeaderScoreAnomaly_status_idx" ON "LeaderScoreAnomaly" ("status");
CREATE INDEX IF NOT EXISTS "LeaderScoreAnomaly_employee_idx" ON "LeaderScoreAnomaly" ("employeeId");

CREATE TABLE IF NOT EXISTS "BadgeDefinition" (
  "id" text PRIMARY KEY NOT NULL,
  "code" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "description" text,
  "isActive" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "BadgeDefinition_code_idx" ON "BadgeDefinition" ("code");

CREATE TABLE IF NOT EXISTS "EmployeeBadge" (
  "id" text PRIMARY KEY NOT NULL,
  "employeeId" text NOT NULL,
  "badgeDefinitionId" text NOT NULL,
  "awardedAt" timestamp DEFAULT now() NOT NULL,
  "sourceSnapshotId" text
);
CREATE UNIQUE INDEX IF NOT EXISTS "EmployeeBadge_employee_badge_idx" ON "EmployeeBadge" ("employeeId", "badgeDefinitionId");
CREATE INDEX IF NOT EXISTS "EmployeeBadge_employee_idx" ON "EmployeeBadge" ("employeeId");

CREATE TABLE IF NOT EXISTS "CompanyThemeSetting" (
  "id" text PRIMARY KEY NOT NULL,
  "primaryColor" text DEFAULT '#f6c343' NOT NULL,
  "secondaryColor" text DEFAULT '#111827' NOT NULL,
  "accentColor" text DEFAULT '#dc2626' NOT NULL,
  "safeTokens" jsonb,
  "updatedBy" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ThemeChangeAudit" (
  "id" text PRIMARY KEY NOT NULL,
  "themeSettingId" text NOT NULL,
  "changedBy" text NOT NULL,
  "oldValue" jsonb,
  "newValue" jsonb,
  "reason" text NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "ThemeChangeAudit_theme_idx" ON "ThemeChangeAudit" ("themeSettingId");
CREATE INDEX IF NOT EXISTS "ThemeChangeAudit_changedBy_idx" ON "ThemeChangeAudit" ("changedBy");

INSERT INTO "BadgeDefinition" ("id", "code", "name", "description") VALUES
  ('badge-streak-7', 'STREAK_7_DAYS', 'Streak 7 Hari', 'Hadir konsisten selama 7 hari.'),
  ('badge-streak-30', 'STREAK_30_DAYS', 'Streak 30 Hari', 'Hadir konsisten selama 30 hari.'),
  ('badge-kpi-perfect-month', 'KPI_PERFECT_MONTH', 'KPI Perfect Month', 'Mencapai KPI sempurna dalam satu bulan.'),
  ('badge-zero-alpha-quarter', 'ZERO_ALPHA_QUARTER', 'Zero Alpha Quarter', 'Tanpa alpha dalam satu kuartal.'),
  ('badge-top-performer', 'TOP_PERFORMER', 'Top Performer', 'Masuk jajaran performa terbaik.'),
  ('badge-consistent-gold', 'CONSISTENT_GOLD', 'Consistent Gold', 'Mempertahankan tier Gold secara konsisten.')
ON CONFLICT ("code") DO NOTHING;
