import { NextRequest } from 'next/server';
import { announcementService } from '@/src/services/announcement/announcement.service';
import { getCurrentUser } from '@/lib/auth-context';
import { z } from 'zod';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';
import { handleApiError } from '@/lib/core/route-handler';
import { logger } from '@/lib/logger';

const addCommentSchema = z.object({
  comment: z.string().min(1, 'Comment wajib diisi'),
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

    const body = await request.json();
    const validated = addCommentSchema.parse(body);

    const comment = await announcementService.addComment({
      announcementId: params.id,
      userId: user.id,
      comment: validated.comment,
    });

    return successResponse(comment, undefined, 201);
  } catch (error: any) {
    logger.error('Add comment error', { error });
    
    if (error.name === 'ZodError') {
      return validationErrorResponse(error.errors?.[0]?.message || 'Validation error');
    }

    return handleApiError(error);
  }
}
