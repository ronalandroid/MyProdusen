import { NextRequest } from 'next/server';
import { kpiService } from '@/services/kpi/kpi.service';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/utils/response';
import { logAudit } from '@/lib/audit';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    if (!['SUPERADMIN', 'ADMIN_HR'].includes(user.role)) {
      return forbiddenResponse('Anda tidak memiliki akses');
    }
    const { id } = await params;
    const oldResult = await kpiService.getResultById(id);
    const result = await kpiService.approveResult(id, user.userId);
    await logAudit(user.userId, 'APPROVE', 'KpiResult', id, oldResult, result, request);
    return successResponse(result, 'Hasil KPI berhasil disetujui');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal menyetujui hasil KPI');
  }
}
