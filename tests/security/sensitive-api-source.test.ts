import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';

const pdfRoute = readFileSync('app/api/reports/pdf/route.ts', 'utf8');
const payrollMeRoute = readFileSync('app/api/payroll/me/route.ts', 'utf8');
const payslipRoute = readFileSync('app/api/payroll/payslips/[itemId]/route.ts', 'utf8');
const payrollExportRoute = readFileSync('app/api/payroll/runs/[id]/export/route.ts', 'utf8');
const payrollService = readFileSync('src/services/payroll/payroll.service.ts', 'utf8');
const dashboardLayout = readFileSync('app/dashboard/layout.tsx', 'utf8');

describe('sensitive API source hardening', () => {
  it('PDF report route enforces Superadmin, no-store, validation, and audit', () => {
    expect(pdfRoute).toContain('assertPdfReportAccess(user.role)');
    expect(pdfRoute).toContain('pdfReportSchema.safeParse');
    expect(pdfRoute).toContain("'Cache-Control': 'no-store, no-cache, must-revalidate, private'");
    expect(pdfRoute).toContain("'DOWNLOAD_PDF'");
  });

  it('dashboard layout enforces role policy for sensitive pages', () => {
    expect(dashboardLayout).toContain('canAccessNavigationPath');
    expect(dashboardLayout).toContain('router.replace("/dashboard")');
  });

  it('payroll employee and payslip routes enforce ownership and audit downloads', () => {
    expect(payrollMeRoute).toContain("assertPayrollAccess(user.role, 'readOwn')");
    expect(payslipRoute).toContain('user.userId !== data.employee.userId');
    expect(payslipRoute).toContain("'DOWNLOAD'");
    expect(payrollExportRoute).toContain("'EXPORT'");
  });

  it('paid or approved payroll records cannot be edited directly', () => {
    expect(payrollService).toContain('assertStructureEditable');
    expect(payrollService).toContain('assertNoFinalPayrollForEmployee');
    expect(payrollService).toContain("IN ('APPROVED', 'PAID')");
  });
});
