import { beforeEach, describe, expect, it, vi } from 'vitest';

const valuesMock = vi.fn();
const insertMock = vi.fn(() => ({ values: valuesMock }));

vi.mock('@/lib/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db')>();
  return {
    ...actual,
    db: {
      insert: insertMock,
    },
  };
});

describe('email send logging', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.RESEND_FROM_EMAIL = 'MyProdusen <noreply@example.com>';
  });

  it('stores sent email log with provider id and metadata', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'email_123' }),
    }));

    const { sendAuthEmail } = await import('@/lib/email');
    await sendAuthEmail('forgot-password', 'user@example.com', {
      resetUrl: 'https://myprodusen.online/reset-password?token=abc',
    });

    expect(insertMock).toHaveBeenCalled();
    expect(valuesMock).toHaveBeenCalledWith(expect.objectContaining({
      template: 'forgot-password',
      recipient: 'user@example.com',
      status: 'SENT',
      provider: 'resend',
      providerMessageId: 'email_123',
      errorMessage: null,
    }));
  });

  it('stores failed email log before throwing safe resend error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      text: async () => 'domain not verified',
    }));

    const { sendAuthEmail } = await import('@/lib/email');
    await expect(sendAuthEmail('register', 'user@example.com', { name: 'Deni' })).rejects.toThrow('Gagal mengirim email via Resend');

    expect(valuesMock).toHaveBeenCalledWith(expect.objectContaining({
      template: 'register',
      recipient: 'user@example.com',
      status: 'FAILED',
      provider: 'resend',
      providerMessageId: null,
      errorMessage: 'domain not verified',
    }));
  });

  it('retries transient failures (5xx) then logs the eventual success', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 503, text: async () => 'service unavailable' })
      .mockResolvedValueOnce({ ok: false, status: 429, text: async () => 'rate limited' })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'email_retry_ok' }) });
    vi.stubGlobal('fetch', fetchMock);

    const { sendAuthEmail } = await import('@/lib/email');
    await sendAuthEmail('forgot-password', 'user@example.com', {
      resetUrl: 'https://myprodusen.online/reset-password?token=abc',
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(valuesMock).toHaveBeenCalledWith(expect.objectContaining({
      status: 'SENT',
      providerMessageId: 'email_retry_ok',
    }));
  });

  it('does not retry permanent client errors (4xx)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 422, text: async () => 'invalid recipient' });
    vi.stubGlobal('fetch', fetchMock);

    const { sendAuthEmail } = await import('@/lib/email');
    await expect(sendAuthEmail('register', 'user@example.com', { name: 'Deni' })).rejects.toThrow('Gagal mengirim email via Resend');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(valuesMock).toHaveBeenCalledWith(expect.objectContaining({
      status: 'FAILED',
      errorMessage: 'invalid recipient',
    }));
  });
});
