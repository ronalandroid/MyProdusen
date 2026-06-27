-- 0036_payroll_money_numeric
--
-- Convert IDR money columns from `real` (float32, ~7 significant digits) to
-- `numeric(15,2)` for exact storage. float32 cannot represent integer rupiah
-- amounts above ~16,777,216 (2^24) exactly, so salaries/totals in that range
-- silently round — a real payroll-correctness bug. numeric stores exactly and
-- SUM()s exactly. Drizzle reads these back as `number` (mode: 'number'); values
-- stay well within JS safe-integer range, so application code is unchanged.
--
-- NOT converted (intentionally): leave-day ledger amounts, KPI scores/weights,
-- coordinates/distances, hours, multipliers, pay factors, liveness scores,
-- performance scores — none are currency.
--
-- ⚠️ Each ALTER COLUMN ... TYPE rewrites the table under an ACCESS EXCLUSIVE
-- lock. Run during a maintenance window. Existing float values are rounded to
-- 2 decimals on conversion (they cannot regain precision already lost to
-- float32; this only makes future storage exact).

ALTER TABLE "PayrollStructure"
  ALTER COLUMN "baseSalary" TYPE numeric(15, 2) USING "baseSalary"::numeric(15, 2);

ALTER TABLE "PayrollComponent"
  ALTER COLUMN "amount" TYPE numeric(15, 2) USING "amount"::numeric(15, 2);

ALTER TABLE "EmployeePayroll"
  ALTER COLUMN "baseSalary" TYPE numeric(15, 2) USING "baseSalary"::numeric(15, 2),
  ALTER COLUMN "customAmount" TYPE numeric(15, 2) USING "customAmount"::numeric(15, 2);

ALTER TABLE "PayrollRun"
  ALTER COLUMN "totalGrossPay" TYPE numeric(15, 2) USING "totalGrossPay"::numeric(15, 2),
  ALTER COLUMN "totalDeductions" TYPE numeric(15, 2) USING "totalDeductions"::numeric(15, 2),
  ALTER COLUMN "totalNetPay" TYPE numeric(15, 2) USING "totalNetPay"::numeric(15, 2);

ALTER TABLE "PayrollItem"
  ALTER COLUMN "baseSalary" TYPE numeric(15, 2) USING "baseSalary"::numeric(15, 2),
  ALTER COLUMN "totalAllowances" TYPE numeric(15, 2) USING "totalAllowances"::numeric(15, 2),
  ALTER COLUMN "totalDeductions" TYPE numeric(15, 2) USING "totalDeductions"::numeric(15, 2),
  ALTER COLUMN "overtimePay" TYPE numeric(15, 2) USING "overtimePay"::numeric(15, 2),
  ALTER COLUMN "attendanceDeduction" TYPE numeric(15, 2) USING "attendanceDeduction"::numeric(15, 2),
  ALTER COLUMN "taxAmount" TYPE numeric(15, 2) USING "taxAmount"::numeric(15, 2),
  ALTER COLUMN "bpjsKesehatanEmployee" TYPE numeric(15, 2) USING "bpjsKesehatanEmployee"::numeric(15, 2),
  ALTER COLUMN "bpjsKesehatanCompany" TYPE numeric(15, 2) USING "bpjsKesehatanCompany"::numeric(15, 2),
  ALTER COLUMN "bpjsKetenagakerjaanEmployee" TYPE numeric(15, 2) USING "bpjsKetenagakerjaanEmployee"::numeric(15, 2),
  ALTER COLUMN "bpjsKetenagakerjaanCompany" TYPE numeric(15, 2) USING "bpjsKetenagakerjaanCompany"::numeric(15, 2),
  ALTER COLUMN "grossPay" TYPE numeric(15, 2) USING "grossPay"::numeric(15, 2),
  ALTER COLUMN "netPay" TYPE numeric(15, 2) USING "netPay"::numeric(15, 2),
  ALTER COLUMN "bonusPay" TYPE numeric(15, 2) USING "bonusPay"::numeric(15, 2);

ALTER TABLE "OvertimeRequest"
  ALTER COLUMN "calculatedPay" TYPE numeric(15, 2) USING "calculatedPay"::numeric(15, 2);

ALTER TABLE "ExpenseCategory"
  ALTER COLUMN "maxAmount" TYPE numeric(15, 2) USING "maxAmount"::numeric(15, 2);

ALTER TABLE "ExpenseClaim"
  ALTER COLUMN "totalAmount" TYPE numeric(15, 2) USING "totalAmount"::numeric(15, 2);

ALTER TABLE "ExpenseItem"
  ALTER COLUMN "amount" TYPE numeric(15, 2) USING "amount"::numeric(15, 2);

ALTER TABLE "PayrollRule"
  ALTER COLUMN "baseSalary" TYPE numeric(15, 2) USING "baseSalary"::numeric(15, 2),
  ALTER COLUMN "baseAmount" TYPE numeric(15, 2) USING "baseAmount"::numeric(15, 2),
  ALTER COLUMN "trainingAmount" TYPE numeric(15, 2) USING "trainingAmount"::numeric(15, 2),
  ALTER COLUMN "fullAmount" TYPE numeric(15, 2) USING "fullAmount"::numeric(15, 2),
  ALTER COLUMN "bonusAmountPerUnit" TYPE numeric(15, 2) USING "bonusAmountPerUnit"::numeric(15, 2);

ALTER TABLE "AttendancePolicy"
  ALTER COLUMN "lateTier1Deduction" TYPE numeric(15, 2) USING "lateTier1Deduction"::numeric(15, 2),
  ALTER COLUMN "lateTier2Deduction" TYPE numeric(15, 2) USING "lateTier2Deduction"::numeric(15, 2);

ALTER TABLE "AttendanceDailySummary"
  ALTER COLUMN "lateDeduction" TYPE numeric(15, 2) USING "lateDeduction"::numeric(15, 2);

ALTER TABLE "PayrollCalculationHistory"
  ALTER COLUMN "amount" TYPE numeric(15, 2) USING "amount"::numeric(15, 2);
