import { NextRequest } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';
import { successResponse } from '@/utils/response';

export async function POST(request: NextRequest) {
  // Clear the httpOnly cookie
  await clearAuthCookie();
  
  return successResponse(null, 'Logout berhasil');
}
