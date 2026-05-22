import { NextRequest } from 'next/server';
import { verifyToken, JwtPayload, getAuthCookie } from './auth';
import { db, users } from './db';
import { eq } from 'drizzle-orm';

export interface AuthenticatedRequest extends NextRequest {
  user?: JwtPayload;
}

/**
 * Middleware to authenticate requests using JWT token from cookie or header
 */
export async function authenticate(request: NextRequest): Promise<JwtPayload | null> {
  let token: string | null = null;
  
  // Try to get token from cookie first (preferred)
  try {
    token = await getAuthCookie();
  } catch (error) {
    token = null;
  }

  if (!token) {
    token = request.cookies?.get('myprodusen_token')?.value || null;
  }

  if (!token && process.env.TESTSPRITE_COMPAT_RESPONSE === 'true') {
    token = request.cookies?.get('token')?.value || request.cookies?.get('auth')?.value || request.cookies?.get('jwt')?.value || null;
  }
  
  // Fallback to Authorization header for API clients
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  
  if (!token) {
    return null;
  }
  
  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1);

  if (!user?.isActive) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    role: user.role as any,
  };
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
  const cfConnectingIp = request.headers.get('cf-connecting-ip')?.trim();
  const hasCloudflareTrace = Boolean(request.headers.get('cf-ray') || request.headers.get('cf-visitor'));

  if (cfConnectingIp && hasCloudflareTrace) {
    return cfConnectingIp;
  }

  const forwardedFor = request.headers.get('x-forwarded-for')
    ?.split(',')
    .map((value) => value.trim())
    .find(Boolean);

  return forwardedFor || request.headers.get('x-real-ip')?.trim() || 'unknown';
}

/**
 * Get user agent
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown';
}
