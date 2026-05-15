import { NextRequest, NextResponse } from 'next/server';
import { overtimeService } from '@/src/services/overtime/overtime.service';
import { getCurrentUser } from '@/lib/auth-context';
import { z } from 'zod';

const createRateSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  multiplier: z.number().min(1, 'Multiplier minimal 1'),
  description: z.string().optional(),
  isWeekday: z.boolean(),
  isWeekend: z.boolean(),
  isHoliday: z.boolean(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    const rates = await overtimeService.getRates(
      isActive === 'true' ? true : isActive === 'false' ? false : undefined
    );

    return NextResponse.json({ data: rates });
  } catch (error: any) {
    console.error('Get overtime rates error:', error);
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

    if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN_HR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = createRateSchema.parse(body);

    const rate = await overtimeService.createRate(validated);

    return NextResponse.json({ data: rate }, { status: 201 });
  } catch (error: any) {
    console.error('Create overtime rate error:', error);
    
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
