import { db, kpiProductionEntries, employees, divisions } from '@/lib/db';
import { and, gte, lt, eq, sql } from 'drizzle-orm';
import { BusinessError } from '@/lib/core/business-error';

/**
 * Aggregated KPI production for one month, grouped by DIVISION and metric.
 *
 * Entries key on employee+team+metric; a division's KPI is the roll-up of its
 * employees' entries (employees.divisionId -> Division). Employees without a
 * division fall into a "Tanpa Divisi" bucket so nothing is silently dropped.
 */
export interface KpiDivisionMetricRow {
  divisionId: string | null;
  divisionName: string;
  metricType: string;
  unit: string;
  totalQuantity: number;
  employeeCount: number;
  entryCount: number;
}

const PERIOD_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Compute the exclusive [start, nextMonthStart) date bounds for a YYYY-MM period. */
export function monthRange(period: string): { start: string; endExclusive: string } {
  if (!PERIOD_PATTERN.test(period)) {
    throw new BusinessError('Periode tidak valid. Gunakan format YYYY-MM.');
  }
  const [year, month] = period.split('-').map(Number);
  const start = `${period}-01`;
  const endExclusive =
    month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, '0')}-01`;
  return { start, endExclusive };
}

export async function getKpiProductionByDivision(period: string): Promise<KpiDivisionMetricRow[]> {
  const { start, endExclusive } = monthRange(period);

  const rows = await db
    .select({
      divisionId: employees.divisionId,
      divisionName: sql<string>`COALESCE(${divisions.name}, 'Tanpa Divisi')`,
      metricType: kpiProductionEntries.metricType,
      unit: sql<string>`MAX(${kpiProductionEntries.unit})`,
      totalQuantity: sql<string>`COALESCE(SUM(${kpiProductionEntries.quantity}), 0)`,
      employeeCount: sql<string>`COUNT(DISTINCT ${kpiProductionEntries.employeeId})`,
      entryCount: sql<string>`COUNT(*)`,
    })
    .from(kpiProductionEntries)
    .innerJoin(employees, eq(employees.id, kpiProductionEntries.employeeId))
    .leftJoin(divisions, eq(divisions.id, employees.divisionId))
    .where(and(gte(kpiProductionEntries.date, start), lt(kpiProductionEntries.date, endExclusive)))
    .groupBy(employees.divisionId, divisions.name, kpiProductionEntries.metricType)
    .orderBy(sql`COALESCE(${divisions.name}, 'Tanpa Divisi')`, kpiProductionEntries.metricType);

  // Postgres SUM/COUNT come back as strings — coerce to numbers at the boundary.
  return rows.map((row) => ({
    divisionId: row.divisionId,
    divisionName: row.divisionName,
    metricType: row.metricType,
    unit: row.unit,
    totalQuantity: Number(row.totalQuantity),
    employeeCount: Number(row.employeeCount),
    entryCount: Number(row.entryCount),
  }));
}
