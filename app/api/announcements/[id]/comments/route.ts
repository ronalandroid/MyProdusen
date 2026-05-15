import { NextRequest, NextResponse } from 'next/server';
import { announcementService } from '@/src/services/announcement/announcement.service';
import { getCurrentUser } from '@/lib/auth-context';
import { z } from 'zod';

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = addCommentSchema.parse(body);

    const comment = await announcementService.addComment({
      announcementId: params.id,
      userId: user.id,
      comment: validated.comment,
    });

    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (error: any) {
    console.error('Add comment error:', error);
    
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
