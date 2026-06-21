import { NextRequest } from 'next/server';
import { z } from 'zod';
import { kpiService } from '@/services/kpi/kpi.service';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, validationErrorResponse } from '@/utils/response';
import { handleApiError } from '@/lib/core/route-handler';

const createTargetSchema = z.object({
  metricId: z.string().min(1, 'Metrik wajib dipilih'),
  scopeType: z.string().min(1, 'Scope wajib diisi'),
  scopeId: z.string().min(1, 'Scope ID wajib diisi'),
  periodType: z.string().min(1, 'Periode wajib diisi'),
  targetQuantity: z.coerce.number().finite().nonnegative('Target harus angka >= 0'),
  active: z.boolean().optional(),
  effectiveFrom: z.string().optional().nullable(),
  effectiveTo: z.string().optional().nullable(),
});

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
    const parsed = createTargetSchema.safeParse(await request.json());
    if (!parsed.success) return validationErrorResponse(parsed.error.errors[0]?.message || 'Data target KPI tidak valid');
    const { metricId, scopeType, scopeId, periodType, targetQuantity, active, effectiveFrom, effectiveTo } = parsed.data;
    const target = await kpiService.createTarget(user.userId, {
      metricId,
      scopeType,
      scopeId,
      periodType,
      targetQuantity,
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
