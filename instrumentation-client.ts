// Sentry client-side (browser) initialization. Next.js loads this file
// automatically for client instrumentation. Safe no-op without a DSN.
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    // Lighter trace sampling on the client to keep quota for real errors.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
    sendDefaultPii: false,
  });
}

// Required so Sentry can instrument client-side navigations.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
