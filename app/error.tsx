'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report to Sentry (no-op when no DSN) so the "tim teknis diberitahu" copy is true.
    Sentry.captureException(error);
  }, [error]);

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center"
      style={{ background: 'var(--surface-warm)' }}
    >
      <div className="card w-full max-w-md p-8">
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: 'var(--danger-bg, #FEE2E2)' }}
        >
          <svg className="h-8 w-8" style={{ color: 'var(--danger, #DC2626)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Terjadi kesalahan
        </h1>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Sistem mendeteksi kesalahan yang tidak terduga. Tim teknis telah diberitahu. Silakan coba lagi.
        </p>
        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button type="button" onClick={reset} className="btn btn-primary">
            Coba Lagi
          </button>
          <a href="/dashboard" className="btn btn-secondary">
            Ke Dashboard
          </a>
        </div>
        {error.digest && (
          <p className="mt-5 text-xs" style={{ color: 'var(--text-muted)' }}>
            Kode referensi: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
