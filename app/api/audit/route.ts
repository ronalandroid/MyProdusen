import { NextRequest } from 'next/server';
import { auditService } from '@/services/audit/audit.service';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    // Only SUPERADMIN can view audit logs
    if (user.role !== 'SUPERADMIN') {
      return forbiddenResponse('Anda tidak memiliki akses');
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const entity = searchParams.get('entity');
    const action = searchParams.get('action');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const limit = searchParams.get('limit');

    const filters: any = {};
    if (userId) filters.userId = userId;
    if (entity) filters.entity = entity;
    if (action) filters.action = action;
    if (from) filters.from = new Date(from);
    if (to) filters.to = new Date(to);
    if (limit) filters.limit = parseInt(limit, 10);

    const logs = await auditService.getLogs(filters);
    return successResponse(logs);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error.message || 'Gagal mengambil audit log');
  }
}
