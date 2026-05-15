import { NextRequest, NextResponse } from 'next/server';
import { overtimeService } from '@/src/services/overtime/overtime.service';
import { getCurrentUser } from '@/lib/auth-context';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';

const createRequestSchema = z.object({
  overtimeDate: z.string().transform((val) => new Date(val)),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format waktu harus HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format waktu harus HH:MM'),
  durationHours: z.number().min(0.5, 'Durasi minimal 0.5 jam'),
  rateId: z.string().min(1, 'Rate wajib dipilih'),
  reason: z.string().min(10, 'Alasan minimal 10 karakter'),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as any;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const filters: any = {};

    // Employee can only see their own requests
    if (user.role === 'EMPLOYEE') {
      filters.employeeId = user.employeeId;
    } else if (searchParams.get('employeeId')) {
      filters.employeeId = searchParams.get('employeeId')!;
    }

    if (status) filters.status = status;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const requests = await overtimeService.getRequests(filters);

    return NextResponse.json({ data: requests });
  } catch (error: any) {
    console.error('Get overtime requests error:', error);
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

    if (!user.employeeId) {
      return NextResponse.json(
        { error: 'User tidak terhubung dengan karyawan' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = createRequestSchema.parse(body);

    const overtimeRequest = await overtimeService.createRequest({
      ...validated,
      employeeId: user.employeeId,
    });
    await logAudit(user.id, 'CREATE', 'OvertimeRequest', overtimeRequest.id, undefined, overtimeRequest, request);

    return NextResponse.json({ data: overtimeRequest }, { status: 201 });
  } catch (error: any) {
    console.error('Create overtime request error:', error);
    
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
