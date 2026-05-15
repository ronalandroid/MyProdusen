import { NextRequest } from 'next/server';
import { kpiService } from '@/services/kpi/kpi.service';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/utils/response';

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
    return errorResponse(error.message || 'Gagal mengambil assignment KPI');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    // Only SUPERADMIN, ADMIN_HR, and SUPERVISOR can assign KPI
    if (!['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR'].includes(user.role)) {
      return forbiddenResponse('Anda tidak memiliki akses');
    }

    const body = await request.json();
    const { employeeId, templateId, period } = body;

    if (!employeeId || !templateId || !period) {
      return errorResponse('employeeId, templateId, dan period wajib diisi', 422);
    }

    // Supervisor team scope check
    if (user.role === 'SUPERVISOR') {
      const { db, employees } = await import('@/lib/db');
      const { eq } = await import('drizzle-orm');
      const { canManageEmployeeKpi } = await import('@/lib/kpi/team-scope');
      
      const [actorEmployee] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, user.userId))
        .limit(1);
      
      const [targetEmployee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, employeeId))
        .limit(1);
      
      if (!canManageEmployeeKpi(user.role, actorEmployee, targetEmployee)) {
        return forbiddenResponse('Anda hanya dapat assign KPI untuk tim sendiri');
      }
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
    return errorResponse(error.message || 'Gagal assign KPI');
  }
}
