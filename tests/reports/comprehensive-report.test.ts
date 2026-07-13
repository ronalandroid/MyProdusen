import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq, inArray } from 'drizzle-orm';
import { db, attendances, employees, kpiResults } from '@/lib/db';
import { buildComprehensiveReport } from '@/lib/reports/comprehensive-report';
import { createTestEmployee, createTestUser, cleanupTestData } from '../helpers/test-utils';

const userIds: string[] = [];
const employeeIds: string[] = [];
const attendanceIds: string[] = [];

function decode(bytes: Uint8Array) {
  return Buffer.from(bytes).toString('latin1');
}

beforeAll(async () => {
  // Two employees in two divisions with attendance, so the per-division
  // matrix has real rows to fold.
  for (const division of ['Produksi', 'Packing']) {
    const u = await createTestUser('EMPLOYEE');
    userIds.push(u.id);
    const empId = await createTestEmployee(u.id);
    employeeIds.push(empId);
    await db.update(employees).set({ division }).where(eq(employees.id, empId));
    const attId = `test_att_rpt_${division}_${Date.now()}`;
    await db.insert(attendances).values({
      id: attId,
      employeeId: empId,
      workLocationId: 'loc_x',
      checkInTime: new Date(),
      checkInLatitude: 3.6,
      checkInLongitude: 98.7,
      checkInSelfie: '/uploads/x.jpg',
      status: division === 'Produksi' ? 'PRESENT' : 'LATE',
    });
    attendanceIds.push(attId);
  }
});

afterAll(async () => {
  if (attendanceIds.length) await db.delete(attendances).where(inArray(attendances.id, attendanceIds));
  await db.delete(kpiResults).where(inArray(kpiResults.employeeId, employeeIds));
  await cleanupTestData({ userIds, employeeIds });
});

describe('buildComprehensiveReport', () => {
  it('returns a valid, non-trivial multi-section PDF over the current month', async () => {
    const now = new Date();
    const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-28`;

    const bytes = await buildComprehensiveReport({ from, to }, 'admin@test');
    const pdf = decode(bytes);

    expect(pdf.startsWith('%PDF-1.')).toBe(true);
    expect(pdf.trimEnd().endsWith('%%EOF')).toBe(true);
    expect(bytes.byteLength).toBeGreaterThan(2000);
    // Section titles are drawn as text operators — confirm the report is comprehensive.
    for (const section of ['Ringkasan per Divisi', 'Kehadiran', 'Kinerja KPI', 'Cuti', 'Payroll']) {
      expect(pdf).toContain(section);
    }
  });

  it('does not throw and still yields a valid PDF when filtered to a single division', async () => {
    const bytes = await buildComprehensiveReport({ division: 'Produksi' }, 'admin@test');
    expect(decode(bytes).startsWith('%PDF')).toBe(true);
    expect(bytes.byteLength).toBeGreaterThan(1500);
  });
});
