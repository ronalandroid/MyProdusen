import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isTrustedMutationOrigin } from '@/lib/security/csrf-origin';
import { generateNonce, buildNonceCsp } from '@/lib/security/csp';
import { TOKEN_COOKIE_NAME } from '@/lib/auth-response';
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const protectedRoutes = ['/dashboard'];
const authRoutes = ['/login', '/register'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/')) {
    const usesCookieAuth = request.cookies.has(TOKEN_COOKIE_NAME);
    const usesBearerAuth = request.headers.get('authorization')?.startsWith('Bearer ');

    if (
      MUTATING_METHODS.has(request.method.toUpperCase()) &&
      usesCookieAuth &&
      !usesBearerAuth &&
      !isTrustedMutationOrigin({
        method: request.method,
        requestUrl: request.url,
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
      })
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Permintaan tidak valid',
          message: 'Permintaan tidak valid',
        },
        {
          status: 403,
          headers: {
            'Cache-Control': 'no-store, private',
            Pragma: 'no-cache',
            Expires: '0',
          },
        },
      );
    }

    return NextResponse.next();
  }

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const hasToken = Boolean(request.cookies.get(TOKEN_COOKIE_NAME)?.value);

  if (isProtectedRoute && !hasToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && hasToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Per-request nonce CSP on document responses (audit M7 / #17).
  // The nonce policy rides on the request CSP header so Next.js attaches the
  // nonce to its own inline bootstrap scripts — without that, enforcement
  // would block hydration. The baseline policy in next.config.js still
  // applies; browsers enforce the intersection of both headers.
  // Enforced in production; report-only in dev (React Refresh needs eval) or
  // with CSP_NONCE_REPORT_ONLY=true as the production rollback switch.
  const isProd = process.env.NODE_ENV === 'production';
  const nonce = generateNonce();
  const cspValue = buildNonceCsp(nonce, { isProd });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('content-security-policy', cspValue);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  const enforceNonceCsp = isProd && process.env.CSP_NONCE_REPORT_ONLY !== 'true';
  response.headers.set(
    enforceNonceCsp ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only',
    cspValue,
  );

  if (isProtectedRoute) {
    response.headers.set('Cache-Control', 'no-store, private');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|favicon-16.png|favicon-32.png|icon-192.png|icon-512.png|apple-touch-icon.png|logo.png|public).*)',
  ],
};
