import { db, emailLogs } from '@/lib/db';

export type EmailTemplate = 'register' | 'forgot-password' | 'reset-password' | 'role-changed' | 'account-approved' | 'notification-center';
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
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
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
  const bodyHtml = input.body
    .map((paragraph) => `<p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.7;">${paragraph}</p>`)
    .join('');
  const ctaHtml = input.cta
    ? `<div style="margin:26px 0 10px;"><a href="${escapeHtml(input.cta.url)}" style="display:inline-block;background:#FFC107;color:#111111;text-decoration:none;font-weight:800;font-size:14px;padding:14px 22px;border-radius:12px;border:1px solid #E5AE06;box-shadow:0 8px 24px rgba(17,17,17,0.08);">${escapeHtml(input.cta.label)}</a></div>`
    : '';
  const fallbackLink = input.cta
    ? `<p style="margin:14px 0 0;color:#6B7280;font-size:12px;line-height:1.6;">Jika tombol tidak bisa dibuka, salin tautan ini:<br><a href="${escapeHtml(input.cta.url)}" style="color:#B51B19;word-break:break-all;">${escapeHtml(input.cta.url)}</a></p>`
    : '';
  const noteHtml = input.note
    ? `<div style="margin-top:22px;padding:14px 16px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:14px;color:#5F4200;font-size:13px;line-height:1.6;">${input.note}</div>`
    : '';

  return `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escapeHtml(input.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#FFF9E6;font-family:Poppins,Arial,'Helvetica Neue',Helvetica,sans-serif;color:#111111;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FFF9E6;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#FFFFFF;border-radius:20px;overflow:hidden;border:1px solid #E5E7EB;box-shadow:0 8px 24px rgba(17,17,17,0.08);">
            <tr>
              <td style="background:#FFC107;padding:22px 28px 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <table role="presentation" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="vertical-align:middle;padding-right:10px;"><img src="${escapeHtml(logoUrl)}" width="44" height="44" alt="MyProdusen" style="display:block;width:44px;height:44px;border:0;object-fit:contain;"></td>
                          <td style="vertical-align:middle;">
                            <div style="font-size:24px;font-weight:900;letter-spacing:-0.5px;color:#111111;line-height:1;">My<span style="color:#FFFFFF;text-shadow:0 1px 0 rgba(17,17,17,0.12);">Produsen</span></div>
                            <div style="margin-top:5px;font-size:11px;font-weight:700;color:#4B5563;">${companyName}</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <div style="display:inline-block;background:#111111;color:#FFC107;border-radius:999px;padding:8px 12px;font-size:11px;font-weight:800;letter-spacing:0.04em;">by TBM Group</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 28px 28px;">
                <div style="display:inline-block;margin-bottom:12px;padding:7px 11px;border-radius:999px;background:#FFF7CC;color:#8A6400;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.04em;">${escapeHtml(input.eyebrow)}</div>
                <h1 style="margin:0 0 12px;color:#111111;font-size:24px;line-height:1.25;font-weight:900;">${escapeHtml(input.title)}</h1>
                <p style="margin:0 0 18px;color:#111111;font-size:16px;line-height:1.7;font-weight:700;">${escapeHtml(input.intro)}</p>
                ${bodyHtml}
                ${ctaHtml}
                ${fallbackLink}
                ${noteHtml}
              </td>
            </tr>
            <tr>
              <td style="background:#FFF9E6;border-top:1px solid #E5E7EB;padding:20px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="vertical-align:top;width:42px;"><img src="${escapeHtml(logoUrl)}" width="34" height="34" alt="" style="display:block;width:34px;height:34px;border:0;object-fit:contain;"></td>
                    <td style="vertical-align:top;">
                      <p style="margin:0 0 5px;color:#111111;font-size:13px;font-weight:800;">${appName}</p>
                      <p style="margin:0;color:#6B7280;font-size:12px;line-height:1.6;">Sistem internal perusahaan by TBM Group<br>${companyName}<br>Medan, Sumatera Utara</p>
                    </td>
                  </tr>
                </table>
                <p style="margin:14px 0 0;color:#6B7280;font-size:12px;line-height:1.6;">Email otomatis dari ${appName}. Jangan balas email ini. Jika butuh bantuan, hubungi HRD atau Superadmin.</p>
                <p style="margin:8px 0 0;color:#6B7280;font-size:11px;line-height:1.5;">Email ini bersifat internal. Mohon tidak membagikan informasi ini kepada pihak lain.</p>
                <p style="margin:12px 0 0;color:#9CA3AF;font-size:11px;line-height:1.5;">© ${appName} · <a href="${escapeHtml(appUrl)}" style="color:#6B7280;text-decoration:none;">${escapeHtml(appUrl)}</a></p>
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

export async function sendEmail(input: SendEmailInput) {
  requireProductionEmailConfig();

  if (!isEmailEnabled()) {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[email:disabled]', { to: input.to, subject: input.subject });
    }
    await logEmailAttempt(input, 'SKIPPED', { errorMessage: 'Email disabled outside production' });
    return { skipped: true };
  }

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

  if (!response.ok) {
    const detail = await response.text().catch(() => 'Unknown Resend error');
    await logEmailAttempt(input, 'FAILED', { errorMessage: detail });
    console.error('[email:resend-error]', { to: input.to, subject: input.subject, detail });
    throw new Error(`Gagal mengirim email via Resend: ${detail}`);
  }

  const result = await response.json();
  await logEmailAttempt(input, 'SENT', { providerMessageId: typeof result?.id === 'string' ? result.id : null });
  console.info('[email:sent]', { to: input.to, subject: input.subject, id: result?.id });
  return result;
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
}

export async function sendAuthEmail(template: EmailTemplate, to: string, data: Record<string, string> = {}) {
  const appUrl = getAppUrl();
  const loginUrl = `${appUrl}/login`;
  const displayName = data.name ? `, ${data.name}` : '';
  const isActivationRegister = template === 'register' && Boolean(data.activationUrl);
  const templates: Record<EmailTemplate, SendEmailInput> = {
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
              'Akun MyProdusen Anda sudah terdaftar. Setelah akun aktif, Anda bisa login untuk absensi, cek jadwal, ajukan cuti, dan melihat informasi kerja penting.',
              'Satu sistem, banyak manfaat: data lebih tertata, kerja lebih tenang, tim lebih kompak.',
            ],
        cta: { label: isActivationRegister ? 'Aktivasi Akun' : 'Buka MyProdusen', url: isActivationRegister ? data.activationUrl : loginUrl },
        note: isActivationRegister ? 'Link aktivasi berlaku 24 jam. Jika link kedaluwarsa, daftar ulang atau hubungi HRD/Superadmin.' : 'Jika akun belum bisa digunakan, tunggu aktivasi dari HRD atau Superadmin.',
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
    'notification-center': {
      to,
      template,
      metadata: { name: data.name || null },
      subject: `${appName} - Pusat Notifikasi Anda`,
      html: renderEmail({
        eyebrow: 'Pusat notifikasi',
        title: 'Pusat Notifikasi Anda',
        intro: `Halo${displayName || ', Tim'}! Berikut ringkasan notifikasi terbaru yang perlu Anda ketahui.`,
        body: [
          '<strong>Cuti Disetujui</strong><br>Pengajuan cuti Anda telah disetujui oleh atasan.',
          '<strong>Akun Ditugaskan</strong><br>Super Admin telah menugaskan akses kerja Anda di MyProdusen.',
          '<strong>Pengingat Kehadiran</strong><br>Jangan lupa melakukan check-in sesuai jam kerja.',
        ],
        cta: { label: 'Buka MyProdusen', url: loginUrl },
        note: 'Notifikasi penting tetap tersimpan di pusat notifikasi aplikasi.',
        text: `Pusat Notifikasi Anda. Buka MyProdusen: ${loginUrl}`,
      }),
      text: `Pusat Notifikasi Anda. Buka MyProdusen: ${loginUrl}`,
    },
  };

  return sendEmail(templates[template]);
}
