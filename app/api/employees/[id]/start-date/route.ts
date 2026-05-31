import { NextRequest, NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db, employees } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { logAudit } from '@/lib/audit';
import { validateStartDate } from '@/src/services/employees/work-duration.service';

const PRIVATE_HEADERS = { 'Cache-Control': 'no-store, private', Pragma: 'no-cache', Expires: '0' };

function fail(code: string, message: string, status = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status, headers: PRIVATE_HEADERS });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'SUPERADMIN') return fail('ACCESS_DENIED', 'Hanya Superadmin yang dapat mengubah tanggal mulai kerja.', 403);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const validation = validateStartDate(body.workStartDate || body.startDate, new Date(), { allowFuture: Boolean(body.allowFuture) });
    if (!validation.valid) return fail('INVALID_START_DATE', validation.reason || 'Tanggal mulai kerja tidak valid.', 422);
    const [before] = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
    if (!before) return fail('EMPLOYEE_NOT_FOUND', 'Karyawan tidak ditemukan.', 404);
    const startDate = new Date(body.workStartDate || body.startDate);
    await db.execute(sql`UPDATE "Employee" SET "work_start_date" = ${startDate}, "start_date_set_by" = ${user.userId}, "start_date_set_at" = ${new Date()}, "updatedAt" = ${new Date()} WHERE "id" = ${id}`);
    await logAudit(user.userId, (before as any).workStartDate ? 'EMPLOYEE_START_DATE_UPDATED' : 'EMPLOYEE_START_DATE_SET', 'Employee', id, { workStartDate: (before as any).workStartDate }, { workStartDate: startDate }, request);
    return NextResponse.json({ success: true, data: { id, workStartDate: startDate } }, { headers: PRIVATE_HEADERS });
  } catch (error: any) {
    if (error?.message === 'Unauthorized') return fail('ACCESS_DENIED', 'Anda harus login', 401);
    return fail('START_DATE_UPDATE_FAILED', 'Gagal menyimpan tanggal mulai kerja.', 400);
  }
}
