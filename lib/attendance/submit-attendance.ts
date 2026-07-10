/**
 * Resilient attendance submit for employees on their own (often weak) mobile
 * data. A plain fetch on flaky cellular loses the whole check-in on one blip;
 * this wraps the POST with:
 *
 *   1. A stable Idempotency-Key reused across retries. The check-in/out routes
 *      already dedup on this header (lib/core/idempotency), so a retry that
 *      lands after the server actually processed the first attempt is a safe
 *      no-op (409 → treated as success) rather than a double clock-in.
 *   2. Per-attempt timeout via AbortController — a dead signal fails fast
 *      instead of freezing the button for minutes.
 *   3. Bounded retry with backoff on transient failures (network error,
 *      timeout, 408/429/5xx). Permanent 4xx (validation, outside-radius, auth)
 *      never retry — retrying only burns the user's data.
 *   4. Offline short-circuit so "no signal at all" gives an instant, honest
 *      message instead of a timeout wait.
 */

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type SubmitOutcome<T> =
  | { ok: true; data: T | undefined; deduplicated: boolean }
  | { ok: false; status: number; error: string; retriable: boolean };

export interface SubmitDeps {
  fetchImpl?: typeof fetch;
  /** Per-attempt timeout in ms (default 45s — generous for slow cellular). */
  timeoutMs?: number;
  /** Total attempts including the first (default 3). */
  maxAttempts?: number;
  /** Backoff before the Nth retry (1-indexed); default 800ms, 1600ms, … */
  backoffMs?: (retryIndex: number) => number;
  isOnline?: () => boolean;
  sleep?: (ms: number) => Promise<void>;
}

const DEFAULT_TIMEOUT_MS = 45_000;
const DEFAULT_MAX_ATTEMPTS = 3;
const defaultBackoff = (retryIndex: number) => 800 * 2 ** (retryIndex - 1);
const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** 4xx that CAN succeed on retry — everything else in 4xx is permanent. */
function isRetriableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

export async function submitAttendanceWithRetry<T>(
  url: string,
  formData: FormData,
  idempotencyKey: string,
  extraHeaders: Record<string, string> = {},
  deps: SubmitDeps = {},
): Promise<SubmitOutcome<T>> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxAttempts = deps.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const backoffMs = deps.backoffMs ?? defaultBackoff;
  const sleep = deps.sleep ?? defaultSleep;
  const isOnline = deps.isOnline ?? (() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  if (!isOnline()) {
    return { ok: false, status: 0, error: 'Tidak ada koneksi internet. Cek sinyal atau data Anda.', retriable: true };
  }

  let lastError: SubmitOutcome<T> = {
    ok: false,
    status: 0,
    error: 'Absensi belum terkirim. Coba lagi.',
    retriable: true,
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey, ...extraHeaders },
        body: formData,
        signal: controller.signal,
      });

      // A retry that the server already processed returns 409 "sedang diproses"
      // — the clock event is safely recorded, so treat it as success.
      if (response.status === 409) {
        return { ok: true, data: undefined, deduplicated: true };
      }

      let payload: ApiEnvelope<T> | null = null;
      try {
        payload = (await response.json()) as ApiEnvelope<T>;
      } catch {
        payload = null;
      }

      if (response.ok && payload?.success) {
        return { ok: true, data: payload.data, deduplicated: false };
      }

      const message = payload?.error || payload?.message || 'Gagal menyimpan absensi';
      const retriable = isRetriableStatus(response.status);
      lastError = { ok: false, status: response.status, error: message, retriable };

      // Permanent client error (validation, outside-radius, auth) — stop now.
      if (!retriable) return lastError;
    } catch (error) {
      // Network failure or our own timeout-abort — both transient.
      const aborted = error instanceof DOMException && error.name === 'AbortError';
      lastError = {
        ok: false,
        status: 0,
        error: aborted
          ? 'Koneksi lambat, absensi belum terkirim. Coba lagi di sinyal yang lebih baik.'
          : 'Jaringan bermasalah, absensi belum terkirim. Coba lagi.',
        retriable: true,
      };
    } finally {
      clearTimeout(timer);
    }

    if (attempt < maxAttempts) {
      await sleep(backoffMs(attempt));
    }
  }

  return lastError;
}
