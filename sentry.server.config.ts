// Sentry server-side initialization (Node runtime). Loaded from
// instrumentation.ts register(). Safe no-op when SENTRY_DSN is unset — keeps
// local/dev runs from phoning home and avoids hard-failing without a DSN.
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    // Capture 10% of transactions for performance monitoring in production,
    // everything in dev. Tune later if volume grows.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Don't send default PII (IP, cookies). HRIS data is sensitive.
    sendDefaultPii: false,
  });
}
