/**
 * Safe response parsing for client-side auth/API calls.
 *
 * Prevents crashes like:
 *   "Failed to execute 'json' on 'Response': Unexpected token '<', "<!DOCTYPE "... is not valid JSON"
 *
 * This happens when an endpoint returns HTML (404 page, proxy redirect, gateway/500 page,
 * offline cache) instead of JSON. Instead of calling response.json() blindly, we inspect the
 * content-type and fall back to a clean, user-facing error.
 */
export interface SafeJsonResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  /** Raw text when the body was not valid JSON (truncated). */
  rawText?: string;
}

export async function parseJsonResponse<T = unknown>(response: Response): Promise<SafeJsonResult<T>> {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (isJson) {
    try {
      const data = (await response.json()) as T;
      return { ok: response.ok, status: response.status, data };
    } catch {
      // Declared JSON but body was empty or malformed.
      return { ok: response.ok, status: response.status, data: null };
    }
  }

  // Non-JSON body (HTML error page, redirect, plain text). Read as text for diagnostics.
  let rawText = '';
  try {
    rawText = await response.text();
  } catch {
    rawText = '';
  }

  return {
    ok: response.ok,
    status: response.status,
    data: null,
    rawText: rawText.slice(0, 200),
  };
}

/**
 * Maps a non-JSON / failed auth response to a stable, Indonesian user-facing message.
 */
export function messageForHttpStatus(status: number, fallback: string): string {
  if (status === 0) return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
  if (status === 401) return 'Sesi tidak valid. Silakan masuk kembali.';
  if (status === 403) return 'Permintaan tidak valid atau akses ditolak. Muat ulang halaman lalu coba lagi.';
  if (status === 404) return 'Layanan tidak ditemukan. Muat ulang halaman lalu coba lagi.';
  if (status === 429) return 'Terlalu banyak percobaan. Coba lagi beberapa saat.';
  if (status >= 500) return 'Server sedang bermasalah. Coba lagi beberapa saat.';
  return fallback;
}
