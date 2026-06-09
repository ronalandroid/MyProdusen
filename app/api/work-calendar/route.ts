import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { db, workCalendarDays } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { errorResponse, forbiddenResponse, successResponse, unauthorizedResponse } from '@/utils/response';
import { logAudit } from '@/lib/audit';
import { desc, eq } from 'drizzle-orm';
import { handleApiError } from '@/lib/core/route-handler';

function assertSuperadmin(role: string) {
  if (role !== 'SUPERADMIN') throw new Error('FORBIDDEN');
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    assertSuperadmin(user.role);
    const rows = await db.select().from(workCalendarDays).orderBy(desc(workCalendarDays.date));
    return successResponse(rows);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    if (error.message === 'FORBIDDEN') return forbiddenResponse('Hanya Superadmin yang dapat melihat kalender kerja');
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    assertSuperadmin(user.role);
    const body = await request.json();
    if (!body.date || !body.name) return errorResponse('Tanggal dan nama kalender wajib diisi', 422);
    const id = nanoid();
    const [row] = await db.insert(workCalendarDays).values({
      id,
      date: body.date,
      name: body.name,
      type: body.type || 'COMPANY_HOLIDAY',
      isPaidHoliday: body.isPaidHoliday ?? true,
      payMultiplier: Number(body.payMultiplier ?? 2),
      createdBy: user.userId,
    }).returning();
    await logAudit(user.userId, 'WORK_CALENDAR_CREATE', 'WorkCalendarDay', id, undefined, row, request);
    return successResponse(row, 'Kalender kerja berhasil dibuat', 201);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    if (error.message === 'FORBIDDEN') return forbiddenResponse('Hanya Superadmin yang dapat membuat kalender kerja');
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    assertSuperadmin(user.role);
    const body = await request.json();
    if (!body.id) return errorResponse('ID kalender wajib diisi', 422);
    const [oldRow] = await db.select().from(workCalendarDays).where(eq(workCalendarDays.id, body.id)).limit(1);
    if (!oldRow) return errorResponse('Kalender kerja tidak ditemukan', 404);
    const [row] = await db.update(workCalendarDays).set({
      date: body.date ?? oldRow.date,
      name: body.name ?? oldRow.name,
      type: body.type ?? oldRow.type,
      isPaidHoliday: body.isPaidHoliday ?? oldRow.isPaidHoliday,
      payMultiplier: body.payMultiplier !== undefined ? Number(body.payMultiplier) : oldRow.payMultiplier,
      updatedAt: new Date(),
    }).where(eq(workCalendarDays.id, body.id)).returning();
    await logAudit(user.userId, 'WORK_CALENDAR_UPDATE', 'WorkCalendarDay', body.id, oldRow, row, request);
    return successResponse(row, 'Kalender kerja berhasil diperbarui');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    if (error.message === 'FORBIDDEN') return forbiddenResponse('Hanya Superadmin yang dapat memperbarui kalender kerja');
    return handleApiError(error);
  }
}
