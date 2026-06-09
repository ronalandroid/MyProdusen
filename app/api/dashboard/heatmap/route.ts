import { NextRequest } from 'next/server';
import { db, employees, attendances } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse } from '@/utils/response';
import { eq, and, gte, desc } from 'drizzle-orm';
import { handleApiError } from '@/lib/core/route-handler';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    const searchParams = request.nextUrl.searchParams;
    let targetEmployeeId = searchParams.get('employeeId');

    const [currentEmployee] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.userId, user.userId))
      .limit(1);

    if (!targetEmployeeId) {
      if (!currentEmployee) {
        return errorResponse('Employee profile not found');
      }
      targetEmployeeId = currentEmployee.id;
    } else {
      // Authorization Check
      if (user.role === 'EMPLOYEE' && currentEmployee?.id !== targetEmployeeId) {
        return unauthorizedResponse();
      }

    }

    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    const attendanceRecords = await db
      .select({
        checkInTime: attendances.checkInTime,
        status: attendances.status,
      })
      .from(attendances)
      .where(
        and(
          eq(attendances.employeeId, targetEmployeeId),
          gte(attendances.checkInTime, oneYearAgo)
        )
      )
      .orderBy(desc(attendances.checkInTime));

    // Group by date (YYYY-MM-DD)
    const heatmapData: Record<string, string> = {};
    for (const record of attendanceRecords) {
      if (record.checkInTime) {
        const dateKey = new Date(record.checkInTime).toISOString().slice(0, 10);
        // If there are multiple records per day, keep the first one or prioritize PRESENT/LATE
        if (!heatmapData[dateKey]) {
          heatmapData[dateKey] = record.status;
        }
      }
    }

    return successResponse({ heatmap: heatmapData });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return handleApiError(error);
  }
}
