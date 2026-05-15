import { NextRequest } from 'next/server';
import { workLocationService } from '@/services/work-locations/work-location.service';
import { successResponse, errorResponse, validationErrorResponse, forbiddenResponse, unauthorizedResponse } from '@/utils/response';
import { getRequestBody, requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';

const createWorkLocationSchema = z.object({
  name: z.string().min(3, 'Nama lokasi minimal 3 karakter'),
  address: z.string().min(5, 'Alamat minimal 5 karakter'),
  latitude: z.number().min(-90).max(90, 'Latitude tidak valid'),
  longitude: z.number().min(-180).max(180, 'Longitude tidak valid'),
  radius: z.number().min(10).max(1000, 'Radius harus antara 10-1000 meter').optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    if (!hasPermission(user.role, 'LOCATION_READ')) {
      return forbiddenResponse('Anda tidak memiliki akses untuk melihat data lokasi kerja');
    }
    
    const { searchParams } = new URL(request.url);
    const isActiveParam = searchParams.get('isActive');
    
    const filters = isActiveParam !== null ? { isActive: isActiveParam === 'true' } : undefined;
    
    const locations = await workLocationService.getWorkLocations(filters);
    
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
    
    // Validate input
    const validation = createWorkLocationSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }
    
    const location = await workLocationService.createWorkLocation(validation.data);
    await logAudit(user.userId, 'CREATE', 'WorkLocation', location.id, undefined, location, request);
    
    return successResponse(location, 'Lokasi kerja berhasil dibuat');
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error.message || 'Gagal membuat lokasi kerja');
  }
}
