-- Additive and Idempotent SQL Migration: 0023_kpi_targets_payroll_rules.sql

CREATE TABLE IF NOT EXISTS "KpiMetric" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"unit" text DEFAULT 'pcs' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "KpiMetric_name_unique" UNIQUE("name")
);

CREATE TABLE IF NOT EXISTS "KpiTarget" (
	"id" text PRIMARY KEY NOT NULL,
	"metricId" text NOT NULL,
	"scopeType" text NOT NULL, -- COMPANY / TEAM / POSITION / EMPLOYEE
	"scopeId" text,
	"periodType" text NOT NULL, -- DAILY / WEEKLY / MONTHLY
	"targetQuantity" real NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"effectiveFrom" timestamp,
	"effectiveTo" timestamp,
	"createdBy" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "PayrollRule" (
	"id" text PRIMARY KEY NOT NULL,
	"employeeId" text,
	"teamId" text,
	"periodType" text NOT NULL, -- WEEKLY / MONTHLY
	"baseSalary" real NOT NULL,
	"targetMetricId" text,
	"targetQuantity" real,
	"bonusType" text DEFAULT 'PER_EXTRA_UNIT' NOT NULL, -- PER_EXTRA_UNIT / FIXED / PERCENTAGE
	"bonusAmountPerUnit" real,
	"active" boolean DEFAULT true NOT NULL,
	"effectiveFrom" timestamp,
	"effectiveTo" timestamp,
	"createdBy" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

-- Safe Column Addition
ALTER TABLE "PayrollItem" ADD COLUMN IF NOT EXISTS "bonusPay" real DEFAULT 0 NOT NULL;

-- Safe Indexes
CREATE INDEX IF NOT EXISTS "KpiMetric_active_idx" ON "KpiMetric" ("active");
CREATE INDEX IF NOT EXISTS "KpiTarget_active_idx" ON "KpiTarget" ("active");
CREATE INDEX IF NOT EXISTS "KpiTarget_metricId_idx" ON "KpiTarget" ("metricId");
CREATE INDEX IF NOT EXISTS "PayrollRule_active_idx" ON "PayrollRule" ("active");
CREATE INDEX IF NOT EXISTS "PayrollRule_employeeId_idx" ON "PayrollRule" ("employeeId");
CREATE INDEX IF NOT EXISTS "PayrollRule_teamId_idx" ON "PayrollRule" ("teamId");
