"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

// Per-dashboard error boundary. Catches render/runtime errors in any dashboard
// page (the scores.map crash class) so the app shows a recoverable inline error
// instead of a blank screen — and reports it to Sentry. The root layout (nav)
// stays mounted; only the page content is replaced.
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="card w-full max-w-md p-6 text-center">
        <div
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: "var(--danger-bg)" }}
          aria-hidden="true"
        >
          <AlertTriangle size={28} style={{ color: "var(--danger)" }} />
        </div>
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          Halaman ini bermasalah
        </h2>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Terjadi kesalahan tak terduga saat memuat halaman. Tim teknis sudah
          otomatis diberitahu. Coba muat ulang halaman ini.
        </p>
        {error?.digest && (
          <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
            Kode referensi: {error.digest}
          </p>
        )}
        <button type="button" onClick={reset} className="btn btn-primary mt-6 w-full">
          <RefreshCcw size={16} aria-hidden="true" /> Muat Ulang Halaman
        </button>
      </div>
    </div>
  );
}
