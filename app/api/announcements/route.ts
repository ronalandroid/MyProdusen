import { NextRequest } from 'next/server';
import { announcementService } from '@/src/services/announcement/announcement.service';
import { getCurrentUser } from '@/lib/auth-context';
import { z } from 'zod';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';
import { handleApiError } from '@/lib/core/route-handler';
import { publishRealtimeEvent, createRealtimeEvent } from '@/lib/realtime/publisher';
import { notifyAllActiveUsers } from '@/lib/notifications/dispatch';

// Empty strings from optional form fields must not fail `.url()` validation —
// coerce blank imageUrl to undefined before the URL check.
const optionalUrl = z.preprocess(
  (val) => (val === '' || val === null ? undefined : val),
  z.string().url('URL gambar tidak valid').optional(),
);

const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title wajib diisi'),
  content: z.string().min(10, 'Content minimal 10 karakter'),
  category: z.enum(['GENERAL', 'POLICY', 'EVENT', 'EMERGENCY']),
  priority: z.enum(['NORMAL', 'IMPORTANT', 'URGENT']),
  targetAudience: z.string().default('ALL'),
  expiresAt: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  ),
  imageUrl: optionalUrl,
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const isArchived = searchParams.get('isArchived') === 'true';

    const announcements = await announcementService.getAnnouncements({
      category,
      priority,
      isArchived,
      userId: user.id,
    });

    return successResponse(announcements);
  } catch (error: any) {
    console.error('Get announcements error:', error);
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    // Only SUPERADMIN can create announcements
    if (user.role !== 'SUPERADMIN') {
      return forbiddenResponse();
    }

    const body = await request.json();
    const validated = createAnnouncementSchema.parse(body);

    const announcement = await announcementService.createAnnouncement({
      ...validated,
      publishedBy: user.id,
    });

    // Broadcast to every connected client so the announcement appears instantly
    // for all roles (employee, leader, superadmin) without a manual refresh.
    await publishRealtimeEvent(
      createRealtimeEvent({
        type: 'announcement.created',
        scope: 'global',
        payload: {
          id: announcement.id,
          title: announcement.title,
          priority: announcement.priority,
        },
      }),
    ).catch(() => undefined);

    // Persist a notification per active user so it also surfaces in the
    // notification feed/badge across all account levels.
    await notifyAllActiveUsers({
      title: `Pengumuman: ${announcement.title}`,
      message:
        announcement.content.length > 140
          ? `${announcement.content.slice(0, 140)}…`
          : announcement.content,
      type: 'ANNOUNCEMENT',
    });

    return successResponse(announcement, undefined, 201);
  } catch (error: any) {
    console.error('Create announcement error:', error);
    
    if (error.name === 'ZodError') {
      return validationErrorResponse(error.errors?.[0]?.message || 'Validation error');
    }

    return handleApiError(error);
  }
}
