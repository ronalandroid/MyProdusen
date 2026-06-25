import { describe, it, expect } from 'vitest';
import { scheduleService } from '@/services/attendance/schedule.service';

/**
 * Integration tests for ScheduleService read paths against a real DB — the
 * location lookups return empty arrays for unknown ids (no seeding, no writes).
 */
describe('ScheduleService integration (real DB, read paths)', () => {
  const NONE = 'itest-nonexistent';

  it('getShiftLocations: returns an array for an unknown shift', async () => {
    expect(Array.isArray(await scheduleService.getShiftLocations(NONE))).toBe(true);
  });

  it('getShiftLocationIds: returns an array for an unknown shift', async () => {
    expect(Array.isArray(await scheduleService.getShiftLocationIds(NONE))).toBe(true);
  });

  it('getScheduleLocations: returns an array for an unknown schedule', async () => {
    expect(Array.isArray(await scheduleService.getScheduleLocations(NONE))).toBe(true);
  });
});
