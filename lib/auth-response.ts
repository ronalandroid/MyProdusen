import { NextResponse } from 'next/server';

export const TOKEN_COOKIE_NAME = 'myprodusen_token';
export const COOKIE_MAX_AGE = 8 * 60 * 60;

export function setAuthCookieOnResponse(response: NextResponse, token: string): NextResponse {
  response.cookies.set(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  return response;
}

export function clearAuthCookieOnResponse(response: NextResponse): NextResponse {
  response.cookies.set(TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    expires: new Date(0),
    path: '/',
  });

  return response;
}
