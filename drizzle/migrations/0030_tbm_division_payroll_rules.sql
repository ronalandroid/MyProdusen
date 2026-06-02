CREATE TABLE IF NOT EXISTS "Division" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "code" text NOT NULL UNIQUE,
  "description" text,
  "isActive" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "Position" (
  "id" text PRIMARY KEY,
  "divisionId" text REFERENCES "Division"("id"),
  "name" text NOT NULL,
  "code" text UNIQUE,
  "type" text,
  "teamId" text,
  "roleType" text,
  "active" boolean DEFAULT true NOT NULL,
  "isActive" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "Position" ADD COLUMN IF NOT EXISTS "divisionId" text;
ALTER TABLE "Position" ADD COLUMN IF NOT EXISTS "code" text;
ALTER TABLE "Position" ADD COLUMN IF NOT EXISTS "type" text;
ALTER TABLE "Position" ADD COLUMN IF NOT EXISTS "isActive" boolean DEFAULT true NOT NULL;

ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "divisionId" text;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "positionId" text;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "trainingStatus" text DEFAULT 'FULL_TIME' NOT NULL;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "trainingEndDate" timestamp;

ALTER TABLE "PayrollRule" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "PayrollRule" ADD COLUMN IF NOT EXISTS "positionId" text;
ALTER TABLE "PayrollRule" ADD COLUMN IF NOT EXISTS "salaryType" text;
ALTER TABLE "PayrollRule" ADD COLUMN IF NOT EXISTS "baseAmount" real;
ALTER TABLE "PayrollRule" ADD COLUMN IF NOT EXISTS "trainingAmount" real;
ALTER TABLE "PayrollRule" ADD COLUMN IF NOT EXISTS "fullAmount" real;
ALTER TABLE "PayrollRule" ADD COLUMN IF NOT EXISTS "trainingDurationDays" integer;
ALTER TABLE "PayrollRule" ADD COLUMN IF NOT EXISTS "isActive" boolean DEFAULT true NOT NULL;

ALTER TABLE "EmployeePayroll" ADD COLUMN IF NOT EXISTS "payrollRuleId" text;
ALTER TABLE "EmployeePayroll" ADD COLUMN IF NOT EXISTS "trainingStatus" text DEFAULT 'FULL_TIME' NOT NULL;
ALTER TABLE "EmployeePayroll" ADD COLUMN IF NOT EXISTS "trainingEndDate" timestamp;
ALTER TABLE "EmployeePayroll" ADD COLUMN IF NOT EXISTS "customAmount" real;
ALTER TABLE "EmployeePayroll" ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true NOT NULL;

CREATE INDEX IF NOT EXISTS "Division_isActive_idx" ON "Division"("isActive");
CREATE INDEX IF NOT EXISTS "Position_divisionId_idx" ON "Position"("divisionId");
CREATE INDEX IF NOT EXISTS "Position_isActive_idx" ON "Position"("isActive");
CREATE INDEX IF NOT EXISTS "Employee_divisionId_idx" ON "Employee"("divisionId");
CREATE INDEX IF NOT EXISTS "Employee_positionId_idx" ON "Employee"("positionId");
CREATE INDEX IF NOT EXISTS "PayrollRule_positionId_idx" ON "PayrollRule"("positionId");
CREATE INDEX IF NOT EXISTS "PayrollRule_salaryType_idx" ON "PayrollRule"("salaryType");
CREATE INDEX IF NOT EXISTS "PayrollRule_isActive_idx" ON "PayrollRule"("isActive");
CREATE INDEX IF NOT EXISTS "EmployeePayroll_payrollRuleId_idx" ON "EmployeePayroll"("payrollRuleId");
CREATE INDEX IF NOT EXISTS "EmployeePayroll_active_idx" ON "EmployeePayroll"("active");
