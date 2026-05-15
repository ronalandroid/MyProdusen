import { NextRequest } from 'next/server';
import { kpiService } from '@/services/kpi/kpi.service';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/utils/response';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || new Date().toISOString().slice(0, 7);
    const { id } = await params;

    if (user.role === 'EMPLOYEE') {
      const { db, employees } = await import('@/lib/db');
      const { eq } = await import('drizzle-orm');
      const [employee] = await db.select().from(employees).where(eq(employees.userId, user.userId)).limit(1);
      if (!employee || employee.id !== id) return forbiddenResponse('Anda tidak memiliki akses');
    }

    const summary = await kpiService.getEmployeeKpiSummary(id, period);
    return successResponse(summary);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal mengambil ringkasan KPI karyawan');
  }
}
