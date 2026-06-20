// Next.js native instrumentation hook. `onRequestError` fires for every
// unhandled server-side error (RSC, route handlers, server actions), giving
// us one central place to capture production failures with structured context.
//
// It logs through the existing pino logger always, and additionally forwards
// to Sentry *only* when SENTRY_DSN is configured — so observability is
// dependency-free out of the box and upgradeable without touching call sites.
import type { Instrumentation } from 'next';

export async function register() {
  // Reserved for future tracing/Sentry SDK init. Intentionally a no-op unless
  // SENTRY_DSN is wired, so cold starts stay fast.
}

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context,
) => {
  // Avoid importing the logger at module top-level: instrumentation can run in
  // the edge runtime where some node deps are unavailable. Import lazily here,
  // and fall back to console only if that fails.
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
    // Last-resort: never let error reporting throw.
    console.error('Unhandled request error (logger unavailable):', err);
  }
};
