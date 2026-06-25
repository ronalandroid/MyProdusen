import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { randomBytes } from 'node:crypto';

export type UserRole = 'SUPERADMIN' | 'LEADER' | 'EMPLOYEE';

const TOKEN_COOKIE_NAME = 'myprodusen_token';
const COOKIE_MAX_AGE = 8 * 60 * 60; // 8 hours in seconds

// Dev/test fallback when JWT_SECRET is unset (production always throws). Generated
// once per process so tokens stay valid within a run, but it is never a known
// constant — a misconfigured non-prod env cannot have its tokens forged.
const DEV_EPHEMERAL_JWT_SECRET = randomBytes(32).toString('hex');

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is required in production');
    }

    return DEV_EPHEMERAL_JWT_SECRET;
  }

  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production');
  }

  return secret;
}

/**
 * Strict variant exposed for auxiliary signing flows (e.g., password-reset
 * tokens). Same rules as the main JWT secret resolver.
 */
export function getProductionJwtSecret(): string {
  return getJwtSecret();
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), { algorithm: 'HS256', expiresIn: '8h' });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    // Pin the algorithm so a forged token cannot downgrade/confuse verification.
    return jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as JwtPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Set authentication token as httpOnly cookie
 */
export async function setAuthCookie(token: string): Promise<void> {
  let cookieStore: Awaited<ReturnType<typeof cookies>>;

  try {
    cookieStore = await cookies();
  } catch (error) {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    throw error;
  }

  cookieStore.set(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

/**
 * Get authentication token from httpOnly cookie
 */
export async function getAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(TOKEN_COOKIE_NAME);
  return cookie?.value || null;
}

/**
 * Clear authentication cookie
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE_NAME);
}
