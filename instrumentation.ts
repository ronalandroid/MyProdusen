// Next.js native instrumentation hook. `register()` loads the runtime-specific
// Sentry config; `onRequestError` fires for every unhandled server-side error
// (RSC, route handlers, server actions) and forwards it to Sentry while always
// logging through the structured pino logger.
//
// Everything is gated on a DSN being present, so with no SENTRY_DSN the app
// runs exactly as before — observability degrades gracefully to logs only.
import * as Sentry from '@sentry/nextjs';
import type { Instrumentation } from 'next';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context,
) => {
  // Forward to Sentry (no-op if DSN unset).
  Sentry.captureRequestError(err, request, context);

  // Always keep a structured log line. Import lazily so the edge runtime,
  // where some node deps are unavailable, doesn't break.
  try {
    const { logger } = await import('@/lib/logger');
    const error = err as Error;
    logger.error('Unhandled request error', {
      message: error?.message,
      stack: error?.stack,
      path: request?.path,
      method: request?.method,
      routerKind: context?.routerKind,
      routePath: context?.routePath,
      renderSource: context?.renderSource,
    });
  } catch {
    console.error('Unhandled request error (logger unavailable):', err);
  }
};
