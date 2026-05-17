# Reference Repository Analysis — MyProdusen

> Purpose: extract feature patterns from external attendance projects and decide
> what fits MyProdusen without changing the stack, UI tone, logo, or brand
> colours. This document is **research output only**. Code is not copied; the
> ideas are re-implemented in our own stack when adopted.

## 1. Repo Overview

### 1.1 ikhsan3adi/absensi-karyawan-gps-barcode

| Field        | Value                                                   |
| ------------ | ------------------------------------------------------- |
| URL          | https://github.com/ikhsan3adi/absensi-karyawan-gps-barcode |
| License      | MIT                                                     |
| Stack        | Laravel 11, Jetstream + Livewire, Tailwind, MySQL/MariaDB, Endroid QR Code, Leaflet.js, OpenStreetMap |
| Compatibility with MyProdusen | None at code level. Patterns only.     |
| Notable language split | Blade 54%, PHP 45%                            |

### 1.2 josephines1/o-present

| Field        | Value                                                   |
| ------------ | ------------------------------------------------------- |
| URL          | https://github.com/josephines1/o-present                |
| License      | MIT                                                     |
| Stack        | CodeIgniter 4, Tabler.io (Bootstrap 5), jQuery, WebcamJS, Leaflet, Myth/Auth, MySQL |
| Compatibility with MyProdusen | None at code level. Patterns only.     |
| Notable     | Roles: head / admin / pegawai. Selfie via WebcamJS, GPS via geolocation. |

### 1.3 License compliance

Both repos are MIT. We may legally copy code with attribution. We choose **not
to**, because:

- Both are PHP frameworks. Translating Blade/Livewire/CodeIgniter views into
  our Next.js + TypeScript + Drizzle stack would be a rewrite anyway.
- Re-implementing keeps our existing patterns (Drizzle schema, RBAC, audit
  log, protected selfie route) consistent.
- If any helper snippet is re-used verbatim later, attribution will live in
  the corresponding source file with a `Source: <url>, MIT License` comment.

## 2. Feature List From Each Repo

### 2.1 absensi-karyawan-gps-barcode

- GPS attendance (employee submits coordinates).
- QR/barcode-based attendance scan (admin generates per-employee barcode).
- Admin and Superadmin dashboards.
- Per-employee attendance history.
- Daily / weekly / monthly attendance reports.
- Employee CRUD with seeders + factory.
- Map preview (Leaflet + OpenStreetMap) for office location.
- Excel **import + export** for employees and attendance.
- "Pengajuan Absensi" (employee files an attendance request when they could
  not check in; admin reviews and approves).
- Multi-tier roles (employee / admin / superadmin).
- Dark dashboard mode.

### 2.2 o-present

- GPS-based attendance with browser geolocation.
- Selfie-based attendance using WebcamJS, files saved to
  `public/assets/img/foto_presensi`.
- Excel export of attendance reports.
- Filter and live search across master tables.
- Master data: jabatan (positions), lokasi presensi (work locations),
  pegawai (employees).
- Multi-role auth: pegawai / admin / head (RoleFilter, custom permissions).
- "Pengajuan Ketidakhadiran" (cuti / izin / sakit) workflow with approval
  rules and PDF surat keterangan upload.
- Daily and monthly attendance reports for head/admin.
- Profile editing, forgot password, change email via SMTP.
- Browser must be served over HTTPS (geolocation requirement).

## 3. What Is Useful For MyProdusen

These are **feature ideas worth adopting**. None require stack changes.

| # | Idea | Source | Status in MyProdusen | Priority |
| - | ---- | ------ | -------------------- | -------- |
| 1 | Realtime selfie + GPS check-in/out | both | Already implemented | done |
| 2 | Protected selfie storage | (we do this better than the references) | Done | done |
| 3 | Geo-fence validation server-side | (we do this better than the references) | Done | done |
| 4 | Daily / weekly / monthly attendance presets | absensi-* | Partially: report has filter range. Add quick-range tabs. | **P1** |
| 5 | Employee XLSX import + export | absensi-* | Export done (CSV + UTF-8-BOM XLSX). Import not done. | **P1** |
| 6 | Live search across employee/location tables | o-present | Not done yet. Should be server-side `?search=` for paginated tables. | **P1** |
| 7 | OSM map preview of work location | both | Shipped: zero-dep tiled preview in `src/components/locations/WorkLocationMap.tsx` + `lib/maps/osm-tile-math.ts`. Tile URL configurable via `NEXT_PUBLIC_OSM_TILE_URL`. | done |
| 8 | Attendance request flow when employee missed check-in/out | absensi-* | Backend exists via `AttendanceException` + admin review page. UI for employee submission needs polish. | **P1** |
| 9 | Multi-role auth (employee / admin / superadmin) | both | We already have SUPERADMIN, ADMIN_HR, SUPERVISOR, EMPLOYEE. | done |
| 10 | Filterable/sortable master data tables | both | Partial: list pages exist, filters need server-side. | **P1** |
| 11 | Profile self-service (avatar, change email, password) | o-present | Profile page exists, change email/avatar can be tightened. | **P1** |
| 12 | QR/barcode attendance | absensi-* | Conflicts with our "realtime selfie only" rule for MVP. PRD already has it as Phase 2. | **P2** |
| 13 | Face matching / liveness / anti-fake GPS | both implied | Already classified as Phase 2 in PRD. | **P2** |
| 14 | PDF attestation upload (sick/leave) | o-present | We don't currently require it; could be added behind a feature flag. | **P2** |

## 4. What Should Be Ignored

The following patterns from the references **should not** be adopted, with
reasoning so future contributors know.

| # | Idea | Why we skip it |
| - | ---- | -------------- |
| 1 | Storing selfies in `public/` static folder | Conflicts with our private-storage rule. We already serve through `/api/attendances/:id/selfie/{check-in|check-out}`. |
| 2 | WebcamJS dependency | We already use native `navigator.mediaDevices.getUserMedia()` + canvas, which is more modern, smaller, and TypeScript-friendly. |
| 3 | Auto-approve "sakit" without manager review | Conflicts with our PRD: every leave/sick/permission requires approval (or auto-rules documented per-company). |
| 4 | Saving selfies as base64 to DB | Forbidden in our docs. |
| 5 | Modifying vendor packages (myth/auth) directly | Anti-pattern. Our auth is in `lib/auth.ts` and middleware. |
| 6 | Tabler.io / Bootstrap UI kit | Conflicts with our Tailwind + brand tokens. Adopt **patterns**, not the toolkit. |
| 7 | jQuery | Not part of our stack; React handles rerenders. |
| 8 | Direct Excel import without validation | We will only accept XLSX with strict Zod schema validation + dry-run preview. |
| 9 | Nightly Laravel/PHP tooling | Not relevant. |
| 10 | Open registration with default password "123456" | Major security regression. Our flow is bootstrap superadmin + invite-style registration. |
| 11 | Disabling location HTTPS requirement via custom headers | Browsers correctly block insecure geolocation. Coolify already terminates HTTPS for us. |

## 5. MVP / P1 / P2 Classification

Based on `/docs/prd.md` priorities.

### P0 / MVP — already shipped

- Auth + RBAC.
- Employee management with auto-NIP.
- Work location management.
- Realtime selfie attendance (no manual upload).
- GPS + geo-fence backend validation, hardened.
- Outside-radius reject vs pending workflow.
- Protected selfie viewing (`/api/attendances/:id/selfie/{check-in|check-out}`).
- Pending geo-review admin queue (existing `AttendanceException` + review page).
- Attendance reports + CSV export with audit-logged exports.
- Audit log for sensitive actions.
- Notifications for leave / KPI / pending geo.
- Persistent storage on Coolify volume + backup docs.

Reference repos validated this scope but contributed no missing P0 items.

### P1 — to plan next

1. Daily / weekly / monthly attendance preset tabs on the report page (one
   click to switch ranges, while keeping current filter parity).
2. Employee XLSX **import** with dry-run preview, schema validation, and
   audit-logged commit. Export already exists.
3. Server-side `?search=` parameter on employee, work location, and shift
   list endpoints, with debounced UI input.
5. Employee-facing UI for `AttendanceException` submission (manual
   adjustment / missed checkout) reusing our existing exception API.
6. Profile self-service hardening: change email confirmation, avatar upload
   wired to the same private storage discipline.

### P2 — defer

- QR / barcode attendance.
- Face matching / liveness detection / anti-fake GPS.
- PDF medical certificate upload.
- Native mobile app.
- Payroll integration.

## 6. UI/UX Adaptation Notes

- Keep existing tokens: yellow `#FDC704`, red `#B51B19`, black `#000000`,
  gray `#E5E3E6`. Do not adopt Tabler colours or themes.
- Adopt **layout patterns**, not visual design:
  - Daily/weekly/monthly preset chips at the top of the report page.
  - Toolbar with search input + filter button + export button.
  - Modal-based attendance detail with selfie viewer (already in place).
  - Map preview as a small, optional section, not a hero image.
- Tables stay paginated server-side. No infinite scroll, no DataTables
  jQuery libraries.
- Live search input should debounce 300ms before firing the request.
- Continue using accessible status badges. Add a geo-status badge palette
  consistent with attendance-history page.
- All reference UIs use heavy headers; we keep a slim brand bar. Maintain
  existing spacing and typography rhythm.

## 7. Security Adaptation Notes

| Concern | Reference behaviour | MyProdusen behaviour |
| ------- | ------------------- | -------------------- |
| Selfie storage | Public `public/assets/img/foto_presensi/` | Private `/app/uploads/attendance-selfies/` + protected API route. |
| Default password | Hard-coded `123456` for new accounts | Reject. Bootstrap superadmin + invite/reset flow with strong password policy. |
| Geolocation HTTPS workaround | Custom `Content-Security-Policy: upgrade-insecure-requests` | Don't workaround. Coolify provides HTTPS; geolocation requires it by browser policy. |
| Auth filter modification | Edits `vendor/` files | Forbidden. Our auth lives in `lib/auth.ts` + `middleware.ts` only. |
| Excel import | Read raw rows, no validation | Use Zod schema, dry-run, row-level errors, max row cap, audit-logged commit. |
| RBAC | RoleFilter overrides | We use `lib/permissions.ts` + per-route `requireAuth` + scope checks. |
| Audit log | Limited | Already wired for check-in, check-out, exports, selfie views, geo events, leave, KPI. |

## 8. Database Impact

No reference idea adopted in P1/P2 requires destructive migrations.

| New work | Schema change? | Migration |
| -------- | -------------- | --------- |
| Daily/weekly/monthly presets | None | None |
| Employee XLSX import | None | None |
| Server-side `?search=` | None | Optional: trigram index on `Employee.fullName`, `Employee.nip` if performance needs it. Add in a separate safe migration if/when load demands it. |
| Map preview | None | Reuses `WorkLocation.latitude`, `WorkLocation.longitude`, `WorkLocation.radius`. |
| Employee exception submission UI | None | Reuses `AttendanceException` table. |

If we ever adopt P2 face-match or liveness, that becomes a new table
(`face_embeddings`) and is out of scope here.

## 9. Implementation Recommendations

1. Treat reference repos as **functional spec** only. Do not import any
   PHP/JS code.
2. For each P1 item, write a small spec referencing the section above before
   coding, then implement in one Workstream at a time.
3. Re-use existing modules:
   - `lib/reports/attendance-history.ts` for daily/weekly/monthly presets.
   - `lib/upload.ts` patterns for any new private-storage upload (avatar,
     PDF certificate).
   - `app/api/attendance/exceptions/*` for the employee-submitted exception
     flow.
   - Existing `Notification` writer for any approval/rejection UX.
4. The work-location map preview ships in
   `src/components/locations/WorkLocationMap.tsx`. It is a zero-dependency
   tiled preview (3×3 OSM tiles + an SVG radius overlay) rather than a
   full Leaflet runtime, which keeps the bundle untouched and side-steps
   the OSM client-policy risks. Tile URL is configurable via
   `NEXT_PUBLIC_OSM_TILE_URL` for paid providers.
5. For XLSX import, use a streaming reader (`exceljs` worksheet stream) so
   memory stays low on the VPS. Cap at a configurable
   `EMPLOYEE_IMPORT_MAX_ROWS`.
6. No code changes happen in this workstream. Workstream 2 begins with the
   Attendance + GPS + Selfie scope listed in the project brief.

## 10. Risks

| # | Risk | Mitigation |
| - | ---- | ---------- |
| 1 | Bundle bloat from a future map library | Avoided altogether by using static OSM tiles. If we adopt Leaflet later, lazy-load and audit gzipped size before merging. |
| 2 | Excel import edge cases (encoding, quoting, dates) | Dry-run preview + per-row Zod errors before committing. |
| 3 | Live search hot path overload | Server-side debounce, full-text or trigram index, pagination kept. |
| 4 | Scope creep into P2 (QR, face matching) | Defer to Phase 2 per `/docs/prd.md`. |
| 5 | Attribution gap if any helper snippet is reused later | Add a `Source: <url>, MIT License` comment in the file header. |
| 6 | Auto-approve patterns leaking into our leave flow | Explicitly forbidden in section 4. Ensure code review catches it. |
| 7 | OpenStreetMap usage policy | OSM tiles are free under fair-use; for higher traffic, switch to MapTiler/Mapbox with an env-driven API key. Document in `/docs/DEPLOYMENT.md` if adopted. |

---

_Last reviewed: 2026-05-17. Update this file when reference repos are
revisited or when an item moves between MVP/P1/P2._
