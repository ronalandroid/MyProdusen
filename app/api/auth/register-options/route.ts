import { NextRequest } from 'next/server';
import { and, asc, eq, isNotNull } from 'drizzle-orm';
import { db, employees, users } from '@/lib/db';
import { successResponse, errorResponse } from '@/utils/response';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/core/route-handler';
import { isPublicRegistrationOpen } from '@/services/settings/registration-settings';

/**
 * Public options for the self-service registration form: existing divisions
 * and positions (as suggestions) plus the active leaders a newcomer can pick
 * as their atasan. Intentionally exposes leader names only — nothing else.
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, RATE_LIMITS.API_GENERAL, 'register-options');
    if (rateLimitResult.limited) {
      return errorResponse('Terlalu banyak permintaan. Coba lagi sebentar lagi.', 429);
    }

    const [registrationOpen, divisionRows, positionRows, leaderRows] = await Promise.all([
      isPublicRegistrationOpen(),
      db
        .selectDistinct({ division: employees.division })
        .from(employees)
        .where(and(eq(employees.status, 'ACTIVE'), isNotNull(employees.division))),
      db
        .selectDistinct({ position: employees.position })
        .from(employees)
        .where(and(eq(employees.status, 'ACTIVE'), isNotNull(employees.position))),
      db
        .select({ id: employees.id, fullName: employees.fullName, division: employees.division })
        .from(employees)
        .innerJoin(users, eq(users.id, employees.userId))
        .where(and(eq(users.role, 'LEADER'), eq(users.isActive, true), eq(employees.status, 'ACTIVE')))
        .orderBy(asc(employees.fullName)),
    ]);

    const clean = (values: Array<string | null>) =>
      [...new Set(values.filter((v): v is string => Boolean(v && v.trim())))].sort((a, b) => a.localeCompare(b, 'id'));

    return successResponse({
      registrationOpen,
      divisions: clean(divisionRows.map((r) => r.division)),
      positions: clean(positionRows.map((r) => r.position)),
      leaders: leaderRows.map((leader) => ({ id: leader.id, fullName: leader.fullName, division: leader.division })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
