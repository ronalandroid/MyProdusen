import { NextRequest } from 'next/server';
import { overtimeService } from '@/src/services/overtime/overtime.service';
import { getCurrentUser } from '@/lib/auth-context';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';

const rejectSchema = z.object({
  rejectedReason: z.string().min(10, 'Alasan penolakan minimal 10 karakter'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN_HR' && user.role !== 'SUPERVISOR') {
      return forbiddenResponse();
    }

    const body = await request.json();
    const validated = rejectSchema.parse(body);

    const overtimeRequest = await overtimeService.rejectRequest(
      params.id,
      user.id,
      validated.rejectedReason
    );
    await logAudit(user.id, 'REJECT', 'OvertimeRequest', params.id, undefined, overtimeRequest, request);

    return successResponse(overtimeRequest);
  } catch (error: any) {
    console.error('Reject overtime error:', error);
    
    if (error.name === 'ZodError') {
      return validationErrorResponse(error.errors?.[0]?.message || 'Validation error');
    }

    return errorResponse(error.message || 'Internal server error', 500);
  }
}
