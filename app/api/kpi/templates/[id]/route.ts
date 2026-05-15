import { NextRequest } from 'next/server';
import { kpiService } from '@/services/kpi/kpi.service';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/utils/response';
import { logAudit } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    if (!['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR'].includes(user.role)) {
      return forbiddenResponse('Anda tidak memiliki akses');
    }
    const { id } = await params;
    const template = await kpiService.getTemplateById(id);
    return successResponse(template);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal mengambil template KPI');
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    if (!['SUPERADMIN', 'ADMIN_HR'].includes(user.role)) {
      return forbiddenResponse('Anda tidak memiliki akses');
    }
    const { id } = await params;
    const body = await request.json();
    const { name, description, isActive } = body;
    const oldTemplate = await kpiService.getTemplateById(id);
    const template = await kpiService.updateTemplate(id, { name, description, isActive });
    await logAudit(user.userId, 'UPDATE', 'KpiTemplate', id, oldTemplate, template, request);
    return successResponse(template, 'Template KPI berhasil diperbarui');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal memperbarui template KPI');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    if (!['SUPERADMIN', 'ADMIN_HR'].includes(user.role)) {
      return forbiddenResponse('Anda tidak memiliki akses');
    }
    const { id } = await params;
    const oldTemplate = await kpiService.getTemplateById(id);
    await kpiService.deleteTemplate(id);
    await logAudit(user.userId, 'DELETE', 'KpiTemplate', id, oldTemplate, undefined, request);
    return successResponse(null, 'Template KPI berhasil dihapus');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal menghapus template KPI');
  }
}
