-- Safe additive migration: Culture & Discipline Score aliases for legacy LeaderScoreEntry.
-- No DROP / DELETE / TRUNCATE / destructive rename.

ALTER TABLE "LeaderScoreEntry"
  ADD COLUMN IF NOT EXISTS "scoreType" text DEFAULT 'CULTURE_DISCIPLINE' NOT NULL,
  ADD COLUMN IF NOT EXISTS "scorerRole" text,
  ADD COLUMN IF NOT EXISTS "subcriteria" jsonb,
  ADD COLUMN IF NOT EXISTS "isFinal" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "reason" text;

CREATE INDEX IF NOT EXISTS "LeaderScoreEntry_scoreType_idx"
  ON "LeaderScoreEntry" ("scoreType");

CREATE INDEX IF NOT EXISTS "LeaderScoreEntry_employee_period_type_idx"
  ON "LeaderScoreEntry" ("employeeId", "periodId", "scoreType");

INSERT INTO "CompanySetting" ("id", "key", "value", "description", "updatedAt") VALUES
  (
    'setting-gamification-weight-culture',
    'GAMIFICATION_WEIGHT_CULTURE',
    '20',
    'Primary alias for Culture & Discipline Score weight. Legacy GAMIFICATION_WEIGHT_LEADER remains supported.',
    now()
  ),
  (
    'setting-gamification-culture-policy',
    'CULTURE_SCORE_SUPERADMIN_PRIORITY',
    'true',
    'If true, Superadmin Culture & Discipline Score is final and Leader score is recommendation.',
    now()
  )
ON CONFLICT ("key") DO NOTHING;
