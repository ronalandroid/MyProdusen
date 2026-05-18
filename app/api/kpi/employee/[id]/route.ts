import { NextRequest } from 'next/server';
import { kpiService } from '@/services/kpi/kpi.service';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/utils/response';
import { db, employees } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || new Date().toISOString().slice(0, 7);
    const { id } = await params;

    if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN_HR') {
      const [currentEmployee] = await db.select().from(employees).where(eq(employees.userId, user.userId)).limit(1);
      if (!currentEmployee) return forbiddenResponse('Anda tidak memiliki akses');

      if (user.role === 'EMPLOYEE' && currentEmployee.id !== id) {
        return forbiddenResponse('Anda tidak memiliki akses');
      }

      if (user.role === 'SUPERVISOR') {
        const [targetEmployee] = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
        if (!targetEmployee || (targetEmployee.supervisorId !== currentEmployee.id && targetEmployee.id !== currentEmployee.id)) {
          return forbiddenResponse('Anda hanya dapat melihat KPI tim Anda');
        }
      }
    }

    const summary = await kpiService.getEmployeeKpiSummary(id, period);
    return successResponse(summary);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal mengambil ringkasan KPI karyawan');
  }
}
