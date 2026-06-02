import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const schema = readFileSync('drizzle/schema.ts', 'utf8');
const migration = readFileSync('drizzle/migrations/0030_tbm_division_payroll_rules.sql', 'utf8');
const seed = readFileSync('scripts/seed-tbm-payroll-defaults.mjs', 'utf8');
const service = readFileSync('src/services/payroll/tbm-payroll.service.ts', 'utf8');
const ui = readFileSync('app/dashboard/payroll/structures/page.tsx', 'utf8');
const leader = readFileSync('src/components/dashboard/LeaderBeranda.tsx', 'utf8');

describe('TBM division payroll configurable source contract', () => {
  it('adds safe additive division, position, payroll rule, and employee assignment fields', () => {
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS "Division"');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS "Position"');
    expect(migration).toContain('ALTER TABLE "PayrollRule" ADD COLUMN IF NOT EXISTS "trainingAmount"');
    expect(migration).toContain('ALTER TABLE "EmployeePayroll" ADD COLUMN IF NOT EXISTS "customAmount"');
    expect(migration).not.toMatch(/\bDROP\b|\bDELETE\b|\bTRUNCATE\b/i);
    expect(schema).toContain("export const divisions = pgTable('Division'");
    expect(schema).toContain("trainingStatus: text('trainingStatus')");
  });

  it('seeds default TBM divisions, positions, and editable payroll rules idempotently', () => {
    for (const value of ['Administrasi', 'Produksi', 'Packing', 'BEGE', 'Admin Training', 'Produksi Harian', 'Packing Harian', 'Produksi Cetak Perempuan', 'Adon Helper Laki-laki', 'BEGE Default']) {
      expect(seed).toContain(value);
    }
    expect(seed).toContain('on conflict');
    expect(seed).toContain('2000000');
    expect(seed).toContain('2300000');
    expect(seed).toContain('60000');
    expect(seed).toContain('50000');
  });

  it('keeps payroll management superadmin-only and employee salary own-only', () => {
    expect(service).toContain('assignEmployeePayroll');
    expect(service).toContain('getEmployeeOwnSalary(userId: string)');
    expect(service).toContain('customAmount');
    expect(readFileSync('app/api/payroll/tbm/rules/route.ts', 'utf8')).toContain("user.role !== 'SUPERADMIN'");
    expect(readFileSync('app/api/payroll/me/salary-rule/route.ts', 'utf8')).toContain('getEmployeeOwnSalary(user.userId)');
  });

  it('exposes professional superadmin settings labels and prevents leader payroll leakage links', () => {
    for (const label of ['Struktur Divisi & Gaji', 'Divisi', 'Jabatan', 'Aturan Gaji', 'Penempatan Karyawan', 'Belum ada aturan gaji untuk divisi ini.']) {
      expect(ui).toContain(label);
    }
    expect(leader).toContain('/dashboard/payroll/me');
    expect(leader).not.toContain('path: "/dashboard/payroll"');
  });
});
