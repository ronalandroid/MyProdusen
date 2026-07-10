import { sendPayslipEmail } from '@/lib/email';

type PayslipRecipient = {
  employee: { email: string | null; fullName: string | null };
};

/**
 * Email every employee on an approved payroll run that their payslip is
 * ready. Sequential on purpose — sendEmail already retries with backoff and
 * Resend rate-limits bursts. One bad recipient never blocks the rest; every
 * attempt (SENT/FAILED/SKIPPED) lands in the admin Log Email console via
 * sendEmail's logging.
 */
export async function sendPayslipEmailsForRun(period: string, items: PayslipRecipient[]) {
  const result = { sent: 0, failed: 0, skipped: 0 };

  for (const { employee } of items) {
    if (!employee.email) {
      result.skipped += 1;
      continue;
    }
    try {
      const res = await sendPayslipEmail(employee.email, {
        name: employee.fullName || undefined,
        period,
      });
      if (res && typeof res === 'object' && 'skipped' in res && res.skipped) {
        result.skipped += 1; // email provider not configured (non-production)
      } else {
        result.sent += 1;
      }
    } catch {
      // Already logged as FAILED by sendEmail; keep going.
      result.failed += 1;
    }
  }

  return result;
}
