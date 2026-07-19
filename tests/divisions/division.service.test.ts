import { afterAll, describe, expect, it } from 'vitest';
import { eq, inArray } from 'drizzle-orm';
import { db, divisions, employees, positions, payrollRules } from '@/lib/db';
import { divisionService } from '@/services/divisions/division.service';
import { BusinessError } from '@/lib/core/business-error';
import { createTestUser, createTestEmployee, cleanupTestData } from '../helpers/test-utils';

/**
 * Kebijakan owner (2026-07-19): divisi dapat ditambah/dihapus Superadmin;
 * penghapusan DIBLOKIR selama divisi masih punya karyawan aktif — baik yang
 * tertaut lewat divisionId maupun lewat teks legacy Employee.division.
 */
const createdDivisionIds: string[] = [];
const userIds: string[] = [];
const employeeIds: string[] = [];

function uniqueName(prefix: string) {
  return `${prefix} ${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
}

async function makeDivision(name: string) {
  const division = await divisionService.createDivision({ name });
  createdDivisionIds.push(division.id);
  return division;
}

async function makeEmployee() {
  const user = await createTestUser('EMPLOYEE');
  userIds.push(user.id);
  const employeeId = await createTestEmployee(user.id);
  employeeIds.push(employeeId);
  return employeeId;
}

afterAll(async () => {
  if (employeeIds.length) {
    await db.update(employees).set({ division: null, divisionId: null }).where(inArray(employees.id, employeeIds));
  }
  await cleanupTestData({ userIds });
  if (createdDivisionIds.length) {
    await db.delete(divisions).where(inArray(divisions.id, createdDivisionIds));
  }
});

describe('divisionService.createDivision', () => {
  it('creates an active division with a slug code and returns it in the list', async () => {
    const name = uniqueName('Divisi Uji');
    const division = await makeDivision(name);

    expect(division.name).toBe(name);
    expect(division.code).toBe(name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    expect(division.isActive).toBe(true);

    const list = await divisionService.listDivisions();
    expect(list.some((d) => d.id === division.id)).toBe(true);
  });

  it('rejects a duplicate name (case-insensitive)', async () => {
    const name = uniqueName('Divisi Ganda');
    await makeDivision(name);

    await expect(divisionService.createDivision({ name: name.toUpperCase() })).rejects.toThrow(BusinessError);
  });

  it('re-activates an inactive division with the same code instead of failing', async () => {
    const name = uniqueName('Divisi Hidup Lagi');
    const division = await makeDivision(name);
    await divisionService.updateDivision(division.id, { isActive: false });

    const revived = await divisionService.createDivision({ name });
    expect(revived.id).toBe(division.id);
    expect(revived.isActive).toBe(true);
  });
});

describe('divisionService.updateDivision', () => {
  it('renaming a division syncs the legacy text on its linked employees', async () => {
    const division = await makeDivision(uniqueName('Divisi Lama'));
    const employeeId = await makeEmployee();
    await db.update(employees).set({ division: division.name, divisionId: division.id }).where(eq(employees.id, employeeId));

    const newName = uniqueName('Divisi Baru');
    await divisionService.updateDivision(division.id, { name: newName });

    const [row] = await db.select({ division: employees.division }).from(employees).where(eq(employees.id, employeeId));
    expect(row.division).toBe(newName);
  });
});

describe('divisionService.deleteDivision', () => {
  it('is blocked while an active employee is linked via divisionId', async () => {
    const division = await makeDivision(uniqueName('Divisi Berpenghuni'));
    const employeeId = await makeEmployee();
    await db.update(employees).set({ divisionId: division.id }).where(eq(employees.id, employeeId));

    await expect(divisionService.deleteDivision(division.id)).rejects.toThrow(/karyawan/i);
  });

  it('is blocked while an active employee still matches by legacy text name', async () => {
    const division = await makeDivision(uniqueName('Divisi Teks Legacy'));
    const employeeId = await makeEmployee();
    // Legacy link: text only, no divisionId.
    await db.update(employees).set({ division: division.name, divisionId: null }).where(eq(employees.id, employeeId));

    await expect(divisionService.deleteDivision(division.id)).rejects.toThrow(/karyawan/i);
  });

  it('is blocked while payroll rules or positions still reference the division', async () => {
    const division = await makeDivision(uniqueName('Divisi Bertarif'));
    const ruleId = `test_rule_${Date.now()}`;
    await db.insert(payrollRules).values({
      id: ruleId,
      name: 'Tarif Uji',
      divisionId: division.id,
      periodType: 'DAILY',
      salaryType: 'daily',
      baseSalary: 60000,
      baseAmount: 60000,
      active: true,
      isActive: true,
      effectiveFrom: new Date(),
    } as never);

    try {
      await expect(divisionService.deleteDivision(division.id)).rejects.toThrow(BusinessError);
    } finally {
      await db.delete(payrollRules).where(eq(payrollRules.id, ruleId));
    }
  });

  it('deletes an empty division and removes it from the list', async () => {
    const division = await makeDivision(uniqueName('Divisi Kosong'));

    await divisionService.deleteDivision(division.id);

    const list = await divisionService.listDivisions({ includeInactive: true });
    expect(list.some((d) => d.id === division.id)).toBe(false);
  });
});

describe('divisionService.listDivisions', () => {
  it('reports memberCount covering both divisionId links and legacy text matches', async () => {
    const division = await makeDivision(uniqueName('Divisi Hitung'));
    const byId = await makeEmployee();
    const byText = await makeEmployee();
    await db.update(employees).set({ divisionId: division.id }).where(eq(employees.id, byId));
    await db.update(employees).set({ division: division.name, divisionId: null }).where(eq(employees.id, byText));

    const list = await divisionService.listDivisions();
    const found = list.find((d) => d.id === division.id);
    expect(found?.memberCount).toBe(2);
  });

  it('excludes inactive divisions by default but includes them when asked', async () => {
    const division = await makeDivision(uniqueName('Divisi Nonaktif'));
    await divisionService.updateDivision(division.id, { isActive: false });

    const activeOnly = await divisionService.listDivisions();
    expect(activeOnly.some((d) => d.id === division.id)).toBe(false);

    const all = await divisionService.listDivisions({ includeInactive: true });
    expect(all.some((d) => d.id === division.id)).toBe(true);
  });
});

describe('divisionService.findDivisionByName', () => {
  it('resolves the division id for a name match so write paths can dual-link', async () => {
    const division = await makeDivision(uniqueName('Divisi Tautan'));

    const found = await divisionService.findDivisionByName(division.name.toUpperCase());
    expect(found?.id).toBe(division.id);

    const missing = await divisionService.findDivisionByName('tidak-pernah-ada-xyz');
    expect(missing).toBeNull();
  });
});

describe('nama divisi berisi karakter wildcard (% dan _)', () => {
  it('findDivisionByName memperlakukan % dan _ sebagai huruf biasa, bukan wildcard', async () => {
    const marker = Date.now().toString(36);
    const division = await makeDivision(`Divisi ${marker} 100%`);

    // '%' mentah TIDAK boleh cocok ke divisi mana pun lewat wildcard.
    const wildcard = await divisionService.findDivisionByName('%');
    expect(wildcard).toBeNull();

    // Nama persis (case-insensitive) tetap ketemu.
    const exact = await divisionService.findDivisionByName(`divisi ${marker} 100%`);
    expect(exact?.id).toBe(division.id);
  });

  it('rename-sync tidak menimpa karyawan divisi lain yang mirip pola', async () => {
    const marker = Date.now().toString(36);
    // "Divisi <m>%" — kalau dipakai sebagai pola ilike, akan mencocokkan "Divisi <m>X" juga.
    const trap = await makeDivision(`Divisi ${marker}%`);
    const other = await makeDivision(`Divisi ${marker}X`);
    const employeeId = await makeEmployee();
    await db.update(employees).set({ division: other.name, divisionId: other.id }).where(eq(employees.id, employeeId));

    await divisionService.updateDivision(trap.id, { name: `Divisi ${marker} Aman` });

    const [row] = await db.select({ division: employees.division }).from(employees).where(eq(employees.id, employeeId));
    expect(row.division).toBe(other.name); // TIDAK ikut ter-rename
  });
});

describe('dual-write divisionId on employee write paths', () => {
  it('registrasi/pembuatan profil menautkan divisionId saat nama divisi cocok', async () => {
    const division = await makeDivision(uniqueName('Divisi Registrasi'));
    const user = await createTestUser('EMPLOYEE');
    userIds.push(user.id);

    const { employeeService } = await import('@/services/employees/employee.service');
    const employee = await employeeService.createEmployeeProfileForUser(user.id, {
      fullName: 'Uji Dual Write',
      division: division.name.toLowerCase(), // beda huruf besar-kecil tetap tertaut
    });
    employeeIds.push(employee.id);

    expect(employee.divisionId).toBe(division.id);
    expect(employee.division).toBe(division.name);
  });

  it('updateEmployee menyinkronkan divisionId saat teks divisi diganti', async () => {
    const divisionA = await makeDivision(uniqueName('Divisi Awal'));
    const divisionB = await makeDivision(uniqueName('Divisi Tujuan'));
    const employeeId = await makeEmployee();
    await db.update(employees).set({ division: divisionA.name, divisionId: divisionA.id }).where(eq(employees.id, employeeId));

    const { employeeService } = await import('@/services/employees/employee.service');
    const updated = await employeeService.updateEmployee(employeeId, { division: divisionB.name });

    expect(updated.divisionId).toBe(divisionB.id);
    expect(updated.division).toBe(divisionB.name);
  });
});
