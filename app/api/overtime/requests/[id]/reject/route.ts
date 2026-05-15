import { NextRequest, NextResponse } from 'next/server';
import { overtimeService } from '@/src/services/overtime/overtime.service';
import { getCurrentUser } from '@/lib/auth-context';
import { z } from 'zod';

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN_HR' && user.role !== 'SUPERVISOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = rejectSchema.parse(body);

    const overtimeRequest = await overtimeService.rejectRequest(
      params.id,
      user.id,
      validated.rejectedReason
    );

    return NextResponse.json({ data: overtimeRequest });
  } catch (error: any) {
    console.error('Reject overtime error:', error);
    
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
