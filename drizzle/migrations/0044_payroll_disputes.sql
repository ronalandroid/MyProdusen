CREATE TABLE IF NOT EXISTS "PayrollDispute" (
  "id" text PRIMARY KEY NOT NULL,
  "payrollItemId" text NOT NULL,
  "employeeId" text NOT NULL,
  "period" text NOT NULL,
  "reason" text NOT NULL,
  "status" text DEFAULT 'PENDING' NOT NULL,
  "reviewNote" text,
  "reviewedBy" text,
  "reviewedAt" timestamp,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "PayrollDispute_employeeId_idx" ON "PayrollDispute" ("employeeId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "PayrollDispute_payrollItemId_idx" ON "PayrollDispute" ("payrollItemId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "PayrollDispute_status_idx" ON "PayrollDispute" ("status");
