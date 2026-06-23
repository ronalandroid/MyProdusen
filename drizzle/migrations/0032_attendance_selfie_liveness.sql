-- Persist real selfie liveness signals on the daily attendance summary so the
-- admin review grid can surface low-confidence / flagged check-ins.
-- Additive + idempotent: safe to run against existing data (existing rows get
-- NULL score and selfieNeedsReview = false).
ALTER TABLE "AttendanceDailySummary"
  ADD COLUMN IF NOT EXISTS "selfieLivenessScore" real;

ALTER TABLE "AttendanceDailySummary"
  ADD COLUMN IF NOT EXISTS "selfieNeedsReview" boolean NOT NULL DEFAULT false;

-- Index so the admin grid can filter "needs review" check-ins efficiently.
CREATE INDEX IF NOT EXISTS "AttendanceDailySummary_selfieNeedsReview_idx"
  ON "AttendanceDailySummary" ("selfieNeedsReview");
