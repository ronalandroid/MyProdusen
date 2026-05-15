CREATE TYPE "public"."LeaveBalanceTransactionType" AS ENUM('ENTITLEMENT', 'CARRY_FORWARD', 'REQUEST_HOLD', 'REQUEST_APPROVED', 'REQUEST_REJECTED_RELEASE', 'MANUAL_ADJUSTMENT', 'EXPIRY');--> statement-breakpoint
CREATE TABLE "LeaveBalanceLedger" (
  "id" text PRIMARY KEY NOT NULL,
  "employeeId" text NOT NULL,
  "leaveRequestId" text,
  "transactionType" "LeaveBalanceTransactionType" NOT NULL,
  "amount" real NOT NULL,
  "balanceYear" integer NOT NULL,
  "reason" text NOT NULL,
  "createdBy" text,
  "createdAt" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX "LeaveBalanceLedger_employeeId_idx" ON "LeaveBalanceLedger" USING btree ("employeeId");--> statement-breakpoint
CREATE INDEX "LeaveBalanceLedger_leaveRequestId_idx" ON "LeaveBalanceLedger" USING btree ("leaveRequestId");--> statement-breakpoint
CREATE INDEX "LeaveBalanceLedger_balanceYear_idx" ON "LeaveBalanceLedger" USING btree ("balanceYear");
