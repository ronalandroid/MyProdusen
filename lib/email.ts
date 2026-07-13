import { db, emailLogs } from '@/lib/db';
import { getCanonicalAppUrl } from '@/lib/app-url';
import { publishRealtimeEvent, createRealtimeEvent } from '@/lib/realtime/publisher';

type AuthEmailTemplate = 'register' | 'forgot-password' | 'reset-password' | 'role-changed' | 'account-approved';
export type EmailTemplate = AuthEmailTemplate | 'payslip-ready';
type UserEmailEvent = Extract<EmailTemplate, 'account-approved' | 'role-changed'>;
type EmailStatus = 'SKIPPED' | 'SENT' | 'FAILED';

interface UserEmailState {
  role: string;
  isActive: boolean;
}

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  template?: EmailTemplate | 'custom';
  metadata?: Record<string, unknown>;
}

interface BrandedEmailInput {
  eyebrow: string;
  title: string;
  intro: string;
  body: string[];
  cta?: {
    label: string;
    url: string;
  };
  note?: string;
  text: string;
}

const resendEndpoint = 'https://api.resend.com/emails';
const appName = 'MyProdusen';
const companyName = 'Produsen Dimsum Medan';

export function getUserEmailEvents(previous: UserEmailState, next: UserEmailState): UserEmailEvent[] {
  const events: UserEmailEvent[] = [];

  if (!previous.isActive && next.isActive) {
    events.push('account-approved');
  }

  if (previous.role !== next.role) {
    events.push('role-changed');
  }

  return events;
}

function getAppUrl() {
  return getCanonicalAppUrl();
}

function escapeHtml(value = '') {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderEmail(input: BrandedEmailInput) {
  const appUrl = getAppUrl();
  const logoUrl = `${appUrl}/logo-fast.webp`;
  const year = new Date().getFullYear();
  // App palette: primary #FFC107, text #111111, secondary #4B5563, warm surface
  // #FAF9F6, card #FFFFFF — matches the dashboard so the inbox feels on-brand.
  const bodyHtml = input.body
    .map((paragraph) => `<p style="margin:0 0 16px;color:#4B5563;font-size:15px;line-height:1.75;">${paragraph}</p>`)
    .join('');
  const ctaHtml = input.cta
    ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 6px;"><tr><td style="border-radius:14px;background:#FFC107;box-shadow:0 10px 24px rgba(255,193,7,0.30);"><a href="${escapeHtml(input.cta.url)}" style="display:inline-block;padding:15px 30px;color:#111111;text-decoration:none;font-weight:800;font-size:15px;border-radius:14px;">${escapeHtml(input.cta.label)} &nbsp;&rarr;</a></td></tr></table>`
    : '';
  const fallbackLink = input.cta
    ? `<p style="margin:16px 0 0;color:#9CA3AF;font-size:12px;line-height:1.6;">Tombol tidak terbuka? Salin &amp; tempel tautan ini ke browser:<br><a href="${escapeHtml(input.cta.url)}" style="color:#CC9A05;word-break:break-all;text-decoration:underline;">${escapeHtml(input.cta.url)}</a></p>`
    : '';
  const noteHtml = input.note
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;"><tr><td style="padding:14px 16px;background:#FFFBEB;border:1px solid #FDE68A;border-left:4px solid #FFC107;border-radius:12px;color:#7A5600;font-size:13px;line-height:1.65;">${input.note}</td></tr></table>`
    : '';

  return `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>${escapeHtml(input.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#FAF9F6;font-family:'Poppins',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#111111;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.intro)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FAF9F6;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;">
            <!-- Brand row -->
            <tr>
              <td style="padding:0 6px 18px;">
                <table role="presentation" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="vertical-align:middle;padding-right:11px;">
                      <span style="display:block;width:44px;height:44px;background:#FFC107;border-radius:13px;text-align:center;box-shadow:0 8px 18px rgba(255,193,7,0.32);">
                        <img src="${escapeHtml(logoUrl)}" width="30" height="30" alt="MyProdusen" style="display:block;width:30px;height:30px;border:0;object-fit:contain;margin:7px auto 0;">
                      </span>
                    </td>
                    <td style="vertical-align:middle;">
                      <div style="font-size:21px;font-weight:900;letter-spacing:-0.4px;color:#111111;line-height:1;">My<span style="color:#F5A800;">Produsen</span></div>
                      <div style="margin-top:3px;font-size:11px;font-weight:700;color:#8A8A8A;letter-spacing:0.02em;">${companyName}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Card -->
            <tr>
              <td style="background:#FFFFFF;border:1px solid #EFEAE0;border-radius:20px;box-shadow:0 14px 38px rgba(17,17,17,0.06);overflow:hidden;">
                <!-- Accent bar -->
                <div style="height:4px;background:#FFC107;line-height:4px;font-size:0;">&nbsp;</div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding:32px 32px 30px;">
                      <span style="display:inline-block;margin-bottom:14px;padding:6px 13px;border-radius:999px;background:#FFF8E1;color:#8A6D00;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;border:1px solid #FDE68A;">${escapeHtml(input.eyebrow)}</span>
                      <h1 style="margin:0 0 12px;color:#111111;font-size:25px;line-height:1.25;font-weight:900;letter-spacing:-0.3px;">${escapeHtml(input.title)}</h1>
                      <p style="margin:0 0 20px;color:#111111;font-size:16px;line-height:1.7;font-weight:600;">${escapeHtml(input.intro)}</p>
                      ${bodyHtml}
                      ${ctaHtml}
                      ${fallbackLink}
                      ${noteHtml}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:22px 10px 6px;">
                <p style="margin:0 0 4px;color:#6B7280;font-size:12px;line-height:1.6;font-weight:700;">${appName} &middot; <span style="font-weight:500;">by TBM Group</span></p>
                <p style="margin:0;color:#9CA3AF;font-size:12px;line-height:1.6;">${companyName}, Medan, Sumatera Utara</p>
                <p style="margin:12px 0 0;color:#9CA3AF;font-size:11px;line-height:1.6;">Email otomatis, mohon tidak dibalas. Butuh bantuan? Hubungi HRD atau Superadmin. Email ini bersifat internal; jangan dibagikan ke pihak lain.</p>
                <p style="margin:10px 0 0;color:#B8B8B8;font-size:11px;line-height:1.5;">&copy; ${year} ${appName} &middot; <a href="${escapeHtml(appUrl)}" style="color:#9CA3AF;text-decoration:none;">${escapeHtml(appUrl.replace(/^https?:\/\//, ''))}</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function isEmailEnabled() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

function requireProductionEmailConfig() {
  if (process.env.NODE_ENV !== 'production' || isEmailEnabled()) {
    return;
  }

  throw new Error('Email belum aktif. Set RESEND_API_KEY dan RESEND_FROM_EMAIL di Coolify.');
}

const MAX_SEND_ATTEMPTS = 3;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 429 (rate limited) and 5xx are transient — worth retrying. 4xx (bad request,
// invalid recipient) are permanent, so we fail fast.
function isTransientStatus(status: number) {
  return status === 429 || status >= 500;
}

export async function sendEmail(input: SendEmailInput) {
  requireProductionEmailConfig();

  if (!isEmailEnabled()) {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[email:disabled]', { to: input.to, subject: input.subject });
    }
    await logEmailAttempt(input, 'SKIPPED', { errorMessage: 'Email disabled outside production' });
    return { skipped: true };
  }

  let lastError = 'Unknown Resend error';

  for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(resendEndpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL,
          to: input.to,
          subject: input.subject,
          html: input.html,
          text: input.text,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        await logEmailAttempt(input, 'SENT', {
          providerMessageId: typeof result?.id === 'string' ? result.id : null,
        });
        console.info('[email:sent]', { to: input.to, subject: input.subject, id: result?.id, attempt });
        return result;
      }

      lastError = await response.text().catch(() => 'Unknown Resend error');
      // Permanent error — don't waste retries.
      if (!isTransientStatus(response.status)) break;
    } catch (error) {
      // Network/abort errors are transient.
      lastError = error instanceof Error ? error.message : 'Network error';
    }

    if (attempt < MAX_SEND_ATTEMPTS) {
      await sleep(attempt * 400); // backoff: 400ms, then 800ms
    }
  }

  await logEmailAttempt(input, 'FAILED', { errorMessage: lastError });
  console.error('[email:resend-error]', { to: input.to, subject: input.subject, detail: lastError });
  throw new Error(`Gagal mengirim email via Resend: ${lastError}`);
}

async function logEmailAttempt(
  input: SendEmailInput,
  status: EmailStatus,
  result: { providerMessageId?: string | null; errorMessage?: string | null } = {},
) {
  try {
    await db.insert(emailLogs).values({
      id: crypto.randomUUID(),
      template: input.template || 'custom',
      recipient: input.to,
      subject: input.subject,
      provider: 'resend',
      providerMessageId: result.providerMessageId || null,
      status,
      errorMessage: result.errorMessage || null,
      metadata: input.metadata || null,
      updatedAt: new Date(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown email log error';
    console.error('[email:log-error]', { status, template: input.template || 'custom', message });
  }

  // Realtime: the admin Log Email page listens for email.* sources so failed
  // sends surface immediately. Never let a Redis hiccup break email sending.
  await publishRealtimeEvent(createRealtimeEvent({
    type: 'dashboard.updated', scope: 'role', target: 'SUPERADMIN',
    payload: { source: `email.${status.toLowerCase()}`, template: input.template || 'custom' },
  })).catch(() => undefined);
}

/**
 * Notify one employee that their payslip for a period is ready. Deliberately
 * amount-free: salary figures stay behind login at /dashboard/payroll/me.
 */
export async function sendPayslipEmail(to: string, data: { name?: string; period: string }) {
  const appUrl = getAppUrl();
  const payslipUrl = `${appUrl}/dashboard/payroll/me`;
  const displayName = data.name ? `, ${data.name}` : '';
  const text = `Slip gaji periode ${data.period} sudah tersedia. Lihat: ${payslipUrl}`;

  return sendEmail({
    to,
    template: 'payslip-ready',
    metadata: { period: data.period },
    subject: `${appName} - Slip gaji ${data.period} tersedia`,
    html: renderEmail({
      eyebrow: 'Slip gaji',
      title: `Slip gaji ${data.period} sudah tersedia`,
      intro: `Halo${displayName}! Payroll periode ${data.period} sudah disetujui.`,
      body: [
        'Slip gaji Anda sudah bisa dilihat dan diunduh dari halaman Payroll Saya setelah login.',
        'Demi keamanan, rincian gaji tidak dicantumkan di email ini.',
      ],
      cta: { label: 'Lihat slip gaji', url: payslipUrl },
      note: 'Ada pertanyaan tentang perhitungan gaji? Hubungi HRD atau Superadmin.',
      text,
    }),
    text,
  });
}

export async function sendAuthEmail(template: AuthEmailTemplate, to: string, data: Record<string, string> = {}) {
  const appUrl = getAppUrl();
  const loginUrl = `${appUrl}/login`;
  const displayName = data.name ? `, ${data.name}` : '';
  const isActivationRegister = template === 'register' && Boolean(data.activationUrl);
  const templates: Record<AuthEmailTemplate, SendEmailInput> = {
    register: {
      to,
      template,
      metadata: { name: data.name || null, hasActivationUrl: Boolean(data.activationUrl) },
      subject: isActivationRegister ? `${appName} - Aktivasi akun Anda` : `${appName} - Akun Anda berhasil dibuat`,
      html: renderEmail({
        eyebrow: isActivationRegister ? 'Aktivasi akun' : 'Selamat datang',
        title: isActivationRegister ? 'Selamat Bergabung di MyProdusen!' : 'Akun Anda berhasil dibuat',
        intro: isActivationRegister ? `Halo${displayName}! Akun Anda sudah dibuat dan tinggal satu langkah untuk aktif.` : `Halo${displayName}! Semangat kerja dimulai dari langkah kecil yang rapi.`,
        body: isActivationRegister
          ? [
              'Klik tombol aktivasi di bawah agar akun Anda bisa digunakan untuk login, absensi, cek jadwal, ajukan cuti, dan melihat informasi kerja penting.',
              'Setelah aktivasi, akun otomatis masuk daftar user aktif sehingga Superadmin dapat menempatkan role, posisi, dan akses kerja yang tepat.',
            ]
          : [
              'Akun MyProdusen Anda sudah AKTIF. Langsung login untuk absensi, cek jadwal, ajukan cuti, dan melihat informasi kerja penting.',
              'Satu sistem, banyak manfaat: data lebih tertata, kerja lebih tenang, tim lebih kompak.',
            ],
        cta: { label: isActivationRegister ? 'Aktivasi Akun' : data.verifyUrl ? 'Verifikasi Email Saya' : 'Buka MyProdusen', url: isActivationRegister ? data.activationUrl : (data.verifyUrl || loginUrl) },
        note: isActivationRegister ? 'Link aktivasi berlaku 24 jam. Jika link kedaluwarsa, daftar ulang atau hubungi HRD/Superadmin.' : data.verifyUrl ? 'Verifikasi email bersifat opsional tapi disarankan — memastikan slip gaji selalu sampai ke inbox Anda. Data Anda akan diverifikasi Superadmin.' : 'Data Anda akan diverifikasi Superadmin. Ada kendala login? Hubungi HRD/Superadmin.',
        text: isActivationRegister ? `Aktivasi akun MyProdusen Anda: ${data.activationUrl}` : `Akun Anda berhasil dibuat. Login: ${loginUrl}`,
      }),
      text: isActivationRegister ? `Aktivasi akun MyProdusen Anda: ${data.activationUrl}` : `Akun Anda berhasil dibuat. Login: ${loginUrl}`,
    },
    'forgot-password': {
      to,
      template,
      metadata: { hasResetUrl: Boolean(data.resetUrl) },
      subject: `${appName} - Reset password`,
      html: renderEmail({
        eyebrow: 'Keamanan akun',
        title: 'Reset Password',
        intro: 'Tenang, kita bantu atur ulang password Anda.',
        body: [
          'Klik tombol di bawah untuk membuat password baru dan kembali bekerja lebih produktif hari ini.',
          'Link berlaku 30 menit demi keamanan akun Anda.',
        ],
        cta: { label: 'Atur ulang password', url: data.resetUrl },
        note: 'Jika Anda tidak meminta reset password, abaikan email ini dan segera hubungi Superadmin bila ada aktivitas mencurigakan.',
        text: `Reset password: ${data.resetUrl}. Link berlaku 30 menit.`,
      }),
      text: `Reset password: ${data.resetUrl}. Link berlaku 30 menit.`,
    },
    'reset-password': {
      to,
      template,
      subject: `${appName} - Password berhasil diubah`,
      html: renderEmail({
        eyebrow: 'Password aman',
        title: 'Password berhasil diubah',
        intro: 'Mantap, akun Anda sudah kembali aman.',
        body: [
          'Anda bisa login lagi menggunakan password baru. Simpan password dengan aman dan jangan bagikan kepada siapa pun.',
          'Kerja lancar dimulai dari akun yang aman.',
        ],
        cta: { label: 'Login sekarang', url: loginUrl },
        note: 'Jika perubahan ini bukan dari Anda, hubungi Superadmin segera.',
        text: `Password akun Anda berhasil diubah. Login: ${loginUrl}`,
      }),
      text: `Password akun Anda berhasil diubah. Login: ${loginUrl}`,
    },
    'role-changed': {
      to,
      template,
      metadata: { role: data.role || null },
      subject: `${appName} - Role akun diperbarui`,
      html: renderEmail({
        eyebrow: 'Akses diperbarui',
        title: 'Role akun Anda diperbarui',
        intro: `Role akun Anda sekarang: ${data.role}.`,
        body: [
          'Menu dan fitur di MyProdusen akan menyesuaikan akses baru Anda secara otomatis.',
          'Gunakan akses ini dengan teliti agar kerja tim makin rapi dan cepat.',
        ],
        cta: { label: 'Cek akses saya', url: loginUrl },
        note: 'Jika role terasa tidak sesuai, hubungi HRD atau Superadmin.',
        text: `Role akun Anda diperbarui menjadi ${data.role}. Login: ${loginUrl}`,
      }),
      text: `Role akun Anda diperbarui menjadi ${data.role}. Login: ${loginUrl}`,
    },
    'account-approved': {
      to,
      template,
      subject: `${appName} - Akun aktif`,
      html: renderEmail({
        eyebrow: 'Akun aktif',
        title: 'Akun Anda sudah aktif',
        intro: 'Selamat datang di ritme kerja yang lebih tertata.',
        body: [
          'Akun Anda sudah bisa digunakan untuk login ke MyProdusen.',
          'Cek kehadiran, cuti, KPI, dan notifikasi kerja dari satu tempat. Ringkas, jelas, siap bantu hari Anda.',
        ],
        cta: { label: 'Mulai bekerja', url: loginUrl },
        note: 'Pastikan data profil Anda benar setelah login pertama.',
        text: `Akun Anda sudah aktif. Login: ${loginUrl}`,
      }),
      text: `Akun Anda sudah aktif. Login: ${loginUrl}`,
    },
  };

  return sendEmail(templates[template]);
}
