import { NextRequest, NextResponse } from 'next/server';
import { announcementService } from '@/src/services/announcement/announcement.service';
import { getCurrentUser } from '@/lib/auth-context';
import { z } from 'zod';

const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title wajib diisi'),
  content: z.string().min(10, 'Content minimal 10 karakter'),
  category: z.enum(['GENERAL', 'POLICY', 'EVENT', 'EMERGENCY']),
  priority: z.enum(['NORMAL', 'IMPORTANT', 'URGENT']),
  targetAudience: z.string().default('ALL'),
  expiresAt: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  imageUrl: z.string().url().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    return NextResponse.json({ data: announcements });
  } catch (error: any) {
    console.error('Get announcements error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN_HR and SUPERADMIN can create announcements
    if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN_HR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = createAnnouncementSchema.parse(body);

    const announcement = await announcementService.createAnnouncement({
      ...validated,
      publishedBy: user.id,
    });

    return NextResponse.json({ data: announcement }, { status: 201 });
  } catch (error: any) {
    console.error('Create announcement error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
