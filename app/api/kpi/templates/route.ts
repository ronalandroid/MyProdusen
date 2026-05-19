import { NextRequest } from 'next/server';
import { kpiService } from '@/services/kpi/kpi.service';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/utils/response';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    // Only SUPERADMIN can view templates
    if (!['SUPERADMIN'].includes(user.role)) {
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
    return errorResponse(error.message || 'Gagal mengambil template KPI');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    // Only SUPERADMIN can create templates
    if (!['SUPERADMIN'].includes(user.role)) {
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
    await logAudit(user.userId, 'CREATE', 'KpiTemplate', template.id, undefined, template, request);

    return successResponse(template, 'Template KPI berhasil dibuat');
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error.message || 'Gagal membuat template KPI');
  }
}
