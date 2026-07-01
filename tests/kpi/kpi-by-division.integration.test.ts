import { describe, it, expect, afterEach } from 'vitest';
import { db, kpiProductionEntries, employees, divisions, users } from '@/lib/db';
import { eq, inArray } from 'drizzle-orm';
import { getKpiProductionByDivision, monthRange } from '@/services/kpi/kpi-by-division';

/**
 * KPI production rolled up per division. A division's KPI = the sum of its
 * employees' production entries (employees.divisionId -> Division). Employees
 * with no division fall into a "Tanpa Divisi" bucket.
 */
describe('getKpiProductionByDivision', () => {
  const suffix = `${Date.now()}`;
  const divA = `kbd_divA_${suffix}`;
  const divB = `kbd_divB_${suffix}`;
  const ids = [`kbd_a1_${suffix}`, `kbd_a2_${suffix}`, `kbd_b1_${suffix}`, `kbd_c1_${suffix}`];
  const PERIOD = '3099-05';

  async function seedEmployee(id: string, divisionId: string | null) {
    await db.insert(users).values({
      id, email: `${id}@t.local`, username: id, password: 'x', role: 'EMPLOYEE', isActive: true,
    });
    await db.insert(employees).values({
      id, nip: `NIP-${id}`, userId: id, fullName: `Emp ${id}`, email: `${id}@t.local`,
      status: 'ACTIVE', position: 'Staff', divisionId,
    });
  }

  async function entry(employeeId: string, metricType: string, qty: string, date: string) {
    await db.insert(kpiProductionEntries).values({
      id: `kbd_e_${employeeId}_${metricType}_${date}`,
      employeeId, teamId: `kbd_team_${suffix}`, leaderUserId: 'kbd_leader',
      date, metricType, quantity: qty, unit: 'pcs', status: 'SUBMITTED', createdBy: 'kbd_leader',
    });
  }

  afterEach(async () => {
    await db.delete(kpiProductionEntries).where(inArray(kpiProductionEntries.employeeId, ids));
    await db.delete(employees).where(inArray(employees.id, ids));
    await db.delete(users).where(inArray(users.id, ids));
    await db.delete(divisions).where(inArray(divisions.id, [divA, divB]));
  });

  it('sums quantity + counts employees per division and metric, and buckets no-division', async () => {
    await db.insert(divisions).values([
      { id: divA, name: 'Produksi Cetak', code: `CETAK_${suffix}`, isActive: true },
      { id: divB, name: 'Quality Control', code: `QC_${suffix}`, isActive: true },
    ]);
    await seedEmployee(ids[0], divA); // A1 in Produksi Cetak
    await seedEmployee(ids[1], divA); // A2 in Produksi Cetak
    await seedEmployee(ids[2], divB); // B1 in QC
    await seedEmployee(ids[3], null); // C1 no division

    await entry(ids[0], 'Cetak', '100.00', `${PERIOD}-10`);
    await entry(ids[1], 'Cetak', '50.00', `${PERIOD}-11`);
    await entry(ids[0], 'Kukus', '20.00', `${PERIOD}-12`);
    await entry(ids[2], 'Cetak', '30.00', `${PERIOD}-13`);
    await entry(ids[3], 'Cetak', '10.00', `${PERIOD}-14`);
    // Out of period → must be excluded.
    await entry(ids[0], 'Cetak', '999.00', '3099-06-01');

    const rows = await getKpiProductionByDivision(PERIOD);
    const find = (division: string, metric: string) =>
      rows.find((r) => r.divisionName === division && r.metricType === metric);

    expect(find('Produksi Cetak', 'Cetak')).toMatchObject({ totalQuantity: 150, employeeCount: 2, entryCount: 2 });
    expect(find('Produksi Cetak', 'Kukus')).toMatchObject({ totalQuantity: 20, employeeCount: 1 });
    expect(find('Quality Control', 'Cetak')).toMatchObject({ totalQuantity: 30, employeeCount: 1 });
    expect(find('Tanpa Divisi', 'Cetak')).toMatchObject({ totalQuantity: 10, employeeCount: 1 });

    // The 999 entry in the next month must not leak into this period's totals.
    const cetakA = find('Produksi Cetak', 'Cetak');
    expect(cetakA!.totalQuantity).toBe(150);
  });

  it('rejects an invalid period format', () => {
    expect(() => monthRange('2026-13')).toThrow();
    expect(() => monthRange('bad')).toThrow();
    expect(monthRange('2026-05')).toEqual({ start: '2026-05-01', endExclusive: '2026-06-01' });
    expect(monthRange('2026-12')).toEqual({ start: '2026-12-01', endExclusive: '2027-01-01' });
  });
});
