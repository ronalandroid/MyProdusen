ALTER TABLE "Shift" ADD COLUMN IF NOT EXISTS "lateToleranceMinutes" integer DEFAULT 15 NOT NULL;
ALTER TABLE "Shift" ADD COLUMN IF NOT EXISTS "checkinOpenMinutesBefore" integer DEFAULT 60 NOT NULL;
ALTER TABLE "Shift" ADD COLUMN IF NOT EXISTS "checkoutCloseMinutesAfter" integer DEFAULT 60 NOT NULL;
