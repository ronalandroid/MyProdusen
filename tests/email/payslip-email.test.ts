import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sendPayslipEmail } from '@/lib/email';
import { sendPayslipEmailsForRun } from '@/lib/payroll/payslip-email';

describe('payslip email', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.RESEND_FROM_EMAIL = 'MyProdusen <noreply@example.com>';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  function okFetch() {
    return vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'email_ok' }) });
  }

  it('sends a payslip-ready email pointing at the employee payslip page', async () => {
    const fetchMock = okFetch();
    vi.stubGlobal('fetch', fetchMock);

    await sendPayslipEmail('worker@example.com', { name: 'Budi', period: '2026-07' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.to).toBe('worker@example.com');
    expect(body.subject).toContain('2026-07');
    expect(body.subject).toMatch(/slip gaji/i);
    expect(body.html).toContain('/dashboard/payroll/me');
  });

  it('never puts salary amounts in the email body (payslip lives behind login)', async () => {
    const fetchMock = okFetch();
    vi.stubGlobal('fetch', fetchMock);

    await sendPayslipEmail('worker@example.com', { name: 'Budi', period: '2026-07' });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.html).not.toMatch(/Rp\s?\d/);
    expect(body.text).not.toMatch(/Rp\s?\d/);
  });

  it('sends sequentially per employee and keeps going after a permanent failure', async () => {
    const fetchMock = vi
      .fn()
      // first recipient: permanent 400 → no retry, counted as failed
      .mockResolvedValueOnce({ ok: false, status: 400, text: async () => 'invalid recipient' })
      // second recipient: success
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'email_2' }) });
    vi.stubGlobal('fetch', fetchMock);

    const result = await sendPayslipEmailsForRun('2026-07', [
      { employee: { email: 'bad@example.com', fullName: 'Gagal' } },
      { employee: { email: 'good@example.com', fullName: 'Sukses' } },
    ]);

    expect(result).toEqual({ sent: 1, failed: 1, skipped: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstTo = JSON.parse(fetchMock.mock.calls[0][1].body).to;
    const secondTo = JSON.parse(fetchMock.mock.calls[1][1].body).to;
    expect(firstTo).toBe('bad@example.com');
    expect(secondTo).toBe('good@example.com');
  });

  it('skips employees without an email address', async () => {
    const fetchMock = okFetch();
    vi.stubGlobal('fetch', fetchMock);

    const result = await sendPayslipEmailsForRun('2026-07', [
      { employee: { email: null, fullName: 'Tanpa Email' } },
      { employee: { email: 'good@example.com', fullName: 'Sukses' } },
    ]);

    expect(result).toEqual({ sent: 1, failed: 0, skipped: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
