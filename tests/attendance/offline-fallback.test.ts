import { describe, expect, it } from 'vitest';
import { shouldQueueOffline } from '@/lib/attendance/offline-fallback';
import type { SubmitOutcome } from '@/lib/attendance/submit-attendance';

describe('shouldQueueOffline', () => {
  it('does NOT queue a successful submit', () => {
    expect(shouldQueueOffline({ ok: true, data: {}, deduplicated: false })).toBe(false);
  });

  it('does NOT queue a deduplicated success (server already has it)', () => {
    expect(shouldQueueOffline({ ok: true, data: undefined, deduplicated: true })).toBe(false);
  });

  it('queues a status-0 network/offline failure', () => {
    const offline: SubmitOutcome<unknown> = { ok: false, status: 0, error: 'Tidak ada koneksi', retriable: true };
    expect(shouldQueueOffline(offline)).toBe(true);
  });

  it('does NOT queue a real server rejection (outside radius / late reason)', () => {
    const rejected: SubmitOutcome<unknown> = { ok: false, status: 400, error: 'Tulis alasan', retriable: false };
    expect(shouldQueueOffline(rejected)).toBe(false);
  });

  it('does NOT queue an auth failure', () => {
    const unauth: SubmitOutcome<unknown> = { ok: false, status: 401, error: 'Unauthorized', retriable: false };
    expect(shouldQueueOffline(unauth)).toBe(false);
  });

  it('does NOT queue a 5xx (retriable online, but a server DID answer)', () => {
    const serverErr: SubmitOutcome<unknown> = { ok: false, status: 503, error: 'Server sibuk', retriable: true };
    expect(shouldQueueOffline(serverErr)).toBe(false);
  });
});
