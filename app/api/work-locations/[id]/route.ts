import { NextRequest } from 'next/server';
import { workLocationService } from '@/services/work-locations/work-location.service';
import { successResponse } from '@/utils/response';
import { requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { AppError } from '@/lib/core/app-error';
import { parseJsonBody, withApiHandler } from '@/lib/core/route-handler';

const updateLocationSchema = z.object({
  name: z.string().min(3, 'Nama lokasi minimal 3 karakter').optional(),
  address: z.string().min(5, 'Alamat minimal 5 karakter').optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

export const GET = withApiHandler<{ id: string }>(async (request: NextRequest, { params }) => {
  const user = await requireAuth(request);

  if (!hasPermission(user.role, 'LOCATION_READ')) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk melihat lokasi kerja');
  }

  const { id } = await params;
  const location = await workLocationService.getWorkLocationById(id);

  return successResponse(location);
});

export const PUT = withApiHandler<{ id: string }>(async (request: NextRequest, { params }) => {
  const user = await requireAuth(request);

  if (!hasPermission(user.role, 'LOCATION_UPDATE')) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk mengubah lokasi kerja');
  }

  const data = await parseJsonBody(request, updateLocationSchema);
  const { id } = await params;
  const oldLocation = await workLocationService.getWorkLocationById(id);
  const location = await workLocationService.updateWorkLocation(id, data);
  await logAudit(user.userId, 'UPDATE', 'WorkLocation', id, oldLocation, location, request);

  return successResponse(location, 'Lokasi kerja berhasil diubah');
});

export const DELETE = withApiHandler<{ id: string }>(async (request: NextRequest, { params }) => {
  const user = await requireAuth(request);

  if (!hasPermission(user.role, 'LOCATION_DELETE')) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk menghapus lokasi kerja');
  }

  const { id } = await params;
  const oldLocation = await workLocationService.getWorkLocationById(id);
  const result = await workLocationService.deleteWorkLocation(id);
  await logAudit(user.userId, 'DELETE', 'WorkLocation', id, oldLocation, undefined, request);

  return successResponse(result, result.message);
});
