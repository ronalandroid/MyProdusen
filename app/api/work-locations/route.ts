import { NextRequest } from 'next/server';
import { workLocationService } from '@/services/work-locations/work-location.service';
import { successResponse } from '@/utils/response';
import { requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { AppError } from '@/lib/core/app-error';
import { parseJsonBody, withApiHandler } from '@/lib/core/route-handler';

const createWorkLocationSchema = z.object({
  name: z.string().min(3, 'Nama lokasi minimal 3 karakter'),
  address: z.string().min(5, 'Alamat minimal 5 karakter'),
  latitude: z.number().min(-90).max(90, 'Latitude tidak valid'),
  longitude: z.number().min(-180).max(180, 'Longitude tidak valid'),
  radius: z.number().min(10).max(1000, 'Radius harus antara 10-1000 meter').optional(),
});

export const GET = withApiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);

  if (!hasPermission(user.role, 'LOCATION_READ')) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk melihat data lokasi kerja');
  }

  const { searchParams } = new URL(request.url);
  const isActiveParam = searchParams.get('isActive');
  const search = searchParams.get('search')?.trim() || undefined;
  const filters: { isActive?: boolean; search?: string } | undefined =
    isActiveParam !== null || search
      ? {
          isActive: isActiveParam !== null ? isActiveParam === 'true' : undefined,
          search,
        }
      : undefined;
  const locations = await workLocationService.getWorkLocations(filters);

  return successResponse(locations);
});

export const POST = withApiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);

  if (!hasPermission(user.role, 'LOCATION_CREATE')) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk membuat lokasi kerja');
  }

  const data = await parseJsonBody(request, createWorkLocationSchema);
  const location = await workLocationService.createWorkLocation(data);
  await logAudit(user.userId, 'CREATE', 'WorkLocation', location.id, undefined, location, request);

  return successResponse(location, 'Lokasi kerja berhasil dibuat');
});
