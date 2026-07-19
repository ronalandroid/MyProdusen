import { NextRequest } from 'next/server';
import { z } from 'zod';
import { divisionService } from '@/services/divisions/division.service';
import { successResponse } from '@/utils/response';
import { requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { AppError } from '@/lib/core/app-error';
import { logAudit } from '@/lib/audit';
import { parseJsonBody, withApiHandler } from '@/lib/core/route-handler';

const createDivisionSchema = z.object({
  name: z.string().min(2, 'Nama divisi minimal 2 karakter').max(60, 'Nama divisi maksimal 60 karakter'),
  description: z.string().max(200).optional(),
});

export const GET = withApiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);
  if (!hasPermission(user.role, 'DIVISION_READ')) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk melihat divisi');
  }

  const { searchParams } = request.nextUrl ?? new URL(request.url);
  const includeInactive = searchParams.get('includeInactive') === 'true';
  const list = await divisionService.listDivisions({ includeInactive });

  return successResponse(list);
});

export const POST = withApiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);
  if (!hasPermission(user.role, 'DIVISION_CREATE')) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk menambah divisi');
  }

  const data = await parseJsonBody(request, createDivisionSchema);
  const division = await divisionService.createDivision(data);
  await logAudit(user.userId, 'CREATE', 'Division', division.id, undefined, division, request);

  return successResponse(division, `Divisi "${division.name}" berhasil ditambahkan`);
});
