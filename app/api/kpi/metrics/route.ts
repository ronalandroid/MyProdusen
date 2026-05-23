import { NextRequest } from 'next/server';
import { kpiService } from '@/services/kpi/kpi.service';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'SUPERADMIN' && user.role !== 'LEADER') {
      return forbiddenResponse('Hanya Superadmin dan Leader yang dapat melihat metrik KPI');
    }
    const metrics = await kpiService.getMetrics({ active: true });
    return successResponse(metrics);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal mengambil metrik KPI');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'SUPERADMIN') {
      return forbiddenResponse('Hanya Superadmin yang dapat menambahkan metrik KPI');
    }
    const body = await request.json();
    const { name, unit, active } = body;
    const metric = await kpiService.createMetric(user.userId, { name, unit, active });
    return successResponse(metric, 'Metrik KPI berhasil ditambahkan');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal menambahkan metrik KPI');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'SUPERADMIN') {
      return forbiddenResponse('Hanya Superadmin yang dapat memperbarui metrik KPI');
    }
    const body = await request.json();
    const { id, name, unit, active } = body;
    if (!id) return errorResponse('ID metrik KPI wajib diisi', 422);
    const metric = await kpiService.updateMetric(user.userId, id, { name, unit, active });
    return successResponse(metric, 'Metrik KPI berhasil diperbarui');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal memperbarui metrik KPI');
  }
}
