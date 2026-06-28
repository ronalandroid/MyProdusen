-- THR (Tunjangan Hari Raya) — mandatory religious-holiday allowance.
-- One row per employee per year; money columns are exact numeric(15,2).
CREATE TABLE IF NOT EXISTS "ThrPayment" (
  "id" text PRIMARY KEY NOT NULL,
  "employeeId" text NOT NULL,
  "year" integer NOT NULL,
  "religiousHoliday" text NOT NULL,
  "baseSalary" numeric(15,2) NOT NULL,
  "monthsOfService" integer NOT NULL,
  "amount" numeric(15,2) NOT NULL,
  "status" text DEFAULT 'CALCULATED' NOT NULL,
  "calculatedBy" text,
  "paidAt" timestamp,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "ThrPayment_employeeId_year_unique" ON "ThrPayment" ("employeeId", "year");
CREATE INDEX IF NOT EXISTS "ThrPayment_year_idx" ON "ThrPayment" ("year");
