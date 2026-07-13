-- Self-service onboarding verification columns (additive only).
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" timestamp;--> statement-breakpoint
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "verifiedAt" timestamp;--> statement-breakpoint
-- Existing employees were all created/vetted by admins before self-service
-- registration existed; grandfather them in as verified.
UPDATE "Employee" SET "verifiedAt" = now() WHERE "verifiedAt" IS NULL;
