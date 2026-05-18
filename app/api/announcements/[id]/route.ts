import { NextRequest } from 'next/server';
import { announcementService } from '@/src/services/announcement/announcement.service';
import { getCurrentUser } from '@/lib/auth-context';
import { z } from 'zod';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';

const updateAnnouncementSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(10).optional(),
  category: z.enum(['GENERAL', 'POLICY', 'EVENT', 'EMERGENCY']).optional(),
  priority: z.enum(['NORMAL', 'IMPORTANT', 'URGENT']).optional(),
  targetAudience: z.string().optional(),
  expiresAt: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  imageUrl: z.string().url().optional(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

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
    console.error('Get announcement error:', error);
    return errorResponse(error.message || 'Internal server error', error.message.includes('tidak ditemukan') ? 404 : 500);
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

    if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN_HR') {
      return forbiddenResponse();
    }

    const body = await request.json();
    const validated = updateAnnouncementSchema.parse(body);

    const announcement = await announcementService.updateAnnouncement(
      params.id,
      validated
    );

    return successResponse(announcement);
  } catch (error: any) {
    console.error('Update announcement error:', error);
    
    if (error.name === 'ZodError') {
      return validationErrorResponse(error.errors?.[0]?.message || 'Validation error');
    }

    return errorResponse(error.message || 'Internal server error', error.message.includes('tidak ditemukan') ? 404 : 500);
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

    return successResponse(null);
  } catch (error: any) {
    console.error('Delete announcement error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
