# Attendance Reports & Export

> Single source of truth for both the on-screen report table and the
> downloadable export. Backed by `lib/reports/attendance-history.ts` so
> on-screen totals always match exported rows.

## Endpoints

| Endpoint | Purpose | Returns |
| -------- | ------- | ------- |
| `GET /api/reports/attendance` | Paginated attendance list (JSON) | JSON page |
| `GET /api/reports/attendance/summary` | Aggregated summary cards | JSON summary |
| `GET /api/reports/attendance?format=csv` | CSV export of the same filtered set | `text/csv` |
| `GET /api/reports/attendance?format=xlsx` | UTF-8-BOM CSV (opens cleanly in Microsoft Excel) | `text/csv` |

A native `.xlsx` writer is intentionally not bundled to keep the VPS
footprint light. The `xlsx` format option emits a UTF-8-BOM CSV that Excel
opens with correct diacritics. Add a real Excel writer (e.g. `exceljs`) only
when a customer asks for it.

## Filters

Every filter is shared across list, summary, and export so they cannot drift.

| Param | Values |
| ----- | ------ |
| `from` | ISO date (start, inclusive) |
| `to` | ISO date (end, inclusive) |
| `employeeId` | Employee primary key |
| `division` | Division text (case-insensitive) |
| `workLocationId` | Work location id |
| `status` | `PRESENT`, `LATE`, `ABSENT`, `LEAVE`, `SICK`, `PERMISSION` |
| `geoStatus` | `INSIDE`, `OUTSIDE`, `GEOFENCE_EXCEPTION`, `UNKNOWN` |
| `lateOnly` | `true` / `false` |
| `missingCheckoutOnly` | `true` / `false` |
| `page`, `pageSize` | List pagination (max page size 200) |
| `format` | `csv`, `xlsx` |

Default date range is the current month. Export must include both `from`
and `to` (HTTP 422 otherwise).

## Permissions

| Role | Scope |
| ---- | ----- |
| Employee | Own data only. Export blocked unless `REPORT_EXPORT` is granted later. |
| Supervisor | Only employees where `employee.supervisorId === supervisor.id`. |
| Admin HR | All employees. Export allowed. |
| Superadmin | All employees. Export allowed. |

Backend enforcement lives in `lib/reports/attendance-history-access.ts`. The
API rejects `format=csv` for roles without `REPORT_EXPORT` and silently
narrows the SQL `WHERE` clause to the viewer's scope.

## CSV columns

```
Date, NIP, Employee Name, Division, Position, Work Location, Shift,
Check In, Check Out, Total Work Minutes, Late Minutes, Early Leave Minutes,
Attendance Status, Geo Status, Has Check In Selfie, Has Check Out Selfie
```

Selfie columns store `YES` / `NO` flags only — never the path, URL, or
binary.

## Performance

- Default range is the current month; the table is paginated (default page
  size 25, max 200).
- Export is row-capped by `ATTENDANCE_EXPORT_MAX_ROWS` (default 5000); the
  audit log records `truncated: true` if the result set was clipped.
- Single SQL query joins `Attendance + Employee + WorkLocation + Shift` to
  avoid N+1.
- Selfie binaries are never read by the report. The list and CSV both derive
  `Has Check In Selfie` / `Has Check Out Selfie` from metadata columns.
- Indexes added in `0010_attendance_report_indexes.sql` cover the canonical
  paginated read path. Run `npm run perf:explain` against staging to verify
  index usage.

## Audit logging

Every successful export writes one row to `AuditLog`:

```json
{
  "action": "EXPORT",
  "entity": "AttendanceReport",
  "newValue": {
    "format": "csv",
    "scope": "all",
    "filters": { "from": "...", "to": "...", "status": "LATE" },
    "rowCount": 1234,
    "totalCount": 1234,
    "truncated": false,
    "maxRows": 5000
  },
  "ipAddress": "...",
  "userAgent": "..."
}
```

## UI

`/dashboard/reports/attendance` is the canonical surface. It shows summary
cards, the filter bar, daily / weekly / monthly preset chips, the paginated
table, and the CSV download button. The legacy `/dashboard/reports` page
links to it for the attendance category and still hosts leave / KPI report
shells.

The page never preloads selfie images. To inspect a specific selfie, open it
through the SelfieViewer modal on the attendance history page.
