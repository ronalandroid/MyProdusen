import { NextRequest } from 'next/server';
import { verifyToken, JwtPayload } from './auth';
import { unauthorizedResponse } from './utils/response';

export interface AuthenticatedRequest extends NextRequest {
  user?: JwtPayload;
}

/**
 * Middleware to authenticate requests using JWT token
 */
export async function authenticate(request: NextRequest): Promise<JwtPayload | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  
  return payload;
}

/**
 * Get user from request or throw error
 */
export async function requireAuth(request: NextRequest): Promise<JwtPayload> {
  const user = await authenticate(request);
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

/**
 * Extract request body as JSON
 */
export async function getRequestBody<T>(request: NextRequest): Promise<T> {
  try {
    return await request.json();
  } catch (error) {
    throw new Error('Invalid JSON body');
  }
}

/**
 * Get client IP address
 */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Get user agent
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown';
}
