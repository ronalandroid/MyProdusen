import { describe, it, expect, vi } from 'vitest';
import { submitAttendanceWithRetry } from '@/lib/attendance/submit-attendance';

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

const noSleep = () => Promise.resolve();
const url = '/api/attendance/check-in';

function form() {
  const f = new FormData();
  f.set('type', 'clock-in');
  return f;
}

describe('submitAttendanceWithRetry', () => {
  it('returns success on a 200 first try and sends the idempotency key', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, { success: true, data: { id: 'a1' } }));

    const result = await submitAttendanceWithRetry(url, form(), 'key-123', {}, { fetchImpl, sleep: noSleep, isOnline: () => true });

    expect(result).toEqual({ ok: true, data: { id: 'a1' }, deduplicated: false });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const headers = (fetchImpl.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers['Idempotency-Key']).toBe('key-123');
  });

  it('retries on a 5xx and succeeds, reusing the SAME idempotency key', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(503, { success: false, error: 'server down' }))
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: { id: 'a2' } }));

    const result = await submitAttendanceWithRetry(url, form(), 'key-abc', {}, { fetchImpl, sleep: noSleep, isOnline: () => true });

    expect(result.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const key1 = (fetchImpl.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    const key2 = (fetchImpl.mock.calls[1][1] as RequestInit).headers as Record<string, string>;
    expect(key1['Idempotency-Key']).toBe('key-abc');
    expect(key2['Idempotency-Key']).toBe('key-abc'); // safe because server dedups
  });

  it('does NOT retry a permanent 4xx (outside radius / validation)', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(400, { success: false, error: 'Di luar radius' }));

    const result = await submitAttendanceWithRetry(url, form(), 'key-x', {}, { fetchImpl, sleep: noSleep, isOnline: () => true });

    expect(result).toMatchObject({ ok: false, status: 400, retriable: false, error: 'Di luar radius' });
    expect(fetchImpl).toHaveBeenCalledTimes(1); // no wasted mobile-data retry
  });

  it('treats a 409 (already processed) as success — no double clock-in', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(409, { success: false, error: 'Permintaan sedang diproses' }));

    const result = await submitAttendanceWithRetry(url, form(), 'key-dup', {}, { fetchImpl, sleep: noSleep, isOnline: () => true });

    expect(result).toEqual({ ok: true, data: undefined, deduplicated: true });
  });

  it('retries on a network error then gives up after maxAttempts', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    const result = await submitAttendanceWithRetry(
      url,
      form(),
      'key-net',
      {},
      { fetchImpl, sleep: noSleep, isOnline: () => true, maxAttempts: 3 },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.retriable).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('aborts a hung request after the timeout and retries', async () => {
    const fetchImpl = vi
      .fn()
      // First call: never resolves until aborted → reject with AbortError.
      .mockImplementationOnce((_url: string, init: RequestInit) => {
        return new Promise((_resolve, reject) => {
          (init.signal as AbortSignal).addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        });
      })
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: { id: 'a3' } }));

    const result = await submitAttendanceWithRetry(
      url,
      form(),
      'key-timeout',
      {},
      { fetchImpl, sleep: noSleep, isOnline: () => true, timeoutMs: 10 },
    );

    expect(result.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('short-circuits immediately when offline (no wasted timeout wait)', async () => {
    const fetchImpl = vi.fn();

    const result = await submitAttendanceWithRetry(url, form(), 'key-off', {}, { fetchImpl, sleep: noSleep, isOnline: () => false });

    expect(result).toMatchObject({ ok: false, status: 0, retriable: true });
    if (!result.ok) expect(result.error).toMatch(/koneksi|internet|sinyal/i);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
