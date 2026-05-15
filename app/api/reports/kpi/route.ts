import { NextRequest } from 'next/server';
import { db, kpiResults, employees, kpiItems } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/utils/response';
import { rowsToCsv, csvResponse } from '@/utils/csv-export';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR'].includes(user.role)) return forbiddenResponse('Anda tidak memiliki akses');
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const period = searchParams.get('period');
    const conditions = [];
    if (period) conditions.push(eq(kpiResults.period, period));
    let query = db.select({ result: kpiResults, employee: employees, item: kpiItems })
      .from(kpiResults)
      .leftJoin(employees, eq(kpiResults.employeeId, employees.id))
      .leftJoin(kpiItems, eq(kpiResults.itemId, kpiItems.id));
    if (conditions.length) query = query.where(and(...conditions)) as any;
    const data = await query.orderBy(desc(kpiResults.createdAt));
    const rows = data.map(({ result, employee, item }) => ({
      employeeName: employee?.fullName || '',
      nip: employee?.nip || '',
      period: result.period,
      itemName: item?.name || '',
      actualValue: result.actualValue,
      score: result.score,
      isApproved: result.isApproved ? 'Ya' : 'Tidak',
    }));
    if (format === 'csv') return csvResponse(rowsToCsv(rows, [
      { key: 'nip', label: 'NIP' }, { key: 'employeeName', label: 'Nama' }, { key: 'period', label: 'Periode' },
      { key: 'itemName', label: 'Item KPI' }, { key: 'actualValue', label: 'Nilai Aktual' },
      { key: 'score', label: 'Skor' }, { key: 'isApproved', label: 'Disetujui' },
    ]), 'kpi-report.csv');
    return successResponse(rows);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal mengambil laporan KPI');
  }
}
