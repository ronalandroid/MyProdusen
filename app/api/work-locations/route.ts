import { NextRequest } from 'next/server';
import { workLocationService } from '@/features/work-locations/work-location.service';
import { successResponse, errorResponse, validationErrorResponse, forbiddenResponse, unauthorizedResponse } from '@/lib/utils/response';
import { getRequestBody, requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const createLocationSchema = z.object({
  name: z.string().min(3, 'Nama lokasi minimal 3 karakter'),
  address: z.string().min(5, 'Alamat minimal 5 karakter'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.number().positive().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    if (!hasPermission(user.role, 'LOCATION_READ')) {
      return forbiddenResponse('Anda tidak memiliki akses untuk melihat lokasi kerja');
    }
    
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    
    const locations = await workLocationService.getWorkLocations(includeInactive);
    
    return successResponse(locations);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error.message || 'Gagal mengambil data lokasi kerja');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    if (!hasPermission(user.role, 'LOCATION_CREATE')) {
      return forbiddenResponse('Anda tidak memiliki akses untuk membuat lokasi kerja');
    }
    
    const body = await getRequestBody(request);
    
    const validation = createLocationSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }
    
    const location = await workLocationService.createWorkLocation(validation.data);
    
    return successResponse(location, 'Lokasi kerja berhasil dibuat');
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error.message || 'Gagal membuat lokasi kerja');
  }
}
