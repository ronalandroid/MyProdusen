-- Payroll integrity guard: every monetary amount and day/hour count on a
-- payroll item must be non-negative. Catches calculation bugs that would
-- otherwise silently corrupt pay.
--
-- netPay is deliberately EXCLUDED — a legitimate net can be negative in a
-- clawback / overpayment-recovery scenario. NOT VALID so it can never fail on
-- pre-existing rows on deploy; enforced for every new/updated row. Idempotent.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payroll_item_non_negative_amounts'
  ) THEN
    ALTER TABLE "PayrollItem"
      ADD CONSTRAINT "payroll_item_non_negative_amounts"
      CHECK (
        "grossPay" >= 0 AND "baseSalary" >= 0 AND "totalAllowances" >= 0 AND
        "totalDeductions" >= 0 AND "overtimePay" >= 0 AND "attendanceDeduction" >= 0 AND
        "taxAmount" >= 0 AND "bpjsKesehatanEmployee" >= 0 AND "bpjsKesehatanCompany" >= 0 AND
        "bpjsKetenagakerjaanEmployee" >= 0 AND "bpjsKetenagakerjaanCompany" >= 0 AND
        "bonusPay" >= 0 AND "workDays" >= 0 AND "absentDays" >= 0 AND "lateDays" >= 0 AND
        "overtimeHours" >= 0
      ) NOT VALID;
  END IF;
END $$;
