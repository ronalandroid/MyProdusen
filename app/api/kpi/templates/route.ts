import { NextRequest } from 'next/server';
import { kpiService } from '@/services/kpi/kpi.service';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/utils/response';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { handleApiError } from '@/lib/core/route-handler';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    if (!hasPermission(user.role, 'KPI_TEMPLATE_READ')) {
      return forbiddenResponse('Anda tidak memiliki akses');
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    const filters: any = {};
    if (isActive !== null) {
      filters.isActive = isActive === 'true';
    }

    const templates = await kpiService.getTemplates(filters);
    return successResponse(templates);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    if (!hasPermission(user.role, 'KPI_TEMPLATE_CREATE')) {
      return forbiddenResponse('Anda tidak memiliki akses');
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return errorResponse('Nama template wajib diisi', 422);
    }

    const template = await kpiService.createTemplate({
      name,
      description,
      createdBy: user.userId,
    });
    await kpiService.createItem({
      templateId: template.id,
      name: 'KPI Operasional Utama',
      description: 'Item default agar template langsung dapat dipakai untuk input hasil KPI.',
      weight: 100,
      scoringType: 'HIGHER_IS_BETTER',
      targetValue: 100,
      minValue: 0,
      maxValue: 100,
      unit: '%',
    });
    await logAudit(user.userId, 'CREATE', 'KpiTemplate', template.id, undefined, template, request);

    return successResponse(template, 'Template KPI berhasil dibuat');
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return handleApiError(error);
  }
}
