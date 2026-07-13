import { NextRequest } from 'next/server';
import { z } from 'zod';
import { payrollDisputeService } from '@/services/payroll/payroll-dispute.service';
import { employeeService } from '@/services/employees/employee.service';
import { getRequestBody, requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';
import { logAudit } from '@/lib/audit';
import { handleApiError } from '@/lib/core/route-handler';
import { isValidEnumParam } from '@/lib/core/query-validation';

const DISPUTE_STATUSES = ['PENDING', 'RESOLVED', 'REJECTED'] as const;

const createDisputeSchema = z.object({
  payrollItemId: z.string().min(1),
  reason: z.string().min(10, 'Alasan aduan minimal 10 karakter'),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    if (!isValidEnumParam(status, DISPUTE_STATUSES)) {
      return validationErrorResponse('Status aduan tidak valid.');
    }

    const employee = await employeeService.getEmployeeByUserId(user.userId).catch(() => null);
    if (!employee && user.role !== 'SUPERADMIN') {
      return errorResponse('Profil karyawan tidak ditemukan', 404);
    }

    const rows = await payrollDisputeService.listDisputes({
      status: (status || undefined) as (typeof DISPUTE_STATUSES)[number] | undefined,
      viewerRole: user.role,
      viewerEmployeeId: employee?.id,
    });

    return successResponse(rows);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'EMPLOYEE' && user.role !== 'LEADER') {
      return forbiddenResponse('Aduan gaji hanya diajukan oleh karyawan pemilik slip');
    }

    const employee = await employeeService.getEmployeeByUserId(user.userId);
    if (!employee) {
      return errorResponse('Profil karyawan tidak ditemukan', 404);
    }

    const body = await getRequestBody(request);
    const validation = createDisputeSchema.safeParse(body);
    if (!validation.success) return validationErrorResponse(validation.error.errors[0].message);

    const created = await payrollDisputeService.createDispute({
      payrollItemId: validation.data.payrollItemId,
      employeeId: employee.id,
      reason: validation.data.reason,
      requestedByUserId: user.userId,
    });
    await logAudit(user.userId, 'CREATE', 'PayrollDispute', created.id, undefined, { period: created.period }, request);

    return successResponse(created, 'Aduan gaji terkirim — Superadmin akan meninjau dan mengabari Anda.');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}
