import { NextRequest } from 'next/server';
import { announcementService } from '@/src/services/announcement/announcement.service';
import { getCurrentUser } from '@/lib/auth-context';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';
import { handleApiError } from '@/lib/core/route-handler';
import { publishRealtimeEvent, createRealtimeEvent } from '@/lib/realtime/publisher';
import { logger } from '@/lib/logger';
import { updateAnnouncementSchema } from '@/lib/announcements/schema';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const announcement = await announcementService.getAnnouncementById(
      params.id,
      user.id
    );

    // Mark as read
    await announcementService.markAsRead(params.id, user.id);

    return successResponse(announcement);
  } catch (error: any) {
    logger.error('Get announcement error', { error });
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    if (user.role !== 'SUPERADMIN') {
      return forbiddenResponse();
    }

    const body = await request.json();
    const validated = updateAnnouncementSchema.parse(body);

    const announcement = await announcementService.updateAnnouncement(
      params.id,
      validated
    );

    // Push the edit to all clients so changes/archival sync in realtime.
    await publishRealtimeEvent(
      createRealtimeEvent({
        type: 'announcement.created',
        scope: 'global',
        payload: { id: params.id, updated: true },
      }),
    ).catch(() => undefined);

    return successResponse(announcement);
  } catch (error: any) {
    logger.error('Update announcement error', { error });
    
    if (error.name === 'ZodError') {
      return validationErrorResponse(error.errors?.[0]?.message || 'Validation error');
    }

    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    if (user.role !== 'SUPERADMIN') {
      return forbiddenResponse();
    }

    await announcementService.deleteAnnouncement(params.id);

    await publishRealtimeEvent(
      createRealtimeEvent({
        type: 'announcement.created',
        scope: 'global',
        payload: { id: params.id, deleted: true },
      }),
    ).catch(() => undefined);

    return successResponse(null);
  } catch (error: any) {
    logger.error('Delete announcement error', { error });
    return handleApiError(error);
  }
}
