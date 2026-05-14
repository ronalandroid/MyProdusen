import { NextRequest } from 'next/server';
import { workLocationService } from '@/features/work-locations/work-location.service';
import { successResponse, errorResponse, validationErrorResponse, forbiddenResponse, unauthorizedResponse, notFoundResponse } from '@/lib/utils/response';
import { getRequestBody, requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const updateLocationSchema = z.object({
  name: z.string().min(3, 'Nama lokasi minimal 3 karakter').optional(),
  address: z.string().min(5, 'Alamat minimal 5 karakter').optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    
    if (!hasPermission(user.role, 'LOCATION_READ')) {
      return forbiddenResponse('Anda tidak memiliki akses untuk melihat lokasi kerja');
    }
    
    const location = await workLocationService.getWorkLocationById((await context.params).id);
    
    return successResponse(location);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Lokasi kerja tidak ditemukan') {
      return notFoundResponse(error.message);
    }
    return errorResponse(error.message || 'Gagal mengambil data lokasi kerja');
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    
    if (!hasPermission(user.role, 'LOCATION_UPDATE')) {
      return forbiddenResponse('Anda tidak memiliki akses untuk mengubah lokasi kerja');
    }
    
    const body = await getRequestBody(request);
    
    const validation = updateLocationSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }
    
    const location = await workLocationService.updateWorkLocation((await context.params).id, validation.data);
    
    return successResponse(location, 'Lokasi kerja berhasil diubah');
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Lokasi kerja tidak ditemukan') {
      return notFoundResponse(error.message);
    }
    return errorResponse(error.message || 'Gagal mengubah lokasi kerja');
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    
    if (!hasPermission(user.role, 'LOCATION_DELETE')) {
      return forbiddenResponse('Anda tidak memiliki akses untuk menghapus lokasi kerja');
    }
    
    const result = await workLocationService.deleteWorkLocation((await context.params).id);
    
    return successResponse(result, result.message);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Lokasi kerja tidak ditemukan') {
      return notFoundResponse(error.message);
    }
    return errorResponse(error.message || 'Gagal menghapus lokasi kerja');
  }
}
