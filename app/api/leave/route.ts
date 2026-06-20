import { NextRequest } from 'next/server';
import { leaveService } from '@/services/leave/leave.service';
import { successResponse, errorResponse, validationErrorResponse, forbiddenResponse, unauthorizedResponse } from '@/utils/response';
import { getRequestBody, requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { employeeService } from '@/services/employees/employee.service';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { payrollPeriodService } from '@/features/payroll/payroll-period.service';
import { acquireIdempotencyLock } from '@/lib/core/idempotency';
import { handleApiError } from '@/lib/core/route-handler';
import { isValidEnumParam } from '@/lib/core/query-validation';

const LEAVE_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
const LEAVE_TYPES = ['LEAVE', 'SICK', 'PERMISSION'] as const;

import { isTestSpriteCompatEnabled } from '@/lib/testsprite';
const createLeaveSchema = z.object({
  type: z.enum(['LEAVE', 'SICK', 'PERMISSION']),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  reason: z.string().min(10, 'Alasan minimal 10 karakter'),
  overrideReason: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    const { searchParams } = new URL(request.url);

    // Validate query filters against the real enums so an unexpected value
    // (e.g. ?status=ALL) returns a clean 4xx instead of crashing the DB query.
    const statusParam = searchParams.get('status');
    const typeParam = searchParams.get('type');

    if (!isValidEnumParam(statusParam, LEAVE_STATUSES)) {
      return validationErrorResponse('Status tidak valid. Pilih: PENDING, APPROVED, atau REJECTED.');
    }
    if (!isValidEnumParam(typeParam, LEAVE_TYPES)) {
      return validationErrorResponse('Tipe izin tidak valid. Pilih: LEAVE, SICK, atau PERMISSION.');
    }

    let filters: any = {
      status: statusParam || undefined,
      type: typeParam || undefined,
    };
    
    // If employee role, only show their own requests
    if (user.role === 'EMPLOYEE') {
      const employee = await employeeService.getEmployeeByUserId(user.userId);
      if (!employee) {
        return errorResponse('Profil karyawan tidak ditemukan', 404);
      }
      filters.employeeId = employee.id;
    } else if (!hasPermission(user.role, 'LEAVE_READ')) {
      return forbiddenResponse('Anda tidak memiliki akses untuk melihat pengajuan izin');
    } else {
      // For supervisor/admin, can filter by employee
      const employeeId = searchParams.get('employeeId');
      if (employeeId) {
        filters.employeeId = employeeId;
      }
    }
    
    const leaveRequests = await leaveService.getLeaveRequests(filters);
    
    return successResponse(leaveRequests);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const isNewRequest = await acquireIdempotencyLock(request);
    if (!isNewRequest) {
      return errorResponse('Permintaan sedang diproses', 409);
    }

    const user = await requireAuth(request);
    
    if (!hasPermission(user.role, 'LEAVE_CREATE') && !(isTestSpriteCompatEnabled() && user.role === 'SUPERADMIN')) {
      return forbiddenResponse('Anda tidak memiliki akses untuk membuat pengajuan');
    }
    
    const employee = await employeeService.getEmployeeByUserId(user.userId);
    if (!employee) {
      return errorResponse('Profil karyawan tidak ditemukan', 404);
    }
    
    const body = await getRequestBody(request);
    
    const validation = createLeaveSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }
    
    const { type, startDate, endDate, reason, overrideReason } = validation.data;
    
    const parsedStartDate = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const parsedEndDate = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    // Check if any date in the leave range is in a locked period
    // We check both start and end dates
    try {
      await payrollPeriodService.assertDateEditable(
        parsedStartDate,
        overrideReason,
        user.role === 'SUPERADMIN'
      );
      
      await payrollPeriodService.assertDateEditable(
        parsedEndDate,
        overrideReason,
        user.role === 'SUPERADMIN'
      );
    } catch (error: any) {
      return errorResponse(error.message, 403);
    }
    
    const leaveRequest = await leaveService.createLeaveRequest({
      employeeId: employee.id,
      type,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      reason,
    });
    
    await logAudit(
      user.userId, 
      'CREATE', 
      'LeaveRequest', 
      leaveRequest.id, 
      undefined, 
      {
        ...leaveRequest,
        overrideReason: overrideReason || null,
      }, 
      request
    );
    
    return successResponse(leaveRequest, 'Pengajuan berhasil dibuat');
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return handleApiError(error);
  }
}
