import { NextRequest } from 'next/server';
import { leaveService } from '@/features/leave/leave.service';
import { successResponse, errorResponse, validationErrorResponse, forbiddenResponse, unauthorizedResponse } from '@/lib/utils/response';
import { getRequestBody, requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { employeeService } from '@/features/employees/employee.service';
import { z } from 'zod';

const createLeaveSchema = z.object({
  type: z.enum(['LEAVE', 'SICK', 'PERMISSION']),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  reason: z.string().min(10, 'Alasan minimal 10 karakter'),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    const { searchParams } = new URL(request.url);
    
    let filters: any = {
      status: searchParams.get('status') as any,
      type: searchParams.get('type') as any,
    };
    
    // If employee role, only show their own requests
    if (user.role === 'EMPLOYEE') {
      const employee = await employeeService.getEmployeeByUserId(user.userId);
      filters.employeeId = employee.id;
    } else if (!hasPermission(user.role, 'LEAVE_READ')) {
      return forbiddenResponse('Anda tidak memiliki akses untuk melihat pengajuan izin');
    } else if (user.role === 'SUPERVISOR') {
      const supervisor = await employeeService.getEmployeeByUserId(user.userId);
      const employeeId = searchParams.get('employeeId');

      if (employeeId) {
        const targetEmployee = await employeeService.getEmployeeById(employeeId);
        if (targetEmployee.supervisorId !== supervisor.id) {
          return forbiddenResponse('Anda hanya dapat melihat pengajuan tim Anda');
        }
        filters.employeeId = employeeId;
      } else {
        filters.supervisorId = supervisor.id;
      }
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
    return errorResponse(error.message || 'Gagal mengambil data pengajuan');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    if (!hasPermission(user.role, 'LEAVE_CREATE')) {
      return forbiddenResponse('Anda tidak memiliki akses untuk membuat pengajuan');
    }
    
    const employee = await employeeService.getEmployeeByUserId(user.userId);
    
    const body = await getRequestBody(request);
    
    const validation = createLeaveSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }
    
    const { type, startDate, endDate, reason } = validation.data;
    
    const leaveRequest = await leaveService.createLeaveRequest({
      employeeId: employee.id,
      type,
      startDate: typeof startDate === 'string' ? new Date(startDate) : startDate,
      endDate: typeof endDate === 'string' ? new Date(endDate) : endDate,
      reason,
    });
    
    return successResponse(leaveRequest, 'Pengajuan berhasil dibuat');
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error.message || 'Gagal membuat pengajuan');
  }
}
