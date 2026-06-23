import { describe, it, expect } from 'vitest';
import { parseJsonResponse, messageForHttpStatus } from './safe-json';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('messageForHttpStatus', () => {
  it('maps status 0 to a connection error', () => {
    expect(messageForHttpStatus(0, 'fb')).toContain('koneksi internet');
  });
  it('maps 401 to an invalid-session message', () => {
    expect(messageForHttpStatus(401, 'fb')).toContain('Sesi tidak valid');
  });
  it('maps 403 to an access-denied message', () => {
    expect(messageForHttpStatus(403, 'fb')).toContain('akses ditolak');
  });
  it('maps 404 to a service-not-found message', () => {
    expect(messageForHttpStatus(404, 'fb')).toContain('tidak ditemukan');
  });
  it('maps 429 to a rate-limit message', () => {
    expect(messageForHttpStatus(429, 'fb')).toContain('Terlalu banyak');
  });
  it('maps any 5xx to a server-problem message', () => {
    expect(messageForHttpStatus(500, 'fb')).toContain('Server sedang bermasalah');
    expect(messageForHttpStatus(503, 'fb')).toContain('Server sedang bermasalah');
  });
  it('returns the caller fallback for unmapped statuses', () => {
    expect(messageForHttpStatus(400, 'my fallback')).toBe('my fallback');
    expect(messageForHttpStatus(200, 'ok fallback')).toBe('ok fallback');
  });
});

describe('parseJsonResponse', () => {
  it('parses a valid JSON body', async () => {
    const r = await parseJsonResponse<{ a: number }>(jsonResponse({ a: 1 }, 200));
    expect(r).toEqual({ ok: true, status: 200, data: { a: 1 } });
  });

  it('returns data: null when content-type is JSON but the body is malformed', async () => {
    const bad = new Response('<not json>', {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
    const r = await parseJsonResponse(bad);
    expect(r.data).toBeNull();
    expect(r.ok).toBe(false);
    expect(r.status).toBe(500);
  });

  it('captures rawText truncated to 200 chars for a non-JSON HTML body', async () => {
    const html = '<!DOCTYPE html>' + 'x'.repeat(500);
    const r = await parseJsonResponse(
      new Response(html, { status: 404, headers: { 'content-type': 'text/html' } }),
    );
    expect(r.data).toBeNull();
    expect(r.status).toBe(404);
    expect(r.rawText).toHaveLength(200);
  });

  it('falls back to empty rawText when reading the body throws', async () => {
    const mock = {
      ok: false,
      status: 502,
      headers: { get: () => 'text/html' },
      text: async () => {
        throw new Error('stream error');
      },
    } as unknown as Response;
    const r = await parseJsonResponse(mock);
    expect(r).toEqual({ ok: false, status: 502, data: null, rawText: '' });
  });

  it('treats a missing content-type header as non-JSON', async () => {
    const mock = {
      ok: true,
      status: 200,
      headers: { get: () => null },
      text: async () => 'plain text body',
    } as unknown as Response;
    const r = await parseJsonResponse(mock);
    expect(r.data).toBeNull();
    expect(r.rawText).toBe('plain text body');
  });
});
