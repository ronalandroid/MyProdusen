export type EmailTemplate = 'register' | 'forgot-password' | 'reset-password' | 'role-changed' | 'account-approved';

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
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
  const bodyHtml = input.body
    .map((paragraph) => `<p style="margin:0 0 14px;color:#374151;font-size:15px;line-height:1.7;">${paragraph}</p>`)
    .join('');
  const ctaHtml = input.cta
    ? `<div style="margin:26px 0 10px;"><a href="${escapeHtml(input.cta.url)}" style="display:inline-block;background:#FDC704;color:#111111;text-decoration:none;font-weight:800;font-size:14px;padding:14px 22px;border-radius:14px;border:1px solid #E5B800;box-shadow:0 8px 18px rgba(253,199,4,0.25);">${escapeHtml(input.cta.label)}</a></div>`
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
  <body style="margin:0;padding:0;background:#F5F5F5;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;color:#111111;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F5F5F5;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#FFFFFF;border-radius:24px;overflow:hidden;border:1px solid #E5E3E6;box-shadow:0 18px 48px rgba(17,17,17,0.08);">
            <tr>
              <td style="background:#FDC704;padding:26px 28px 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <div style="font-size:28px;font-weight:900;letter-spacing:-0.5px;color:#111111;line-height:1;">My<span style="color:#FFFFFF;text-shadow:0 1px 0 rgba(17,17,17,0.12);">Produsen</span></div>
                      <div style="margin-top:7px;font-size:13px;font-weight:700;color:#4B5563;">${companyName}</div>
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <div style="display:inline-block;background:#111111;color:#FDC704;border-radius:999px;padding:8px 12px;font-size:12px;font-weight:800;">HRIS</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 28px 28px;">
                <div style="display:inline-block;margin-bottom:12px;padding:7px 11px;border-radius:999px;background:#FFF7CC;color:#8A6400;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.04em;">${escapeHtml(input.eyebrow)}</div>
                <h1 style="margin:0 0 12px;color:#111111;font-size:25px;line-height:1.25;font-weight:900;">${escapeHtml(input.title)}</h1>
                <p style="margin:0 0 18px;color:#111111;font-size:16px;line-height:1.7;font-weight:700;">${escapeHtml(input.intro)}</p>
                ${bodyHtml}
                ${ctaHtml}
                ${fallbackLink}
                ${noteHtml}
              </td>
            </tr>
            <tr>
              <td style="background:#F9FAFB;border-top:1px solid #E5E3E6;padding:20px 28px;">
                <p style="margin:0 0 8px;color:#111111;font-size:13px;font-weight:800;">Semangat hari ini 💪</p>
                <p style="margin:0;color:#6B7280;font-size:12px;line-height:1.6;">Email otomatis dari ${appName}. Jangan balas email ini. Jika butuh bantuan, hubungi HRD atau Superadmin ${companyName}.</p>
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

export async function sendEmail(input: SendEmailInput) {
  if (!isEmailEnabled()) {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[email:disabled]', { to: input.to, subject: input.subject });
    }
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
    throw new Error(`Failed to send email: ${detail}`);
  }

  return response.json();
}

export async function sendAuthEmail(template: EmailTemplate, to: string, data: Record<string, string> = {}) {
  const appUrl = getAppUrl();
  const loginUrl = `${appUrl}/login`;
  const displayName = data.name ? `, ${data.name}` : '';
  const templates: Record<EmailTemplate, SendEmailInput> = {
    register: {
      to,
      subject: `${appName} - Akun Anda berhasil dibuat`,
      html: renderEmail({
        eyebrow: 'Selamat datang',
        title: 'Akun Anda berhasil dibuat',
        intro: `Halo${displayName}! Semangat kerja dimulai dari langkah kecil yang rapi.`,
        body: [
          'Akun MyProdusen Anda sudah terdaftar. Setelah akun aktif, Anda bisa login untuk absensi, cek jadwal, ajukan cuti, dan melihat informasi kerja penting.',
          'Satu sistem, banyak manfaat: data lebih tertata, kerja lebih tenang, tim lebih kompak.',
        ],
        cta: { label: 'Buka MyProdusen', url: loginUrl },
        note: 'Jika akun belum bisa digunakan, tunggu aktivasi dari HRD atau Superadmin.',
        text: `Akun Anda berhasil dibuat. Login: ${loginUrl}`,
      }),
      text: `Akun Anda berhasil dibuat. Login: ${loginUrl}`,
    },
    'forgot-password': {
      to,
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
