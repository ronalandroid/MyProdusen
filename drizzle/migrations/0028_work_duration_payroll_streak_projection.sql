-- Additive production-safe fields for work start date metadata.
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "work_start_date" timestamp;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "start_date_set_by" text;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "start_date_set_at" timestamp;
