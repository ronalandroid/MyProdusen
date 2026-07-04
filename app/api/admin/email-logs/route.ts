import { NextRequest } from 'next/server';
import { and, desc, eq, gte, ilike, or, sql } from 'drizzle-orm';
import { db, emailLogs } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { successResponse, unauthorizedResponse, forbiddenResponse } from '@/utils/response';
import { handleApiError } from '@/lib/core/route-handler';

const SUMMARY_WINDOW_DAYS = 7;

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'SUPERADMIN') {
      return forbiddenResponse('Anda tidak memiliki akses');
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const template = searchParams.get('template');
    const search = searchParams.get('search')?.trim().slice(0, 100);
    const parsedLimit = Number.parseInt(searchParams.get('limit') || '25', 10);
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 25;
    const parsedOffset = Number.parseInt(searchParams.get('offset') || '0', 10);
    const offset = Number.isFinite(parsedOffset) ? Math.max(parsedOffset, 0) : 0;

    const conditions = [
      status ? eq(emailLogs.status, status) : undefined,
      template ? eq(emailLogs.template, template) : undefined,
      search
        ? or(ilike(emailLogs.recipient, `%${search}%`), ilike(emailLogs.subject, `%${search}%`))
        : undefined,
    ].filter(Boolean);
    const where = conditions.length ? and(...conditions) : undefined;

    const summaryFrom = new Date(Date.now() - SUMMARY_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const [logs, summaryRows] = await Promise.all([
      db.select({
        id: emailLogs.id,
        template: emailLogs.template,
        recipient: emailLogs.recipient,
        subject: emailLogs.subject,
        status: emailLogs.status,
        errorMessage: emailLogs.errorMessage,
        createdAt: emailLogs.createdAt,
      }).from(emailLogs).where(where).orderBy(desc(emailLogs.createdAt)).limit(limit).offset(offset),
      db.select({
        status: emailLogs.status,
        count: sql<number>`count(*)::int`,
      }).from(emailLogs).where(gte(emailLogs.createdAt, summaryFrom)).groupBy(emailLogs.status),
    ]);

    const summary = { sent: 0, failed: 0, skipped: 0, windowDays: SUMMARY_WINDOW_DAYS };
    for (const row of summaryRows) {
      if (row.status === 'SENT') summary.sent = row.count;
      if (row.status === 'FAILED') summary.failed = row.count;
      if (row.status === 'SKIPPED') summary.skipped = row.count;
    }

    const response = successResponse({ logs, summary });
    response.headers.set('Cache-Control', 'no-store, private');
    return response;
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return handleApiError(error);
  }
}
