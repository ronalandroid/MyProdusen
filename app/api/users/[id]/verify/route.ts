import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, employees } from '@/lib/db';
import { successResponse } from '@/utils/response';
import { requireAuth } from '@/lib/middleware';
import { logAudit } from '@/lib/audit';
import { AppError } from '@/lib/core/app-error';
import { withApiHandler } from '@/lib/core/route-handler';

/**
 * One-click Superadmin sign-off on a self-registered newcomer. Marks the
 * employee profile as reviewed; the badge in the Pengguna list disappears.
 */
export const POST = withApiHandler<{ id: string }>(async (request: NextRequest, { params }) => {
  const actor = await requireAuth(request);
  if (actor.role !== 'SUPERADMIN') {
    throw AppError.forbidden('Hanya Superadmin yang dapat memverifikasi karyawan');
  }

  const resolvedParams = await params;
  const userId = resolvedParams.id;

  const [employee] = await db
    .update(employees)
    .set({ verifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(employees.userId, userId))
    .returning({ id: employees.id, fullName: employees.fullName, verifiedAt: employees.verifiedAt });

  if (!employee) {
    throw AppError.notFound('Profil karyawan tidak ditemukan');
  }

  await logAudit(actor.userId, 'UPDATE', 'Employee', employee.id, undefined, { verifiedAt: employee.verifiedAt, verifiedBy: actor.userId }, request);

  return successResponse(employee, `${employee.fullName} ditandai terverifikasi.`);
});
