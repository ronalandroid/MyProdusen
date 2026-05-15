import { NextRequest } from 'next/server';
import { authService } from '@/services/auth/auth.service';
import { successResponse, errorResponse, unauthorizedResponse } from '@/utils/response';
import { requireAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    const profile = await authService.getProfile(user.userId);
    
    return successResponse(profile);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error.message || 'Gagal mengambil profil');
  }
}
