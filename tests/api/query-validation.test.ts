import { describe, expect, it } from 'vitest';
import { isValidEnumParam } from '@/lib/core/query-validation';

// Guards enum query params before they reach a Postgres enum column — an
// invalid value used to crash the query with a 500 (e.g. ?status=ALL).
describe('isValidEnumParam', () => {
  const STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;

  it('treats absent/empty as valid (no filter applied)', () => {
    expect(isValidEnumParam(null, STATUSES)).toBe(true);
    expect(isValidEnumParam(undefined, STATUSES)).toBe(true);
    expect(isValidEnumParam('', STATUSES)).toBe(true);
  });

  it('accepts a real enum member', () => {
    expect(isValidEnumParam('PENDING', STATUSES)).toBe(true);
    expect(isValidEnumParam('APPROVED', STATUSES)).toBe(true);
  });

  it('rejects an unknown value (the ?status=ALL bug)', () => {
    expect(isValidEnumParam('ALL', STATUSES)).toBe(false);
    expect(isValidEnumParam('pending', STATUSES)).toBe(false);
    expect(isValidEnumParam('DROP TABLE', STATUSES)).toBe(false);
  });
});
