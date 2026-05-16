import { NextRequest } from 'next/server';
import { authService } from '@/services/auth/auth.service';
import { errorResponse, forbiddenResponse, successResponse, unauthorizedResponse } from '@/utils/response';
import { requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (!hasPermission(user.role, 'USER_READ')) {
      return forbiddenResponse('Anda tidak memiliki akses untuk melihat user');
    }

    const users = await authService.listUsers();
    return successResponse(users);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal mengambil user');
  }
}
