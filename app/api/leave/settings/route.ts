import { NextRequest } from 'next/server';
import { leaveBalanceService } from '@/features/leave/leave-balance.service';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/utils/response';
import { handleApiError } from '@/lib/core/route-handler';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'SUPERADMIN') {
      return forbiddenResponse('Hanya Superadmin yang dapat mengakses pengaturan cuti');
    }
    const globalQuota = await leaveBalanceService.getGlobalLeaveQuota();
    return successResponse({ globalQuota });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'SUPERADMIN') {
      return forbiddenResponse('Hanya Superadmin yang dapat mengubah pengaturan cuti');
    }
    const body = await request.json();
    const { action, quota, year } = body;

    if (action === 'updateGlobal') {
      if (quota === undefined) return errorResponse('Kuota jatah cuti wajib diisi', 422);
      const updated = await leaveBalanceService.updateGlobalLeaveQuota(user.userId, Number(quota));
      return successResponse(updated, 'Kuota jatah cuti global berhasil diperbarui');
    }

    if (action === 'syncGlobal') {
      await leaveBalanceService.syncGlobalQuota(user.userId, year ? Number(year) : undefined);
      return successResponse(null, 'Jatah cuti global berhasil disinkronisasi ke seluruh karyawan aktif');
    }

    return errorResponse('Aksi tidak dikenal', 400);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'SUPERADMIN') {
      return forbiddenResponse('Hanya Superadmin yang dapat memperbarui jatah cuti karyawan');
    }
    const body = await request.json();
    const { employeeId, quota, year, reason } = body;

    if (!employeeId) return errorResponse('ID karyawan wajib diisi', 422);
    if (quota === undefined) return errorResponse('Jatah cuti wajib diisi', 422);

    const updated = await leaveBalanceService.adjustIndividualQuota(
      user.userId,
      employeeId,
      Number(quota),
      year ? Number(year) : undefined,
      reason
    );

    return successResponse(updated, 'Jatah cuti karyawan berhasil diperbarui');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}
