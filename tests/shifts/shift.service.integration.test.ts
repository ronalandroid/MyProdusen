import { describe, it, expect, afterEach } from 'vitest';
import { shiftService } from '@/services/shifts/shift.service';

/**
 * Integration tests for ShiftService against a real DB. Covers the not-found
 * guards (get/update/delete) and a self-cleaning create -> read -> update ->
 * delete round-trip that exercises the happy paths without leaving rows behind.
 */
describe('ShiftService integration (real DB)', () => {
  const createdIds: string[] = [];

  afterEach(async () => {
    for (const id of createdIds) {
      await shiftService.deleteShift(id).catch(() => {});
    }
    createdIds.length = 0;
  });

  it('getShifts: returns an array', async () => {
    const shifts = await shiftService.getShifts();
    expect(Array.isArray(shifts)).toBe(true);
  });

  it('getShiftById: throws not-found for a missing shift', async () => {
    await expect(shiftService.getShiftById('itest-nonexistent')).rejects.toThrow(/tidak ditemukan/i);
  });

  it('updateShift: throws not-found for a missing shift', async () => {
    await expect(
      shiftService.updateShift('itest-nonexistent', { name: 'x' }),
    ).rejects.toThrow(/tidak ditemukan/i);
  });

  it('deleteShift: throws not-found for a missing shift', async () => {
    await expect(shiftService.deleteShift('itest-nonexistent')).rejects.toThrow(/tidak ditemukan/i);
  });

  it('round-trip: create -> get -> update -> delete a shift', async () => {
    const created = await shiftService.createShift({
      name: 'itest shift',
      startTime: '08:00',
      endTime: '16:00',
    });
    createdIds.push(created.id);
    expect(created.isActive).toBe(true);

    const fetched = await shiftService.getShiftById(created.id);
    expect(fetched.id).toBe(created.id);

    const updated = await shiftService.updateShift(created.id, { name: 'itest shift renamed' });
    expect(updated.name).toBe('itest shift renamed');

    const del = await shiftService.deleteShift(created.id);
    expect(del.message).toMatch(/berhasil dihapus/i);
    createdIds.splice(createdIds.indexOf(created.id), 1); // already deleted

    await expect(shiftService.getShiftById(created.id)).rejects.toThrow(/tidak ditemukan/i);
  });
});
