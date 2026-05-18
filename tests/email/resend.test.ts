import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isEmailEnabled, sendAuthEmail, sendEmail } from '@/lib/email';

describe('Resend email integration', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  it('sends email through Resend API when configured', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.RESEND_FROM_EMAIL = 'MyProdusen <noreply@example.com>';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'email_123' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await sendEmail({
      to: 'user@example.com',
      subject: 'Subject',
      html: '<p>Hello</p>',
      text: 'Hello',
    });

    expect(isEmailEnabled()).toBe(true);
    expect(result).toEqual({ id: 'email_123' });
    expect(fetchMock).toHaveBeenCalledWith('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer re_test_key',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MyProdusen <noreply@example.com>',
        to: 'user@example.com',
        subject: 'Subject',
        html: '<p>Hello</p>',
        text: 'Hello',
      }),
    });
  });

  it('sends forgot password reset link through Resend template', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.RESEND_FROM_EMAIL = 'MyProdusen <noreply@example.com>';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'email_456' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await sendAuthEmail('forgot-password', 'user@example.com', {
      resetUrl: 'https://myprodusen.online/reset-password?token=abc',
    });

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.to).toBe('user@example.com');
    expect(payload.subject).toContain('Reset password');
    expect(payload.html).toContain('https://myprodusen.online/reset-password?token=abc');
  });

  it('uses MyProdusen branded header, CTA, footer, and warm copy for welcome email', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.RESEND_FROM_EMAIL = 'MyProdusen <noreply@example.com>';
    process.env.APP_URL = 'https://myprodusen.online';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'email_789' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await sendAuthEmail('register', 'user@example.com', { name: 'Deni' });

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.html).toContain('background:#FFC107');
    expect(payload.html).toContain('https://myprodusen.online/logo-fast.webp');
    expect(payload.html).toContain('MyProdusen');
    expect(payload.html).toContain('Produsen Dimsum Medan');
    expect(payload.html).toContain('by TBM Group');
    expect(payload.html).toContain('Medan, Sumatera Utara');
    expect(payload.html).toContain('Semangat kerja dimulai dari langkah kecil yang rapi');
    expect(payload.html).toContain('Buka MyProdusen');
    expect(payload.html).toContain('© MyProdusen');
    expect(payload.text).toContain('Akun Anda berhasil dibuat');
  });

  it('renders reset password email with branded CTA and security footer', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.RESEND_FROM_EMAIL = 'MyProdusen <noreply@example.com>';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'email_790' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await sendAuthEmail('forgot-password', 'user@example.com', {
      resetUrl: 'https://myprodusen.online/reset-password?token=abc',
    });

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.html).toContain('Reset Password');
    expect(payload.html).toContain('Atur ulang password');
    expect(payload.html).toContain('Link berlaku 30 menit');
    expect(payload.html).toContain('Jika Anda tidak meminta reset password');
    expect(payload.html).toContain('https://myprodusen.online/reset-password?token=abc');
  });

  it('renders notification-center template like the reference email system', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.RESEND_FROM_EMAIL = 'MyProdusen <noreply@example.com>';
    process.env.APP_URL = 'https://myprodusen.online';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'email_791' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await sendAuthEmail('notification-center', 'user@example.com', { name: 'Deni Lesmana' });

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.subject).toContain('Pusat Notifikasi');
    expect(payload.html).toContain('Pusat Notifikasi Anda');
    expect(payload.html).toContain('Cuti Disetujui');
    expect(payload.html).toContain('Pengingat Kehadiran');
    expect(payload.html).toContain('Buka MyProdusen');
  });
});
