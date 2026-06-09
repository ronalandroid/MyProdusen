import { NextRequest } from 'next/server';
import { kpiService } from '@/services/kpi/kpi.service';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/utils/response';
import { handleApiError } from '@/lib/core/route-handler';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'SUPERADMIN' && user.role !== 'LEADER') {
      return forbiddenResponse('Hanya Superadmin dan Leader yang dapat melihat target KPI');
    }
    const { searchParams } = new URL(request.url);
    const targets = await kpiService.getTargets({
      active: searchParams.get('active') !== 'false',
      scopeType: searchParams.get('scopeType') || undefined,
      scopeId: searchParams.get('scopeId') || undefined,
    });
    return successResponse(targets);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'SUPERADMIN') {
      return forbiddenResponse('Hanya Superadmin yang dapat menambahkan target KPI');
    }
    const body = await request.json();
    const { metricId, scopeType, scopeId, periodType, targetQuantity, active, effectiveFrom, effectiveTo } = body;
    const target = await kpiService.createTarget(user.userId, {
      metricId,
      scopeType,
      scopeId,
      periodType,
      targetQuantity: Number(targetQuantity),
      active,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
      effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined,
    });
    return successResponse(target, 'Target KPI berhasil ditambahkan');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'SUPERADMIN') {
      return forbiddenResponse('Hanya Superadmin yang dapat memperbarui target KPI');
    }
    const body = await request.json();
    const { id, targetQuantity, active, effectiveFrom, effectiveTo } = body;
    if (!id) return errorResponse('ID target KPI wajib diisi', 422);
    const target = await kpiService.updateTarget(user.userId, id, {
      targetQuantity: targetQuantity !== undefined ? Number(targetQuantity) : undefined,
      active,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
      effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined,
    });
    return successResponse(target, 'Target KPI berhasil diperbarui');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}
