import { NextRequest } from 'next/server';
import { z } from 'zod';
import { divisionService } from '@/services/divisions/division.service';
import { successResponse } from '@/utils/response';
import { requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { AppError } from '@/lib/core/app-error';
import { logAudit } from '@/lib/audit';
import { parseJsonBody, withApiHandler } from '@/lib/core/route-handler';

const updateDivisionSchema = z
  .object({
    name: z.string().min(2, 'Nama divisi minimal 2 karakter').max(60, 'Nama divisi maksimal 60 karakter').optional(),
    description: z.string().max(200).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => data.name !== undefined || data.description !== undefined || data.isActive !== undefined, {
    message: 'Tidak ada perubahan yang dikirim',
  });

export const PUT = withApiHandler<{ id: string }>(async (request: NextRequest, { params }) => {
  const user = await requireAuth(request);
  if (!hasPermission(user.role, 'DIVISION_UPDATE')) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk mengubah divisi');
  }

  const data = await parseJsonBody(request, updateDivisionSchema);
  const { id } = await params;
  const before = await divisionService.listDivisions({ includeInactive: true }).then((list) => list.find((d) => d.id === id));
  const division = await divisionService.updateDivision(id, data);
  await logAudit(user.userId, 'UPDATE', 'Division', id, before, division, request);

  return successResponse(division, `Divisi "${division.name}" berhasil diubah`);
});

export const DELETE = withApiHandler<{ id: string }>(async (request: NextRequest, { params }) => {
  const user = await requireAuth(request);
  if (!hasPermission(user.role, 'DIVISION_DELETE')) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk menghapus divisi');
  }

  const { id } = await params;
  const result = await divisionService.deleteDivision(id);
  await logAudit(user.userId, 'DELETE', 'Division', id, { name: result.name }, undefined, request);

  return successResponse(result, `Divisi "${result.name}" berhasil dihapus`);
});
