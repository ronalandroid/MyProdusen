import { NextResponse } from 'next/server';

import { isTestSpriteCompatEnabled } from './testsprite';
export const TOKEN_COOKIE_NAME = 'myprodusen_token';
const TESTSPRITE_TOKEN_COOKIE_NAME = 'token';
const TESTSPRITE_AUTH_COOKIE_NAME = 'auth';
const TESTSPRITE_JWT_COOKIE_NAME = 'jwt';
export const COOKIE_MAX_AGE = 8 * 60 * 60;

function shouldUseSecureCookie() {
  return process.env.NODE_ENV === 'production';
}

export function setAuthCookieOnResponse(response: NextResponse, token: string): NextResponse {
  const options = {
    httpOnly: true,
    secure: shouldUseSecureCookie(),
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  } as const;

  response.cookies.set(TOKEN_COOKIE_NAME, token, options);

  if (isTestSpriteCompatEnabled()) {
    response.cookies.set(TESTSPRITE_TOKEN_COOKIE_NAME, token, options);
    response.cookies.set(TESTSPRITE_AUTH_COOKIE_NAME, token, options);
    response.cookies.set(TESTSPRITE_JWT_COOKIE_NAME, token, options);
  }

  return response;
}

export function clearAuthCookieOnResponse(response: NextResponse): NextResponse {
  const options = {
    httpOnly: true,
    secure: shouldUseSecureCookie(),
    sameSite: 'lax',
    maxAge: 0,
    expires: new Date(0),
    path: '/',
  } as const;

  response.cookies.set(TOKEN_COOKIE_NAME, '', options);

  if (isTestSpriteCompatEnabled()) {
    response.cookies.set(TESTSPRITE_TOKEN_COOKIE_NAME, '', options);
    response.cookies.set(TESTSPRITE_AUTH_COOKIE_NAME, '', options);
    response.cookies.set(TESTSPRITE_JWT_COOKIE_NAME, '', options);
  }

  return response;
}
