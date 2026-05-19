import { NextRequest } from 'next/server';
import { z } from 'zod';
import { overtimeService } from '@/features/overtime/overtime.service';
import { employeeService } from '@/services/employees/employee.service';
import { requireAuth, getRequestBody } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';
import { logAudit } from '@/lib/audit';

const createOvertimeSchema = z.object({
  overtimeDate: z.string().transform(str => new Date(str)),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  rateId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as any;
    
    const employee = await employeeService.getEmployeeByUserId(user.userId).catch(() => null);
    
    if (!employee) {
      return errorResponse('Employee data not found');
    }

    let requests;
    
    if (user.role === 'EMPLOYEE') {
      requests = await overtimeService.getRequests({
        employeeId: employee.id,
        status: status || undefined,
      });
    } else if (false) {
      requests = await overtimeService.getRequests({
        status: status || undefined,
      });
    } else {
      requests = await overtimeService.getRequests({
        status: status || undefined,
      });
    }

    return successResponse(requests);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Failed to fetch overtime requests');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    if (!hasPermission(user.role, 'ATTENDANCE_CREATE')) {
      return forbiddenResponse('You do not have permission to create overtime requests');
    }

    const employee = await employeeService.getEmployeeByUserId(user.userId);
    const body = await getRequestBody(request);
    const validation = createOvertimeSchema.safeParse(body);
    
    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }

    const [startHour, startMin] = validation.data.startTime.split(':').map(Number);
    const [endHour, endMin] = validation.data.endTime.split(':').map(Number);
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

    if (durationMinutes <= 0) {
      return validationErrorResponse('End time must be after start time');
    }

    const durationHours = durationMinutes / 60;

    const overtimeRequest = await overtimeService.createRequest({
      employeeId: employee.id,
      overtimeDate: validation.data.overtimeDate,
      startTime: validation.data.startTime,
      endTime: validation.data.endTime,
      durationHours,
      reason: validation.data.reason,
      rateId: validation.data.rateId,
    });

    await logAudit(user.userId, 'CREATE', 'OvertimeRequest', overtimeRequest.id, undefined, overtimeRequest, request);

    return successResponse(overtimeRequest, 'Overtime request created successfully');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Failed to create overtime request');
  }
}
