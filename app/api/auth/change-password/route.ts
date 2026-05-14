import { NextRequest } from 'next/server';
import { authService } from '@/features/auth/auth.service';
import { changePasswordSchema } from '@/lib/validations/auth';
import { successResponse, errorResponse, validationErrorResponse, unauthorizedResponse } from '@/lib/utils/response';
import { getRequestBody, requireAuth } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    const body = await getRequestBody(request);
    
    // Validate input
    const validation = changePasswordSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }
    
    const { currentPassword, newPassword } = validation.data;
    
    const result = await authService.changePassword(user.userId, currentPassword, newPassword);
    
    return successResponse(result, 'Password berhasil diubah');
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error.message || 'Gagal mengubah password');
  }
}
