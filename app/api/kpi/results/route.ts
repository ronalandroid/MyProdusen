import { NextRequest } from 'next/server';
import { kpiService } from '@/services/kpi/kpi.service';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/utils/response';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const period = searchParams.get('period');
    const isApproved = searchParams.get('isApproved');

    const filters: any = {};
    
    // EMPLOYEE can only see their own results
    if (user.role === 'EMPLOYEE') {
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
    
    if (isApproved !== null) {
      filters.isApproved = isApproved === 'true';
    }

    const results = await kpiService.getResults(filters);
    return successResponse(results);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error.message || 'Gagal mengambil hasil KPI');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    // Only SUPERADMIN, ADMIN_HR, and SUPERVISOR can submit results
    if (!['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR'].includes(user.role)) {
      return forbiddenResponse('Anda tidak memiliki akses');
    }

    const body = await request.json();
    const { employeeId, itemId, period, actualValue, notes } = body;

    if (!employeeId || !itemId || !period || actualValue === undefined) {
      return errorResponse('employeeId, itemId, period, dan actualValue wajib diisi', 422);
    }

    const result = await kpiService.submitResult({
      employeeId,
      itemId,
      period,
      actualValue,
      notes,
    });
    await logAudit(user.userId, 'CREATE', 'KpiResult', result.id, undefined, result, request);

    return successResponse(result, 'Hasil KPI berhasil disimpan');
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error.message || 'Gagal menyimpan hasil KPI');
  }
}
