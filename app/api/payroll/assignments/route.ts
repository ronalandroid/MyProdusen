import { NextRequest } from 'next/server';
import { z } from 'zod';
import { payrollService } from '@/src/services/payroll/payroll.service';
import { requireAuth, getRequestBody } from '@/lib/middleware';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';
import { assertPayrollAccess, payrollAccessErrorMessage } from '@/lib/payroll/access';
import { logAudit } from '@/lib/audit';

const assignmentSchema = z.object({
  employeeId: z.string().min(1),
  structureId: z.string().min(1),
  baseSalary: z.number().min(0),
  effectiveDate: z.string().transform((value) => new Date(value)),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
  taxId: z.string().optional(),
  bpjsKesehatanNumber: z.string().optional(),
  bpjsKetenagakerjaanNumber: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    assertPayrollAccess(user.role, 'read');
    const employeeId = new URL(request.url).searchParams.get('employeeId');
    if (!employeeId) return validationErrorResponse('employeeId wajib diisi');
    const assignment = await payrollService.getEmployeePayroll(employeeId);
    return successResponse(assignment);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    const accessMessage = payrollAccessErrorMessage(error);
    if (accessMessage) return forbiddenResponse(accessMessage);
    return errorResponse(error.message || 'Gagal mengambil assignment payroll', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    assertPayrollAccess(user.role, 'mutate');
    const body = await getRequestBody(request);
    const validation = assignmentSchema.safeParse(body);
    if (!validation.success) return validationErrorResponse(validation.error.errors[0].message);
    const oldAssignment = await payrollService.getEmployeePayroll(validation.data.employeeId);
    const assignment = await payrollService.assignPayrollToEmployee(validation.data);
    await logAudit(user.userId, 'ASSIGN', 'EmployeePayroll', assignment.id, oldAssignment, assignment, request);
    return successResponse(assignment, 'Payroll karyawan berhasil diassign', 201);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    const accessMessage = payrollAccessErrorMessage(error);
    if (accessMessage) return forbiddenResponse(accessMessage);
    return errorResponse(error.message || 'Gagal assign payroll karyawan', 500);
  }
}
