import { NextRequest } from 'next/server';
import { authService } from '@/services/auth/auth.service';
import { changePasswordSchema } from '@/utils/validation/auth';
import { successResponse, errorResponse, validationErrorResponse, unauthorizedResponse } from '@/utils/response';
import { getRequestBody, requireAuth } from '@/lib/middleware';
import { logAudit } from '@/lib/audit';

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
    await logAudit(user.userId, 'CHANGE_PASSWORD', 'User', user.userId, undefined, { userId: user.userId }, request);
    
    return successResponse(result, 'Password berhasil diubah');
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error.message || 'Gagal mengubah password');
  }
}
