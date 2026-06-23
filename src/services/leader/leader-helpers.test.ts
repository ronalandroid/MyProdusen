import { describe, it, expect } from 'vitest';
import { id, todayIso, assertIsoDate } from './leader-helpers';

describe('id', () => {
  it('produces a prefixed token and is unique across calls', () => {
    const a = id('team');
    expect(a).toMatch(/^team_\d+_[a-z0-9]+$/);
    expect(id('team')).not.toBe(a);
  });
});

describe('todayIso', () => {
  it('returns the current date as YYYY-MM-DD', () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('assertIsoDate', () => {
  it('accepts a valid ISO calendar date', () => {
    expect(() => assertIsoDate('2025-06-15')).not.toThrow();
  });

  it('rejects strings that are not in YYYY-MM-DD format', () => {
    expect(() => assertIsoDate('2025-6-15')).toThrow();
    expect(() => assertIsoDate('15-06-2025')).toThrow();
    expect(() => assertIsoDate('2025/06/15')).toThrow();
    expect(() => assertIsoDate('notadate')).toThrow();
    expect(() => assertIsoDate('')).toThrow();
  });

  it('rejects a well-formatted but impossible calendar date', () => {
    expect(() => assertIsoDate('2025-13-40')).toThrow();
  });

  it('throws a 422 KPI_DATE_INVALID error', () => {
    expect(() => assertIsoDate('bad')).toThrow(
      expect.objectContaining({ code: 'KPI_DATE_INVALID', status: 422 }),
    );
  });
});
