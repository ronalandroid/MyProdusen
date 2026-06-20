import { NextRequest } from 'next/server';
import { z } from 'zod';
import { kpiService } from '@/services/kpi/kpi.service';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, validationErrorResponse } from '@/utils/response';
import { handleApiError } from '@/lib/core/route-handler';

const createMetricSchema = z.object({
  name: z.string().min(1, 'Nama metrik wajib diisi').max(120),
  unit: z.string().min(1, 'Satuan metrik wajib diisi').max(40),
  active: z.boolean().optional(),
});

const updateMetricSchema = z.object({
  id: z.string().min(1, 'ID metrik KPI wajib diisi'),
  name: z.string().min(1).max(120).optional(),
  unit: z.string().min(1).max(40).optional(),
  active: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'SUPERADMIN' && user.role !== 'LEADER') {
      return forbiddenResponse('Hanya Superadmin dan Leader yang dapat melihat metrik KPI');
    }
    const metrics = await kpiService.getMetrics({ active: true });
    return successResponse(metrics);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'SUPERADMIN') {
      return forbiddenResponse('Hanya Superadmin yang dapat menambahkan metrik KPI');
    }
    const { name, unit, active } = createMetricSchema.parse(await request.json());
    const metric = await kpiService.createMetric(user.userId, { name, unit, active });
    return successResponse(metric, 'Metrik KPI berhasil ditambahkan');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    if (error.name === 'ZodError') return validationErrorResponse(error.errors?.[0]?.message || 'Data metrik tidak valid');
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'SUPERADMIN') {
      return forbiddenResponse('Hanya Superadmin yang dapat memperbarui metrik KPI');
    }
    const { id, name, unit, active } = updateMetricSchema.parse(await request.json());
    const metric = await kpiService.updateMetric(user.userId, id, { name, unit, active });
    return successResponse(metric, 'Metrik KPI berhasil diperbarui');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    if (error.name === 'ZodError') return validationErrorResponse(error.errors?.[0]?.message || 'Data metrik tidak valid');
    return handleApiError(error);
  }
}
