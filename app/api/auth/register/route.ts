import { NextRequest } from 'next/server';
import { authService } from '@/services/auth/auth.service';
import { registerSchema } from '@/utils/validation/auth';
import { successResponse, errorResponse, validationErrorResponse, forbiddenResponse, unauthorizedResponse } from '@/utils/response';
import { getRequestBody, requireAuth } from '@/lib/middleware';
import { canManageRole, hasPermission } from '@/lib/permissions';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { logAudit } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimit(request, RATE_LIMITS.REGISTRATION);
    
    if (rateLimitResult.limited) {
      const resetIn = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000 / 60);
      return errorResponse(
        `Terlalu banyak percobaan registrasi. Coba lagi dalam ${resetIn} menit.`,
        429
      );
    }
    
    // Only SUPERADMIN and ADMIN_HR can create users
    const user = await requireAuth(request);
    
    if (!hasPermission(user.role, 'USER_CREATE')) {
      return forbiddenResponse('Anda tidak memiliki akses untuk membuat user');
    }
    
    const body = await getRequestBody(request);
    
    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }

    if (!canManageRole(user.role, validation.data.role)) {
      return forbiddenResponse('Anda tidak memiliki akses untuk membuat role tersebut');
    }
    
    const result = await authService.register(validation.data);
    await logAudit(user.userId, 'CREATE', 'User', result.id, undefined, result, request);
    
    return successResponse(result, 'User berhasil dibuat');
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error.message || 'Gagal membuat user');
  }
}
