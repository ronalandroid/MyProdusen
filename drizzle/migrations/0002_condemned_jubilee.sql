CREATE TYPE "public"."ExpenseStatus" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'PAID');--> statement-breakpoint
CREATE TYPE "public"."OvertimeStatus" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."PayrollComponentType" AS ENUM('ALLOWANCE', 'DEDUCTION', 'BENEFIT');--> statement-breakpoint
CREATE TYPE "public"."PayrollRunStatus" AS ENUM('DRAFT', 'CALCULATED', 'APPROVED', 'PAID');--> statement-breakpoint
CREATE TABLE "EmployeePayroll" (
	"id" text PRIMARY KEY NOT NULL,
	"employeeId" text NOT NULL,
	"structureId" text NOT NULL,
	"baseSalary" real NOT NULL,
	"effectiveDate" timestamp NOT NULL,
	"endDate" timestamp,
	"bankName" text,
	"bankAccountNumber" text,
	"bankAccountName" text,
	"taxId" text,
	"bpjsKesehatanNumber" text,
	"bpjsKetenagakerjaanNumber" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ExpenseCategory" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"maxAmount" real,
	"requiresReceipt" boolean DEFAULT true NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ExpenseClaim" (
	"id" text PRIMARY KEY NOT NULL,
	"employeeId" text NOT NULL,
	"claimNumber" text NOT NULL,
	"claimDate" timestamp NOT NULL,
	"totalAmount" real NOT NULL,
	"status" "ExpenseStatus" DEFAULT 'PENDING' NOT NULL,
	"description" text,
	"approvedBy" text,
	"approvedAt" timestamp,
	"rejectedReason" text,
	"isPaid" boolean DEFAULT false NOT NULL,
	"paidAt" timestamp,
	"paidInPayrollRunId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ExpenseClaim_claimNumber_unique" UNIQUE("claimNumber")
);
--> statement-breakpoint
CREATE TABLE "ExpenseItem" (
	"id" text PRIMARY KEY NOT NULL,
	"claimId" text NOT NULL,
	"categoryId" text NOT NULL,
	"description" text NOT NULL,
	"amount" real NOT NULL,
	"expenseDate" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ExpenseReceipt" (
	"id" text PRIMARY KEY NOT NULL,
	"itemId" text NOT NULL,
	"fileUrl" text NOT NULL,
	"fileName" text NOT NULL,
	"fileSize" integer NOT NULL,
	"mimeType" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "OvertimeRate" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"multiplier" real NOT NULL,
	"description" text,
	"isWeekday" boolean DEFAULT true NOT NULL,
	"isWeekend" boolean DEFAULT false NOT NULL,
	"isHoliday" boolean DEFAULT false NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "OvertimeRequest" (
	"id" text PRIMARY KEY NOT NULL,
	"employeeId" text NOT NULL,
	"overtimeDate" timestamp NOT NULL,
	"startTime" text NOT NULL,
	"endTime" text NOT NULL,
	"durationHours" real NOT NULL,
	"rateId" text NOT NULL,
	"reason" text NOT NULL,
	"status" "OvertimeStatus" DEFAULT 'PENDING' NOT NULL,
	"approvedBy" text,
	"approvedAt" timestamp,
	"rejectedReason" text,
	"calculatedPay" real DEFAULT 0 NOT NULL,
	"isPaid" boolean DEFAULT false NOT NULL,
	"paidInPayrollRunId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PayrollComponent" (
	"id" text PRIMARY KEY NOT NULL,
	"structureId" text NOT NULL,
	"name" text NOT NULL,
	"type" "PayrollComponentType" NOT NULL,
	"amount" real NOT NULL,
	"isPercentage" boolean DEFAULT false NOT NULL,
	"isTaxable" boolean DEFAULT true NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PayrollItem" (
	"id" text PRIMARY KEY NOT NULL,
	"runId" text NOT NULL,
	"employeeId" text NOT NULL,
	"baseSalary" real NOT NULL,
	"totalAllowances" real DEFAULT 0 NOT NULL,
	"totalDeductions" real DEFAULT 0 NOT NULL,
	"overtimePay" real DEFAULT 0 NOT NULL,
	"attendanceDeduction" real DEFAULT 0 NOT NULL,
	"taxAmount" real DEFAULT 0 NOT NULL,
	"bpjsKesehatanEmployee" real DEFAULT 0 NOT NULL,
	"bpjsKesehatanCompany" real DEFAULT 0 NOT NULL,
	"bpjsKetenagakerjaanEmployee" real DEFAULT 0 NOT NULL,
	"bpjsKetenagakerjaanCompany" real DEFAULT 0 NOT NULL,
	"grossPay" real NOT NULL,
	"netPay" real NOT NULL,
	"workDays" integer DEFAULT 0 NOT NULL,
	"absentDays" integer DEFAULT 0 NOT NULL,
	"lateDays" integer DEFAULT 0 NOT NULL,
	"overtimeHours" real DEFAULT 0 NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PayrollRun" (
	"id" text PRIMARY KEY NOT NULL,
	"period" text NOT NULL,
	"periodStart" timestamp NOT NULL,
	"periodEnd" timestamp NOT NULL,
	"status" "PayrollRunStatus" DEFAULT 'DRAFT' NOT NULL,
	"totalEmployees" integer DEFAULT 0 NOT NULL,
	"totalGrossPay" real DEFAULT 0 NOT NULL,
	"totalDeductions" real DEFAULT 0 NOT NULL,
	"totalNetPay" real DEFAULT 0 NOT NULL,
	"calculatedBy" text,
	"calculatedAt" timestamp,
	"approvedBy" text,
	"approvedAt" timestamp,
	"paidAt" timestamp,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PayrollStructure" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"baseSalary" real NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Payslip" (
	"id" text PRIMARY KEY NOT NULL,
	"itemId" text NOT NULL,
	"employeeId" text NOT NULL,
	"period" text NOT NULL,
	"fileUrl" text,
	"isDownloaded" boolean DEFAULT false NOT NULL,
	"downloadedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Payslip_itemId_unique" UNIQUE("itemId")
);
--> statement-breakpoint
CREATE INDEX "EmployeePayroll_employeeId_idx" ON "EmployeePayroll" USING btree ("employeeId");--> statement-breakpoint
CREATE UNIQUE INDEX "EmployeePayroll_employeeId_active_key" ON "EmployeePayroll" USING btree ("employeeId") WHERE "EmployeePayroll"."endDate" IS NULL;--> statement-breakpoint
CREATE INDEX "ExpenseClaim_employeeId_idx" ON "ExpenseClaim" USING btree ("employeeId");--> statement-breakpoint
CREATE INDEX "ExpenseClaim_status_idx" ON "ExpenseClaim" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ExpenseClaim_claimDate_idx" ON "ExpenseClaim" USING btree ("claimDate");--> statement-breakpoint
CREATE INDEX "ExpenseItem_claimId_idx" ON "ExpenseItem" USING btree ("claimId");--> statement-breakpoint
CREATE INDEX "ExpenseReceipt_itemId_idx" ON "ExpenseReceipt" USING btree ("itemId");--> statement-breakpoint
CREATE INDEX "OvertimeRequest_employeeId_idx" ON "OvertimeRequest" USING btree ("employeeId");--> statement-breakpoint
CREATE INDEX "OvertimeRequest_status_idx" ON "OvertimeRequest" USING btree ("status");--> statement-breakpoint
CREATE INDEX "OvertimeRequest_overtimeDate_idx" ON "OvertimeRequest" USING btree ("overtimeDate");--> statement-breakpoint
CREATE INDEX "PayrollComponent_structureId_idx" ON "PayrollComponent" USING btree ("structureId");--> statement-breakpoint
CREATE INDEX "PayrollItem_runId_idx" ON "PayrollItem" USING btree ("runId");--> statement-breakpoint
CREATE INDEX "PayrollItem_employeeId_idx" ON "PayrollItem" USING btree ("employeeId");--> statement-breakpoint
CREATE UNIQUE INDEX "PayrollItem_runId_employeeId_key" ON "PayrollItem" USING btree ("runId","employeeId");--> statement-breakpoint
CREATE INDEX "PayrollRun_period_idx" ON "PayrollRun" USING btree ("period");--> statement-breakpoint
CREATE INDEX "PayrollRun_status_idx" ON "PayrollRun" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "PayrollRun_period_key" ON "PayrollRun" USING btree ("period");--> statement-breakpoint
CREATE INDEX "Payslip_employeeId_idx" ON "Payslip" USING btree ("employeeId");--> statement-breakpoint
CREATE INDEX "Payslip_period_idx" ON "Payslip" USING btree ("period");