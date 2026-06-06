const JAKARTA_TIMEZONE = 'Asia/Jakarta';

const JAKARTA_DATE_KEY_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: JAKARTA_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function toJakartaDateKey(value: Date) {
  const parts = JAKARTA_DATE_KEY_FORMATTER.formatToParts(value);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || '01';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function parseDateKey(value: string | Date | null | undefined) {
  if (!value) return null;
  if (value instanceof Date) return toJakartaDateKey(value);
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function utcMidnight(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

export function calculateWorkDurationDays(startDate: string | Date | null | undefined, now = new Date(), timezone = JAKARTA_TIMEZONE) {
  void timezone;
  const startKey = parseDateKey(startDate);
  if (!startKey) return 0;
  const todayKey = toJakartaDateKey(now);
  const diff = Math.floor((utcMidnight(todayKey) - utcMidnight(startKey)) / 86_400_000);
  return Math.max(0, diff + 1);
}

export function formatWorkDuration(startDate: string | Date | null | undefined, now = new Date()) {
  if (!startDate) return 'Tanggal mulai kerja belum diatur.';
  const days = calculateWorkDurationDays(startDate, now);
  const months = Math.floor(days / 30);
  const restDays = days % 30;
  if (months > 0) return `${days} hari (${months} bulan ${restDays} hari)`;
  return `${days} hari`;
}

export function validateStartDate(startDate: string | Date | null | undefined, now = new Date(), options: { allowFuture?: boolean } = {}) {
  const startKey = parseDateKey(startDate);
  if (!startKey) return { valid: false, reason: 'Tanggal mulai kerja wajib diisi.' };
  const todayKey = toJakartaDateKey(now);
  if (!options.allowFuture && utcMidnight(startKey) > utcMidnight(todayKey)) {
    return { valid: false, reason: 'Tanggal mulai kerja tidak boleh di masa depan tanpa konfirmasi Superadmin.' };
  }
  return { valid: true };
}
