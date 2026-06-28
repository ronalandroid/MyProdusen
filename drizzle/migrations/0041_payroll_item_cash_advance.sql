-- Kasbon repayment on payroll items: post-tax net deduction locked at
-- calculation time, settled against the advance when the run is approved.
ALTER TABLE "PayrollItem" ADD COLUMN IF NOT EXISTS "cashAdvanceDeduction" numeric(15,2) DEFAULT 0 NOT NULL;
ALTER TABLE "PayrollItem" ADD COLUMN IF NOT EXISTS "cashAdvanceId" text;
