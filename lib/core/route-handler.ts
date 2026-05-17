import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema } from 'zod';
import { AppError } from './app-error';
import { errorResponse, validationErrorResponse } from '@/utils/response';
import { logger } from '@/lib/logger';
import { TOKEN_COOKIE_NAME } from '@/lib/auth-response';
import { isTrustedMutationOrigin } from '@/lib/security/csrf-origin';

export type RouteContext<TParams = unknown> = TParams extends undefined
  ? undefined
  : { params: Promise<TParams> };

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    const message = error.expose ? error.message : 'Terjadi kesalahan pada server';
    return errorResponse(message, error.status);
  }

  if (error instanceof Error && error.message === 'Unauthorized') {
    return errorResponse('Unauthorized', 401);
  }

  logger.error('Unhandled API error', error);
  return errorResponse('Terjadi kesalahan pada server', 500);
}

export function withApiHandler<TParams = unknown>(
  handler: (request: NextRequest, context: RouteContext<TParams>) => Promise<NextResponse> | NextResponse,
) {
  return async (request: NextRequest, context: RouteContext<TParams>) => {
    try {
      const usesCookieAuth = request.cookies?.has?.(TOKEN_COOKIE_NAME) || request.headers.get('cookie')?.includes(`${TOKEN_COOKIE_NAME}=`);
      const usesBearerAuth = request.headers.get('authorization')?.startsWith('Bearer ');

      if (usesCookieAuth && !usesBearerAuth && !isTrustedMutationOrigin({
        method: request.method,
        requestUrl: request.url,
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
      })) {
        throw AppError.forbidden('Permintaan tidak valid');
      }

      return await handler(request, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

export async function parseJsonBody<T>(request: NextRequest, schema: ZodSchema<T>): Promise<T> {
  const body = await request.json().catch(() => undefined);
  const validation = schema.safeParse(body);

  if (!validation.success) {
    throw AppError.validation(validation.error.errors[0]?.message || 'Payload tidak valid');
  }

  return validation.data;
}
