import { NextRequest } from 'next/server';
import { authService } from '@/features/auth/auth.service';
import { registerSchema } from '@/lib/validations/auth';
import { successResponse, errorResponse, validationErrorResponse, forbiddenResponse } from '@/lib/utils/response';
import { getRequestBody, requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  try {
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
    
    const result = await authService.register(validation.data);
    
    return successResponse(result, 'User berhasil dibuat');
  } catch (error: any) {
    return errorResponse(error.message || 'Gagal membuat user');
  }
}
