import { NextRequest } from 'next/server';
import { overtimeService } from '@/src/services/overtime/overtime.service';
import { getCurrentUser } from '@/lib/auth-context';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';
import { logger } from '@/lib/logger';

const createRequestSchema = z.object({
  overtimeDate: z.string().transform((val) => new Date(val)),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format waktu harus HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format waktu harus HH:MM'),
  durationHours: z.number().min(0.5, 'Durasi minimal 0.5 jam'),
  rateId: z.string().min(1, 'Rate wajib dipilih'),
  reason: z.string().min(10, 'Alasan minimal 10 karakter'),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as any;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const filters: any = {};

    // BOLA guard: only SUPERADMIN may read other employees' requests via ?employeeId.
    // Every other authenticated role is hard-scoped to their own employee record.
    if (user.role === 'SUPERADMIN') {
      const requestedEmployeeId = searchParams.get('employeeId');
      if (requestedEmployeeId) {
        filters.employeeId = requestedEmployeeId;
      }
    } else {
      if (!user.employeeId) {
        return errorResponse('User tidak terhubung dengan karyawan', 403);
      }
      filters.employeeId = user.employeeId;
    }

    if (status) filters.status = status;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const requests = await overtimeService.getRequests(filters);

    return successResponse(requests);
  } catch (error: any) {
    logger.error('Get overtime requests error', { error });
    return errorResponse('Gagal mengambil data lembur', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    if (!user.employeeId) {
      return errorResponse('User tidak terhubung dengan karyawan');
    }

    const body = await request.json();
    const validated = createRequestSchema.parse(body);

    const overtimeRequest = await overtimeService.createRequest({
      ...validated,
      employeeId: user.employeeId,
    });
    await logAudit(user.id, 'CREATE', 'OvertimeRequest', overtimeRequest.id, undefined, overtimeRequest, request);

    return successResponse(overtimeRequest, undefined, 201);
  } catch (error: any) {
    logger.error('Create overtime request error', { error });
    
    if (error.name === 'ZodError') {
      return validationErrorResponse(error.errors?.[0]?.message || 'Validation error');
    }

    return errorResponse('Gagal membuat pengajuan lembur', 500);
  }
}
