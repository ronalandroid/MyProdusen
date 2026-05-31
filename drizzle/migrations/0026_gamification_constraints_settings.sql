-- Safe additive gamification hardening migration.
-- No DROP / DELETE / TRUNCATE / reset.

ALTER TABLE "PerformanceScoreSummary"
  ADD COLUMN IF NOT EXISTS "periodId" text;

ALTER TABLE "PerformanceScoreSnapshot"
  ADD COLUMN IF NOT EXISTS "month" text;

ALTER TABLE "LeaderScoreEntry"
  ADD COLUMN IF NOT EXISTS "periodId" text,
  ADD COLUMN IF NOT EXISTS "periodType" text DEFAULT 'MONTHLY' NOT NULL;

ALTER TABLE "CompanyThemeSetting"
  ADD COLUMN IF NOT EXISTS "themeMode" text DEFAULT 'default' NOT NULL;

-- Preflight before applying in production:
--   node scripts/preflight-gamification-0026.mjs
-- If more than one ACTIVE period exists, migration must stop and ops must manually audit/resolve
-- duplicate active periods. This migration never deletes or rewrites production period data.
CREATE UNIQUE INDEX IF NOT EXISTS "PerformancePeriod_one_active_idx"
  ON "PerformancePeriod" ("status")
  WHERE "status" = 'ACTIVE';

CREATE UNIQUE INDEX IF NOT EXISTS "PerformanceScoreSnapshot_employee_period_month_idx"
  ON "PerformanceScoreSnapshot" ("employeeId", "periodId", "month")
  WHERE "periodId" IS NOT NULL AND "month" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "PerformanceScoreSummary_employee_period_idx"
  ON "PerformanceScoreSummary" ("employeeId", "periodId")
  WHERE "periodId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "PerformanceScoreSnapshot_employee_period_idx"
  ON "PerformanceScoreSnapshot" ("employeeId", "periodId");

CREATE INDEX IF NOT EXISTS "PerformanceScoreSnapshot_month_idx"
  ON "PerformanceScoreSnapshot" ("month");

CREATE INDEX IF NOT EXISTS "PerformanceScoreSummary_period_idx"
  ON "PerformanceScoreSummary" ("periodId");

CREATE INDEX IF NOT EXISTS "LeaderScoreEntry_period_idx"
  ON "LeaderScoreEntry" ("periodId");

CREATE INDEX IF NOT EXISTS "LeaderScoreAnomaly_status_created_idx"
  ON "LeaderScoreAnomaly" ("status", "createdAt");

CREATE INDEX IF NOT EXISTS "EmployeeBadge_badge_idx"
  ON "EmployeeBadge" ("badgeDefinitionId");

INSERT INTO "CompanySetting" ("id", "key", "value", "description", "updatedAt") VALUES
  (
    'setting-gamification-config',
    'GAMIFICATION_CONFIG',
    '{"weights":{"attendance":30,"kpi":50,"leader":20},"retroactiveLeaderScoreDays":7,"leaderScorePeriodType":"MONTHLY","raiseTiers":[{"name":"Platinum","minScore":100,"requiredDays":365,"raisePercent":10},{"name":"Gold","minScore":85,"requiredDays":365,"raisePercent":7},{"name":"Silver","minScore":75,"requiredDays":365,"raisePercent":5},{"name":"Bronze","minScore":65,"requiredDays":365,"raisePercent":3},{"name":"Standard","minScore":0,"requiredDays":0,"raisePercent":0}]}',
    'Konfigurasi resmi gamification dan performance score MyProdusen.',
    now()
  ),
  (
    'setting-gamification-badges',
    'GAMIFICATION_BADGE_CONFIG',
    '{"badges":["STREAK_7_DAYS","STREAK_30_DAYS","KPI_PERFECT_MONTH","ZERO_ALPHA_QUARTER","TOP_PERFORMER","CONSISTENT_GOLD"]}',
    'Konfigurasi badge performance MyProdusen.',
    now()
  )
ON CONFLICT ("key") DO NOTHING;
