import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from '@/utils/response';
import { csvResponse, rowsToCsv } from '@/utils/csv-export';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import {
  fetchAttendanceHistoryForExport,
  fetchAttendanceHistoryPage,
  getExportMaxRows,
  type AttendanceHistoryRow,
} from '@/lib/reports/attendance-history';
import { resolveAttendanceReportRequest } from '@/lib/reports/attendance-history-access';

const CSV_COLUMNS: { key: keyof CsvRow; label: string }[] = [
  { key: 'date', label: 'Date' },
  { key: 'nip', label: 'NIP' },
  { key: 'employeeName', label: 'Employee Name' },
  { key: 'division', label: 'Division' },
  { key: 'position', label: 'Position' },
  { key: 'workLocation', label: 'Work Location' },
  { key: 'shift', label: 'Shift' },
  { key: 'checkIn', label: 'Check In' },
  { key: 'checkOut', label: 'Check Out' },
  { key: 'totalWorkMinutes', label: 'Total Work Minutes' },
  { key: 'lateMinutes', label: 'Late Minutes' },
  { key: 'earlyLeaveMinutes', label: 'Early Leave Minutes' },
  { key: 'attendanceStatus', label: 'Attendance Status' },
  { key: 'geoStatus', label: 'Geo Status' },
  { key: 'hasCheckInSelfie', label: 'Has Check In Selfie' },
  { key: 'hasCheckOutSelfie', label: 'Has Check Out Selfie' },
];

interface CsvRow extends Record<string, unknown> {
  date: string;
  nip: string;
  employeeName: string;
  division: string;
  position: string;
  workLocation: string;
  shift: string;
  checkIn: string;
  checkOut: string;
  totalWorkMinutes: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  attendanceStatus: string;
  geoStatus: string;
  hasCheckInSelfie: string;
  hasCheckOutSelfie: string;
}

function toCsvRow(row: AttendanceHistoryRow): CsvRow {
  return {
    date: row.attendanceDate,
    nip: row.nip,
    employeeName: row.employeeName,
    division: row.division ?? '',
    position: row.position ?? '',
    workLocation: row.workLocationName ?? '',
    shift: row.shiftName ?? '',
    checkIn: row.checkInTime.toISOString(),
    checkOut: row.checkOutTime ? row.checkOutTime.toISOString() : '',
    totalWorkMinutes: row.totalWorkMinutes,
    lateMinutes: row.lateMinutes,
    earlyLeaveMinutes: row.earlyLeaveMinutes,
    attendanceStatus: row.status,
    geoStatus: row.geoStatus,
    hasCheckInSelfie: row.hasCheckInSelfie ? 'YES' : 'NO',
    hasCheckOutSelfie: row.hasCheckOutSelfie ? 'YES' : 'NO',
  };
}

function buildExportFilename(from?: Date, to?: Date) {
  const fromStr = from ? from.toISOString().split('T')[0] : 'start';
  const toStr = to ? to.toISOString().split('T')[0] : 'end';
  return `attendance-report-${fromStr}-to-${toStr}.csv`;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (!hasPermission(user.role, 'REPORT_VIEW') && user.role !== 'EMPLOYEE') {
      return forbiddenResponse('Anda tidak memiliki akses laporan absensi.');
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const isExport = format === 'csv' || format === 'xlsx';
    const mode = isExport ? 'export' : 'view';

    const resolution = await resolveAttendanceReportRequest(searchParams, user, mode);
    if (!resolution.ok) {
      if (resolution.status === 403) return forbiddenResponse(resolution.error);
      return errorResponse(resolution.error, resolution.status);
    }

    if (isExport) {
      // Permission already enforced inside resolveAttendanceReportRequest.
      const { rows, truncated, total } = await fetchAttendanceHistoryForExport(
        resolution.resolved.filters,
      );

      await logAudit(
        user.userId,
        'EXPORT',
        'AttendanceReport',
        'attendance',
        undefined,
        {
          format: format === 'xlsx' ? 'xlsx' : 'csv',
          scope: resolution.resolved.scope,
          filters: serializeFilters(resolution.resolved.filters),
          rowCount: rows.length,
          totalCount: total,
          truncated,
          maxRows: getExportMaxRows(),
        },
        request,
      );

      if (format === 'xlsx') {
        // Excel-specific library not bundled. Fall back to CSV with a UTF-8 BOM
        // so Microsoft Excel opens it cleanly. Documented in /docs/REPORTS.md.
        const csv = rowsToCsv(rows.map(toCsvRow), CSV_COLUMNS);
        return csvResponse(
          `\uFEFF${csv}`,
          buildExportFilename(resolution.resolved.filters.from, resolution.resolved.filters.to)
            .replace(/\.csv$/, '-excel.csv'),
        );
      }

      const csv = rowsToCsv(rows.map(toCsvRow), CSV_COLUMNS);
      return csvResponse(
        csv,
        buildExportFilename(resolution.resolved.filters.from, resolution.resolved.filters.to),
      );
    }

    const page = Number(searchParams.get('page') ?? '1');
    const pageSize = Number(searchParams.get('pageSize') ?? '25');
    const result = await fetchAttendanceHistoryPage(resolution.resolved.filters, {
      page,
      pageSize,
    });

    return successResponse({
      rows: result.rows,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      scope: resolution.resolved.scope,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal mengambil laporan absensi');
  }
}

function serializeFilters(filters: ReturnType<typeof Object> | any) {
  return {
    from: filters.from instanceof Date ? filters.from.toISOString() : filters.from,
    to: filters.to instanceof Date ? filters.to.toISOString() : filters.to,
    employeeId: filters.employeeId,
    supervisorId: filters.supervisorId,
    division: filters.division,
    workLocationId: filters.workLocationId,
    status: filters.status,
    geoStatus: filters.geoStatus,
    lateOnly: filters.lateOnly,
    missingCheckoutOnly: filters.missingCheckoutOnly,
  };
}
