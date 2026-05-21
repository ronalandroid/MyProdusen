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
});
