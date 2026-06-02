import postgres from 'postgres';
try { await import('dotenv/config'); } catch {}
if (!process.env.DATABASE_URL) { console.error('ERROR: DATABASE_URL is required'); process.exit(1); }
const url = new URL(process.env.DATABASE_URL); url.searchParams.delete('schema');
const sql = postgres(url.toString(), { max: 1 });
const now = new Date();
const divisions = [
  ['division_administrasi', 'Administrasi', 'administrasi'],
  ['division_produksi', 'Produksi', 'produksi'],
  ['division_packing', 'Packing', 'packing'],
  ['division_bege', 'BEGE', 'bege'],
];
const positions = [
  ['position_admin', 'division_administrasi', 'Admin', 'admin', 'Administrasi'],
  ['position_produksi_cetak', 'division_produksi', 'Produksi Cetak', 'produksi-cetak', 'Produksi'],
  ['position_adon_helper', 'division_produksi', 'Adon Helper', 'adon-helper', 'Produksi'],
  ['position_packing_staff', 'division_packing', 'Packing Staff', 'packing-staff', 'Packing'],
  ['position_bege_staff', 'division_bege', 'BEGE Staff', 'bege-staff', 'BEGE'],
];
const rules = [
  { id: 'payroll_rule_admin_training', name: 'Admin Training', divisionId: 'division_administrasi', positionId: 'position_admin', salaryType: 'monthly', baseAmount: 2300000, trainingAmount: 2000000, fullAmount: 2300000 },
  { id: 'payroll_rule_produksi_harian', name: 'Produksi Harian', divisionId: 'division_produksi', positionId: null, salaryType: 'daily', baseAmount: 60000 },
  { id: 'payroll_rule_packing_harian', name: 'Packing Harian', divisionId: 'division_packing', positionId: null, salaryType: 'daily', baseAmount: 60000 },
  { id: 'payroll_rule_produksi_cetak_perempuan', name: 'Produksi Cetak Perempuan', divisionId: 'division_produksi', positionId: 'position_produksi_cetak', salaryType: 'daily', baseAmount: 50000 },
  { id: 'payroll_rule_adon_helper_laki_laki', name: 'Adon Helper Laki-laki', divisionId: 'division_produksi', positionId: 'position_adon_helper', salaryType: 'daily', baseAmount: 60000 },
  { id: 'payroll_rule_bege_default', name: 'BEGE Default', divisionId: 'division_bege', positionId: null, salaryType: 'daily', baseAmount: 0 },
];
try {
  for (const [id, name, code] of divisions) {
    await sql`insert into "Division" (id, name, code, "isActive", "createdAt", "updatedAt") values (${id}, ${name}, ${code}, true, ${now}, ${now}) on conflict (code) do update set name=excluded.name, "isActive"=true, "updatedAt"=${now}`;
  }
  for (const [id, divisionId, name, code, type] of positions) {
    await sql`insert into "Position" (id, "divisionId", name, code, type, active, "isActive", "createdAt", "updatedAt") values (${id}, ${divisionId}, ${name}, ${code}, ${type}, true, true, ${now}, ${now}) on conflict (id) do update set "divisionId"=excluded."divisionId", name=excluded.name, code=excluded.code, type=excluded.type, active=true, "isActive"=true, "updatedAt"=${now}`;
  }
  for (const rule of rules) {
    await sql`insert into "PayrollRule" (id, name, "divisionId", "positionId", "periodType", "salaryType", "baseSalary", "baseAmount", "trainingAmount", "fullAmount", active, "isActive", "effectiveFrom", "createdAt", "updatedAt") values (${rule.id}, ${rule.name}, ${rule.divisionId}, ${rule.positionId}, ${rule.salaryType.toUpperCase()}, ${rule.salaryType}, ${rule.baseAmount}, ${rule.baseAmount}, ${rule.trainingAmount ?? null}, ${rule.fullAmount ?? null}, true, true, ${now}, ${now}, ${now}) on conflict (id) do update set name=excluded.name, "divisionId"=excluded."divisionId", "positionId"=excluded."positionId", "periodType"=excluded."periodType", "salaryType"=excluded."salaryType", "baseSalary"=excluded."baseSalary", "baseAmount"=excluded."baseAmount", "trainingAmount"=excluded."trainingAmount", "fullAmount"=excluded."fullAmount", active=true, "isActive"=true, "updatedAt"=${now}`;
  }
  console.log(JSON.stringify({ seeded: true, divisions: divisions.length, positions: positions.length, payrollRules: rules.length }));
} finally { await sql.end(); }
