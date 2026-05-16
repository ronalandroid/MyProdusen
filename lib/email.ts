export type EmailTemplate = 'register' | 'forgot-password' | 'reset-password' | 'role-changed' | 'account-approved';

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const resendEndpoint = 'https://api.resend.com/emails';

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
  const appName = 'MyProdusen';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
  const templates: Record<EmailTemplate, SendEmailInput> = {
    register: {
      to,
      subject: `${appName} - Registrasi diterima`,
      html: `<p>Akun Anda berhasil didaftarkan.</p><p>Admin akan memeriksa dan mengaktifkan akun Anda.</p>`,
      text: 'Akun Anda berhasil didaftarkan. Admin akan memeriksa dan mengaktifkan akun Anda.',
    },
    'forgot-password': {
      to,
      subject: `${appName} - Reset password`,
      html: `<p>Klik link ini untuk reset password:</p><p><a href="${data.resetUrl}">${data.resetUrl}</a></p><p>Link berlaku 30 menit.</p>`,
      text: `Reset password: ${data.resetUrl}. Link berlaku 30 menit.`,
    },
    'reset-password': {
      to,
      subject: `${appName} - Password berhasil diubah`,
      html: `<p>Password akun Anda berhasil diubah.</p><p>Jika bukan Anda, hubungi Superadmin segera.</p>`,
      text: 'Password akun Anda berhasil diubah. Jika bukan Anda, hubungi Superadmin segera.',
    },
    'role-changed': {
      to,
      subject: `${appName} - Role akun diperbarui`,
      html: `<p>Role akun Anda diperbarui menjadi <strong>${data.role}</strong>.</p><p>Login: <a href="${appUrl}/login">${appUrl}/login</a></p>`,
      text: `Role akun Anda diperbarui menjadi ${data.role}. Login: ${appUrl}/login`,
    },
    'account-approved': {
      to,
      subject: `${appName} - Akun aktif`,
      html: `<p>Akun Anda sudah aktif.</p><p>Login: <a href="${appUrl}/login">${appUrl}/login</a></p>`,
      text: `Akun Anda sudah aktif. Login: ${appUrl}/login`,
    },
  };

  return sendEmail(templates[template]);
}
