import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq, inArray } from 'drizzle-orm';
import { db, attendances, employees } from '@/lib/db';
import { buildEmployeeTrackRecord } from '@/lib/reports/employee-track-record';
import { createTestEmployee, createTestUser, cleanupTestData } from '../helpers/test-utils';

let userId: string;
let employeeId: string;
const attendanceIds: string[] = [];

function decode(bytes: Uint8Array) {
  return Buffer.from(bytes).toString('latin1');
}

beforeAll(async () => {
  const u = await createTestUser('EMPLOYEE');
  userId = u.id;
  employeeId = await createTestEmployee(u.id);
  await db.update(employees).set({ division: 'Produksi', position: 'Operator', joinDate: new Date('2024-01-15') }).where(eq(employees.id, employeeId));

  for (const [status, offset] of [['PRESENT', 0], ['LATE', 1], ['PRESENT', 2]] as const) {
    const id = `test_att_tr_${status}_${offset}_${Date.now()}`;
    await db.insert(attendances).values({
      id, employeeId, workLocationId: 'loc_x',
      checkInTime: new Date(Date.now() - offset * 86400000),
      checkInLatitude: 3.6, checkInLongitude: 98.7, checkInSelfie: '/uploads/x.jpg',
      status, lateMinutes: status === 'LATE' ? 12 : 0, totalWorkMinutes: 480,
    });
    attendanceIds.push(id);
  }
});

afterAll(async () => {
  if (attendanceIds.length) await db.delete(attendances).where(inArray(attendances.id, attendanceIds));
  await cleanupTestData({ userIds: [userId], employeeIds: [employeeId] });
});

describe('buildEmployeeTrackRecord', () => {
  it('returns not-found for a missing employee', async () => {
    const result = await buildEmployeeTrackRecord('emp_does_not_exist', 'admin@test');
    expect(result.found).toBe(false);
    expect(result.pdf).toBeUndefined();
  });

  it('produces a valid, comprehensive per-employee PDF', async () => {
    const result = await buildEmployeeTrackRecord(employeeId, 'admin@test');
    expect(result.found).toBe(true);
    expect(result.employeeName).toBeTruthy();
    const pdf = decode(result.pdf!);
    expect(pdf.startsWith('%PDF-1.')).toBe(true);
    expect(pdf.trimEnd().endsWith('%%EOF')).toBe(true);
    expect(result.pdf!.byteLength).toBeGreaterThan(2000);
    for (const section of ['Identitas', 'Ringkasan Kehadiran', 'Riwayat KPI', 'Cuti', 'Jejak Aktivitas']) {
      expect(pdf).toContain(section);
    }
  });

  it('does not leak selfie image data or paths into the document', async () => {
    const result = await buildEmployeeTrackRecord(employeeId, 'admin@test');
    const pdf = decode(result.pdf!);
    // The privacy note may mention the word "selfie"; what must NOT appear is
    // actual selfie payloads — file paths, upload URLs, or data URIs.
    expect(pdf).not.toContain('/uploads/');
    expect(pdf).not.toContain('checkInSelfie');
    expect(pdf).not.toContain('data:image');
  });
});
