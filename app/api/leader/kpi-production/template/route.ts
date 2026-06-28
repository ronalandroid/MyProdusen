import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { forbiddenResponse, unauthorizedResponse } from '@/utils/response';
import { handleApiError } from '@/lib/core/route-handler';
import { buildTemplateXlsx, xlsxDownloadHeaders, type ExcelColumn } from '@/lib/excel/workbook';

export const KPI_PRODUCTION_IMPORT_COLUMNS: ExcelColumn[] = [
  { header: 'ID Karyawan', key: 'employeeId', format: 'text', width: 28 },
  { header: 'Tanggal (YYYY-MM-DD)', key: 'date', format: 'text', width: 22 },
  { header: 'Metrik', key: 'metricType', format: 'text', width: 24 },
  { header: 'Jumlah', key: 'quantity', format: 'number', width: 14 },
];

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'LEADER') return forbiddenResponse('Anda tidak memiliki akses Leader');

    const buffer = await buildTemplateXlsx({
      name: 'Input KPI Produksi',
      columns: KPI_PRODUCTION_IMPORT_COLUMNS,
      example: { employeeId: 'contoh: id/user-id karyawan tim', date: '2026-06-01', metricType: 'Dimsum Ayam', quantity: 500 },
    });

    return new Response(new Uint8Array(buffer), {
      headers: xlsxDownloadHeaders('template_kpi_produksi.xlsx'),
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}
