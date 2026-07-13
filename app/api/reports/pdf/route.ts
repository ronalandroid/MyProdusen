import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, getRequestBody } from '@/lib/middleware';
import { errorResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';
import { logAudit } from '@/lib/audit';
import { handleApiError } from '@/lib/core/route-handler';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import {
  assertPdfReportAccess,
  buildPdfDocument,
  buildPdfReportData,
  type PdfReportType,
} from '@/lib/reports/pdf-report';
import { buildComprehensiveReport } from '@/lib/reports/comprehensive-report';

const pdfReportSchema = z.object({
  reportType: z.enum(['attendance_summary', 'kpi_performance', 'payroll_summary', 'executive_hr', 'comprehensive']),
  from: z.string().optional(),
  to: z.string().optional(),
  division: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    assertPdfReportAccess(user.role);

    // PDF generation is heavy — throttle to protect the server.
    const rl = await rateLimit(request, RATE_LIMITS.API_STRICT, 'reports:pdf');
    if (rl.limited) {
      return errorResponse('Terlalu banyak permintaan laporan PDF. Coba lagi sebentar.', 429);
    }

    const body = await getRequestBody(request);
    const validation = pdfReportSchema.safeParse(body);
    if (!validation.success) return validationErrorResponse(validation.error.errors[0].message);

    const pdf = validation.data.reportType === 'comprehensive'
      ? await buildComprehensiveReport(
          { from: validation.data.from, to: validation.data.to, division: validation.data.division },
          user.email,
        )
      : buildPdfDocument(
          await buildPdfReportData(
            validation.data as { reportType: PdfReportType; from?: string; to?: string; division?: string },
            user.email,
          ),
        );

    await logAudit(
      user.userId,
      'DOWNLOAD_PDF',
      'PdfReport',
      validation.data.reportType,
      undefined,
      {
        reportType: validation.data.reportType,
        from: validation.data.from,
        to: validation.data.to,
        division: validation.data.division,
        maxRows: process.env.PDF_REPORT_MAX_ROWS || '1000',
        maxDateRangeMonths: process.env.PDF_REPORT_MAX_DATE_RANGE_MONTHS || '12',
      },
      request,
    );

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="myprodusen-${validation.data.reportType}-${Date.now()}.pdf"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    if (error.message === 'PDF_REPORT_FORBIDDEN') return forbiddenResponse('Hanya Superadmin yang dapat download PDF report');
    return handleApiError(error);
  }
}
