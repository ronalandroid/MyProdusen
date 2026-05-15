import { NextRequest } from 'next/server';
import { successResponse } from '@/utils/response';
import { clearAuthCookieOnResponse } from '@/lib/auth-response';

export async function POST(request: NextRequest) {
  const response = successResponse(null, 'Logout berhasil');

  // Clear cookie on the same response returned to the browser.
  return clearAuthCookieOnResponse(response);
}
