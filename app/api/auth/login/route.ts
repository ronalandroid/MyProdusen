import { NextRequest } from 'next/server';
import { authService } from '@/services/auth/auth.service';
import { loginSchema } from '@/utils/validation/auth';
import { successResponse, errorResponse, validationErrorResponse } from '@/utils/response';
import { getRequestBody } from '@/lib/middleware';
import { setAuthCookie } from '@/lib/auth';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimit(request, RATE_LIMITS.LOGIN);
    
    if (rateLimitResult.limited) {
      const resetIn = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000 / 60);
      return errorResponse(
        `Terlalu banyak percobaan login. Coba lagi dalam ${resetIn} menit.`,
        429
      );
    }
    
    const body = await getRequestBody(request);
    
    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }
    
    const { email, password } = validation.data;
    
    // Perform login
    const result = await authService.login(email, password);
    
    // Set httpOnly cookie instead of returning token
    await setAuthCookie(result.token);
    
    // Return user data without token
    return successResponse(
      {
        user: result.user,
      },
      'Login berhasil'
    );
  } catch (error: any) {
    return errorResponse(error.message || 'Login gagal');
  }
}
