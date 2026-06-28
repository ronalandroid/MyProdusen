-- Kasbon — employee cash advance (request -> approve -> repay via payroll).
CREATE TABLE IF NOT EXISTS "CashAdvance" (
  "id" text PRIMARY KEY NOT NULL,
  "employeeId" text NOT NULL,
  "amount" numeric(15,2) NOT NULL,
  "reason" text NOT NULL,
  "installments" integer DEFAULT 1 NOT NULL,
  "monthlyDeduction" numeric(15,2) DEFAULT 0 NOT NULL,
  "remainingBalance" numeric(15,2) DEFAULT 0 NOT NULL,
  "status" text DEFAULT 'PENDING' NOT NULL,
  "requestedBy" text,
  "reviewedBy" text,
  "reviewedAt" timestamp,
  "rejectionReason" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "CashAdvance_employeeId_idx" ON "CashAdvance" ("employeeId");
CREATE INDEX IF NOT EXISTS "CashAdvance_status_idx" ON "CashAdvance" ("status");
