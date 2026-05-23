ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "profileCompletedAt" timestamp;
CREATE INDEX IF NOT EXISTS "Employee_profileCompletedAt_idx" ON "Employee" ("profileCompletedAt");
