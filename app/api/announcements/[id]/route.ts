import { NextRequest, NextResponse } from 'next/server';
import { announcementService } from '@/src/services/announcement/announcement.service';
import { getCurrentUser } from '@/lib/auth-context';
import { z } from 'zod';

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const announcement = await announcementService.getAnnouncementById(
      params.id,
      user.id
    );

    // Mark as read
    await announcementService.markAsRead(params.id, user.id);

    return NextResponse.json({ data: announcement });
  } catch (error: any) {
    console.error('Get announcement error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message.includes('tidak ditemukan') ? 404 : 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN_HR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateAnnouncementSchema.parse(body);

    const announcement = await announcementService.updateAnnouncement(
      params.id,
      validated
    );

    return NextResponse.json({ data: announcement });
  } catch (error: any) {
    console.error('Update announcement error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message.includes('tidak ditemukan') ? 404 : 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await announcementService.deleteAnnouncement(params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete announcement error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
