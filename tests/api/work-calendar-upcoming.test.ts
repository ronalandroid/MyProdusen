import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { inArray } from 'drizzle-orm';
import { db, workCalendarDays } from '@/lib/db';
import { GET as upcomingGET } from '@/app/api/work-calendar/upcoming/route';
import { createMockRequest, createTestUser, cleanupTestData, type TestUser } from '../helpers/test-utils';

let employee: TestUser;
const seedIds: string[] = [];

function isoDaysFromNow(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

beforeAll(async () => {
  employee = await createTestUser('EMPLOYEE');
  const rows = [
    { id: `wc_past_${Date.now()}`, date: isoDaysFromNow(-5), name: 'Libur lewat', type: 'HOLIDAY' as const, isPaidHoliday: true },
    { id: `wc_soon_${Date.now()}`, date: isoDaysFromNow(3), name: 'Cuti Bersama Uji', type: 'COMPANY_HOLIDAY' as const, isPaidHoliday: true },
    { id: `wc_work_${Date.now()}`, date: isoDaysFromNow(4), name: 'Lembur wajib uji', type: 'SPECIAL_WORKDAY' as const, isPaidHoliday: false },
  ];
  await db.insert(workCalendarDays).values(rows);
  seedIds.push(...rows.map((r) => r.id));
});

afterAll(async () => {
  await db.delete(workCalendarDays).where(inArray(workCalendarDays.id, seedIds));
  await cleanupTestData({ userIds: [employee.id] });
});

describe('GET /api/work-calendar/upcoming', () => {
  it('requires authentication', async () => {
    const response = await upcomingGET(createMockRequest('GET', 'http://localhost:3000/api/work-calendar/upcoming') as any);
    expect(response.status).toBe(401);
  });

  it('returns upcoming holidays to an employee, excluding past days and non-holidays', async () => {
    const response = await upcomingGET(
      createMockRequest('GET', 'http://localhost:3000/api/work-calendar/upcoming', { token: employee.token }) as any,
    );
    const payload = await response.json();
    expect(payload.success).toBe(true);
    const names = payload.data.map((d: { name: string }) => d.name);
    expect(names).toContain('Cuti Bersama Uji');
    expect(names).not.toContain('Libur lewat');
    expect(names).not.toContain('Lembur wajib uji');
  });
});
