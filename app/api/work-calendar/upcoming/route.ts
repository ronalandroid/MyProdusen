import { NextRequest } from 'next/server';
import { gte } from 'drizzle-orm';
import { db, workCalendarDays } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { successResponse, unauthorizedResponse } from '@/utils/response';
import { handleApiError } from '@/lib/core/route-handler';
import { selectUpcomingHolidays, DEFAULT_UPCOMING_LIMIT } from '@/lib/attendance/upcoming-holidays';

/**
 * Read-only upcoming holidays for ANY authenticated user — the employee-facing
 * half of the work calendar ("sync ke semua akun"). Superadmin CRUD stays on
 * /api/work-calendar; this endpoint never exposes anything but public holiday
 * info (date, name, type, paid flag).
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);

    const todayIso = new Date().toISOString().slice(0, 10);
    // DB-side lower bound; the pure selector applies type filter + ordering + cap.
    const rows = await db
      .select({
        id: workCalendarDays.id,
        date: workCalendarDays.date,
        name: workCalendarDays.name,
        type: workCalendarDays.type,
        isPaidHoliday: workCalendarDays.isPaidHoliday,
      })
      .from(workCalendarDays)
      .where(gte(workCalendarDays.date, todayIso));

    const upcoming = selectUpcomingHolidays(rows, todayIso, DEFAULT_UPCOMING_LIMIT);
    return successResponse(upcoming);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}
