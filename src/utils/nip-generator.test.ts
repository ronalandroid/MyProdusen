import { describe, it, expect } from 'vitest';
import { generateNIP, parseNIP, getNextNIP } from './nip-generator';

describe('generateNIP', () => {
  it('formats YYMMDD-XXXX with zero-padding', () => {
    // Jan is month 0 → "01"; day 5 → "05"; seq 7 → "0007"
    expect(generateNIP(new Date(2025, 0, 5), 7)).toBe('250105-0007');
  });

  it('does not truncate a sequence longer than 4 digits', () => {
    expect(generateNIP(new Date(2024, 11, 31), 12345)).toBe('241231-12345');
  });
});

describe('parseNIP', () => {
  it('round-trips a generated NIP', () => {
    const nip = generateNIP(new Date(2023, 5, 15), 42);
    const parsed = parseNIP(nip);
    expect(parsed).not.toBeNull();
    expect(parsed!.sequence).toBe(42);
    expect(parsed!.joinDate.getFullYear()).toBe(2023);
    expect(parsed!.joinDate.getMonth()).toBe(5);
    expect(parsed!.joinDate.getDate()).toBe(15);
  });

  it('returns null for malformed input', () => {
    expect(parseNIP('not-a-nip')).toBeNull();
    expect(parseNIP('250105-07')).toBeNull(); // sequence must be 4 digits
    expect(parseNIP('2501-0007')).toBeNull(); // date part wrong length
    expect(parseNIP('')).toBeNull();
  });
});

describe('getNextNIP', () => {
  it('returns sequence 0001 when no NIPs exist for the date', async () => {
    expect(await getNextNIP(new Date(2025, 0, 5), [])).toBe('250105-0001');
  });

  it('increments past the max sequence for the same date prefix', async () => {
    const date = new Date(2025, 0, 5); // prefix 250105
    const existing = ['250105-0001', '250105-0003', '241231-0009'];
    expect(await getNextNIP(date, existing)).toBe('250105-0004');
  });

  it('treats a malformed entry sharing the date prefix as sequence 0', async () => {
    const date = new Date(2025, 0, 5);
    const existing = ['250105-0002', '250105-XXXX', '241231-9999'];
    expect(await getNextNIP(date, existing)).toBe('250105-0003');
  });
});
