import { NextRequest } from 'next/server';
import { kpiService } from '@/services/kpi/kpi.service';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/utils/response';
import { hasPermission } from '@/lib/permissions';
import { handleApiError, withApiHandler } from '@/lib/core/route-handler';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const period = searchParams.get('period');

    const filters: any = {};
    
    // EMPLOYEE can only see their own assignments
    if (user.role === 'EMPLOYEE') {
      // Get employee record for this user
      const { db, employees } = await import('@/lib/db');
      const { eq } = await import('drizzle-orm');
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, user.userId))
        .limit(1);
      
      if (!employee) {
        return errorResponse('Data karyawan tidak ditemukan');
      }
      
      filters.employeeId = employee.id;
    } else if (employeeId) {
      filters.employeeId = employeeId;
    }
    
    if (period) {
      filters.period = period;
    }

    const assignments = await kpiService.getAssignments(filters);
    return successResponse(assignments);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return handleApiError(error);
  }
}

export const POST = withApiHandler(async (request) => {
  try {
    const user = await requireAuth(request);

    if (!hasPermission(user.role, 'KPI_ASSIGN')) {
      return forbiddenResponse('Anda tidak memiliki akses');
    }

    const body = await request.json();
    const { employeeId, templateId, period } = body;

    if (!employeeId || !templateId || !period) {
      return errorResponse('employeeId, templateId, dan period wajib diisi', 422);
    }

    const assignment = await kpiService.assignKpi({
      employeeId,
      templateId,
      period,
      assignedBy: user.userId,
    });

    return successResponse(assignment, 'KPI berhasil di-assign');
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return handleApiError(error);
  }
});
