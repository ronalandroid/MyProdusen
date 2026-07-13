import { NextRequest } from 'next/server';
import { z } from 'zod';
import { successResponse, validationErrorResponse } from '@/utils/response';
import { requireAuth, getRequestBody } from '@/lib/middleware';
import { AppError } from '@/lib/core/app-error';
import { handleApiError } from '@/lib/core/route-handler';
import { logAudit } from '@/lib/audit';
import { isPublicRegistrationOpen, setPublicRegistrationOpen } from '@/services/settings/registration-settings';

async function requireSuperadmin(request: NextRequest) {
  const actor = await requireAuth(request);
  if (actor.role !== 'SUPERADMIN') {
    throw AppError.forbidden('Hanya Superadmin yang dapat mengatur pendaftaran publik');
  }
  return actor;
}

export async function GET(request: NextRequest) {
  try {
    await requireSuperadmin(request);
    return successResponse({ open: await isPublicRegistrationOpen() });
  } catch (error) {
    return handleApiError(error);
  }
}

const toggleSchema = z.object({ open: z.boolean() });

export async function PUT(request: NextRequest) {
  try {
    const actor = await requireSuperadmin(request);
    const body = await getRequestBody<Record<string, unknown>>(request);
    const validation = toggleSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse('Nilai "open" harus boolean');
    }

    const open = await setPublicRegistrationOpen(validation.data.open, actor.userId);
    await logAudit(actor.userId, 'UPDATE', 'CompanySetting', 'PUBLIC_REGISTRATION_OPEN', undefined, { open }, request);
    return successResponse({ open }, open ? 'Pendaftaran publik DIBUKA.' : 'Pendaftaran publik DITUTUP.');
  } catch (error) {
    return handleApiError(error);
  }
}
