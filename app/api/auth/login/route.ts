import { NextRequest } from 'next/server';
import { authService } from '@/features/auth/auth.service';
import { loginSchema } from '@/lib/validations/auth';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/response';
import { getRequestBody } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    const body = await getRequestBody(request);
    
    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }
    
    const { email, password } = validation.data;
    
    // Perform login
    const result = await authService.login(email, password);
    
    return successResponse(result, 'Login berhasil');
  } catch (error: any) {
    return errorResponse(error.message || 'Login gagal');
  }
}
