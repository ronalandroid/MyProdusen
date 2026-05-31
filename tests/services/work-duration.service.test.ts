import { describe, expect, it } from 'vitest';
import { calculateWorkDurationDays, formatWorkDuration, validateStartDate } from '@/src/services/employees/work-duration.service';

describe('work duration service', () => {
  it('calculates calendar days in Asia/Jakarta', () => {
    expect(calculateWorkDurationDays('2025-01-01', new Date('2025-01-31T12:00:00+07:00'))).toBe(31);
  });

  it('formats missing and active duration labels', () => {
    expect(formatWorkDuration(null, new Date('2025-01-31T00:00:00+07:00'))).toBe('Tanggal mulai kerja belum diatur.');
    expect(formatWorkDuration('2025-01-01', new Date('2025-01-31T00:00:00+07:00'))).toContain('31 hari');
  });

  it('rejects future date unless explicitly allowed', () => {
    expect(validateStartDate('2025-02-01', new Date('2025-01-31T00:00:00+07:00')).valid).toBe(false);
    expect(validateStartDate('2025-02-01', new Date('2025-01-31T00:00:00+07:00'), { allowFuture: true }).valid).toBe(true);
  });
});
