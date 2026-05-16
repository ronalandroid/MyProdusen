DO $$ BEGIN
  CREATE TYPE "public"."PayrollPeriodStatus" AS ENUM('OPEN', 'PREPARING', 'LOCKED', 'CLOSED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "PayrollPeriod" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "startDate" timestamp NOT NULL,
  "endDate" timestamp NOT NULL,
  "status" "PayrollPeriodStatus" DEFAULT 'OPEN' NOT NULL,
  "lockedBy" text,
  "lockedAt" timestamp,
  "lockedReason" text,
  "createdBy" text NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "PayrollPeriod_status_idx" ON "PayrollPeriod" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "PayrollPeriod_startDate_idx" ON "PayrollPeriod" USING btree ("startDate");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "PayrollPeriod_endDate_idx" ON "PayrollPeriod" USING btree ("endDate");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "PayrollPeriod_createdBy_idx" ON "PayrollPeriod" USING btree ("createdBy");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "PayrollPeriod_date_range_unique" ON "PayrollPeriod" USING btree ("startDate","endDate");
