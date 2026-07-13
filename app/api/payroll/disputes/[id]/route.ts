import { NextRequest } from 'next/server';
import { z } from 'zod';
import { payrollDisputeService } from '@/services/payroll/payroll-dispute.service';
import { getRequestBody, requireAuth } from '@/lib/middleware';
import { successResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';
import { logAudit } from '@/lib/audit';
import { handleApiError } from '@/lib/core/route-handler';

const reviewSchema = z.object({
  status: z.enum(['RESOLVED', 'REJECTED']),
  reviewNote: z.string().min(5, 'Catatan keputusan minimal 5 karakter'),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'SUPERADMIN') {
      return forbiddenResponse('Hanya Superadmin yang dapat memutuskan aduan gaji');
    }

    const { id } = await params;
    const body = await getRequestBody(request);
    const validation = reviewSchema.safeParse(body);
    if (!validation.success) return validationErrorResponse(validation.error.errors[0].message);

    const updated = await payrollDisputeService.reviewDispute({
      id,
      reviewerUserId: user.userId,
      status: validation.data.status,
      reviewNote: validation.data.reviewNote,
    });
    await logAudit(user.userId, 'UPDATE', 'PayrollDispute', id, undefined, { status: updated.status }, request);

    return successResponse(updated, validation.data.status === 'RESOLVED' ? 'Aduan disetujui.' : 'Aduan ditolak.');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}
