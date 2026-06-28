import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/middleware';
import { forbiddenResponse, unauthorizedResponse, errorResponse, successResponse } from '@/utils/response';
import { handleApiError } from '@/lib/core/route-handler';
import { leaderService } from '@/services/leader/leader.service';
import { logAudit } from '@/lib/audit';
import { publishRealtimeEvent, createRealtimeEvent } from '@/lib/realtime/publisher';
import { parseXlsx } from '@/lib/excel/workbook';
import { KPI_PRODUCTION_IMPORT_COLUMNS } from '../template/route';

const MAX_ROWS = 1000;

const rowSchema = z.object({
  employeeId: z.string().min(1, 'ID Karyawan wajib diisi'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal harus format YYYY-MM-DD').optional().or(z.literal('')),
  metricType: z.string().min(1).optional().or(z.literal('')),
  quantity: z.coerce.number().finite().min(0, 'Jumlah harus angka >= 0'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'LEADER') return forbiddenResponse('Anda tidak memiliki akses Leader');

    const form = await request.formData().catch(() => null);
    const file = form?.get('file');
    if (!(file instanceof File)) return errorResponse('File Excel (.xlsx) wajib diunggah pada field "file"', 422);

    const buffer = Buffer.from(await file.arrayBuffer());
    const rawRows = await parseXlsx(buffer, KPI_PRODUCTION_IMPORT_COLUMNS);
    if (rawRows.length === 0) return errorResponse('Tidak ada baris data pada file', 422);
    if (rawRows.length > MAX_ROWS) return errorResponse(`Maksimal ${MAX_ROWS} baris per impor`, 422);

    let processed = 0;
    const errors: Array<{ row: number; reason: string }> = [];

    for (let i = 0; i < rawRows.length; i++) {
      const parsed = rowSchema.safeParse(rawRows[i]);
      if (!parsed.success) {
        errors.push({ row: i + 2, reason: parsed.error.errors[0]?.message || 'Baris tidak valid' });
        continue;
      }
      try {
        await leaderService.createOrUpdateProductionEntry(user.userId, {
          employeeId: parsed.data.employeeId,
          date: parsed.data.date || undefined,
          metricType: parsed.data.metricType || undefined,
          quantity: parsed.data.quantity,
        });
        processed++;
      } catch (rowError: any) {
        errors.push({ row: i + 2, reason: rowError?.message || 'Gagal menyimpan baris' });
      }
    }

    await logAudit(user.userId, 'KPI_PRODUCTION_IMPORT', 'KpiProductionEntry', undefined, undefined, {
      total: rawRows.length, processed, failed: errors.length,
    }, request);

    // Realtime sync: refresh dashboards/lists for connected clients now.
    if (processed > 0) {
      await publishRealtimeEvent(createRealtimeEvent({
        type: 'dashboard.updated', scope: 'global',
        payload: { source: 'kpi-production.import', processed },
      }));
      await publishRealtimeEvent(createRealtimeEvent({
        type: 'sync.updated', scope: 'user', target: user.userId,
        payload: { source: 'kpi-production.import', processed },
      }));
    }

    return successResponse(
      { total: rawRows.length, processed, failed: errors.length, errors: errors.slice(0, 20) },
      `Impor selesai: ${processed} tersimpan${errors.length ? `, ${errors.length} gagal` : ''}`,
    );
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}
