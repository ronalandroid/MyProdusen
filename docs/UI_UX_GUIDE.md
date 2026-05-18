# UI/UX Guide

This guide defines the approved mobile-first interface direction for MyProdusen. It complements `prd.md` and does not change product scope, RBAC, attendance rules, storage rules, or the approved stack: Next.js App Router, TypeScript, Drizzle ORM, PostgreSQL, and Tailwind CSS.

## 1. Design Direction

MyProdusen is a yellow-accent HRIS app for Produsen Dimsum Medan. The interface must feel like a practical internal operations tool: clean, warm, direct, fast to understand, and comfortable for non-technical employees.

Approved visual direction:

- Mobile-first HRIS layout with desktop responsive expansion.
- Yellow brand accent used for primary actions, highlights, and active navigation.
- Soft gray app background with white rounded cards.
- Rounded cards, rounded inputs, and rounded action buttons.
- Clear hierarchy with short Indonesian labels in product UI.
- Dashboard-style information cards with status chips and concise metrics.
- Bottom navigation for core employee mobile flows.
- Professional admin desktop layouts for dense tables, filters, and reports.

Do not redesign the product into a different brand, theme, or UI kit. Do not introduce Bootstrap, Tabler, or unrelated design systems.

## 2. Brand Tokens

Use existing brand colors consistently:

| Token | Value | Usage |
| --- | --- | --- |
| Primary Yellow | `#FFC107` | Primary CTA, active bottom-nav item, key highlights |
| Accent Red | `#E53935` | Danger, rejection, late status |
| Base Black | `#111111` | Primary text |
| Soft Gray | `#F5F5F5` | Backgrounds, borders, neutral areas |
| White | `#FFFFFF` | Cards, panels, form surfaces |

Guidelines:

- Use yellow with restraint; one primary action per main view is preferred.
- Use red only for destructive, rejected, late, or critical states.
- Keep status colors accessible and do not rely on color alone.
- Preserve existing logo and product name.

## 3. Layout System

### Mobile-first shell

Mobile screens should use:

- Safe-area aware page container.
- Sticky or fixed bottom navigation for employee flows.
- Main content cards stacked vertically with consistent spacing.
- Large touch targets, minimum 44 px height.
- Primary action placed near thumb reach when possible.
- Clear loading, empty, error, and success states.

### Desktop admin shell

Desktop screens should use:

- Existing dashboard layout and navigation pattern.
- Filter bar above tables and reports.
- Summary cards before dense data.
- Paginated tables for employees, attendance, KPI, leave, and reports.
- Responsive columns that collapse cleanly on tablets.

### Cards and surfaces

- Cards use white surface, rounded corners, subtle border or shadow.
- Related actions stay inside the relevant card.
- Avoid noisy gradients and decorative elements that reduce clarity.
- Use compact cards for metrics and wider cards for forms or tables.

## 4. Navigation

Employee mobile bottom navigation should prioritize:

1. Dashboard
2. Attendance
3. Leave
4. KPI
5. Profile

Admin and Superadmin navigation should prioritize:

1. Dashboard
2. Employees
3. Attendance
4. Leave
5. KPI
6. Reports
7. Settings / Audit, depending on role

Navigation rules:

- Active item uses yellow accent and clear label.
- Disabled or unauthorized items must not appear as accessible routes.
- Backend RBAC remains source of truth even if navigation hides items.
- Navigation labels should be short and understandable in Indonesian UI.

## 5. Required Screens

### Onboarding

Purpose: introduce MyProdusen as internal HRIS and guide user to login.

Requirements:

- Brand-focused welcome screen with yellow accent.
- Short copy explaining attendance, leave, KPI, and employee profile.
- Clear login CTA.
- No marketing-heavy content; app is internal.

### Login

Requirements:

- Simple email/username and password form.
- Clear validation messages.
- Visible loading state after submit.
- Friendly inactive-user and invalid-credential errors without leaking account details.
- No public registration unless explicitly approved.

### Dashboard

Employee dashboard shows:

- Today attendance status.
- Check-in / check-out action entry point.
- Shift and work location summary.
- Leave request status.
- KPI snapshot.
- Recent notifications.

Admin/Superadmin dashboard shows:

- Active employee count.
- Attendance today.
- Late, absent, leave/sick/permission counts.
- Geo-fence rejected/pending alerts.
- KPI summary and risk indicators.
- Reports shortcuts.

Superadmin monitoring dashboard additionally shows:

- Management cards for `Management User & Role`, `Approval Center`, and
  `Reports & Export`.
- 7-day attendance bar diagram using brand-safe CSS bars.
- Division monitoring bars for active employee count and attendance rate.
- KPI overview with average score, approval counts, top performers, and low
  performers.
- Employee risk list for repeated late/absent/low KPI signals.
- All cards keep the same MyProdusen visual system: yellow for primary
  highlight, red for risk only, white rounded cards, soft gray surfaces, and
  concise Indonesian labels.

### Attendance

Requirements:

- Realtime camera-only selfie capture using `navigator.mediaDevices.getUserMedia()`.
- Live camera preview before capture.
- Capture frame through canvas and submit as `FormData` blob.
- No upload button, no gallery picker, no `<input type="file">`, no `accept="image/*"` attendance fallback.
- GPS permission request with clear status: waiting, allowed, denied, inaccurate, outside radius.
- Backend geofence result displayed in plain language.
- Check-in and check-out flows both require realtime selfie and GPS.
- Pending or rejected outside-radius attempts show next steps.

### Employees

Requirements:

- Admin table with search, filters, pagination, status chips, and action menu.
- Employee detail cards for identity, NIP, division, position, supervisor, work location, shift, and status.
- NIP shown as system-generated and not editable after creation.
- Deactivation UI must explain historical data remains preserved.

### Leave / Sick / Permission

Requirements:

- Employee request form with type, date range, reason, and optional attachment only if backend allows secure upload.
- Overlap validation error shown clearly.
- Pending, approved, and rejected states use readable status chips.
- Rejection reason visible to requester.
- Approval actions only visible to authorized Supervisor, Admin HR, or Superadmin.

### KPI

Requirements:

- KPI template and assignment screens use clear weight totals.
- KPI scoring UI shows method: higher is better, lower is better, or boolean.
- Employee view is read-only.
- Approved KPI edit requires authorized role and reason.
- KPI dashboard shows score trend and status without exposing unauthorized employee data.

### Profile

Requirements:

- Employee identity, role, division, position, supervisor, work location, and shift summary.
- Account status and notification preferences where supported.
- No sensitive data beyond authenticated user's scope.

### Email Templates

Purpose: make authentication emails feel like the same MyProdusen product,
not generic system mail.

Requirements:

- Use the same brand direction as the app: yellow header, black primary text,
  white rounded card, soft gray background, and concise Indonesian copy.
- Header shows `MyProdusen` and `Produsen Dimsum Medan`.
- Footer explains the email is automatic and directs users to HRD/Superadmin.
- Primary action uses one yellow CTA button with black text.
- Security-sensitive emails include clear expiry or warning copy.
- Copy may be warm and motivating, but must stay professional and easy for
  non-technical staff.
- Templates live in `lib/email.ts` and are sent through Resend.

Approved copy tone examples:

- “Semangat kerja dimulai dari langkah kecil yang rapi.”
- “Satu sistem, banyak manfaat: data lebih tertata, kerja lebih tenang, tim
  lebih kompak.”
- “Kerja lancar dimulai dari akun yang aman.”

### Reports

Requirements:

- Filter-first interface for date range, division, position, work location, employee, and status.
- Summary cards before export actions.
- CSV export as required baseline.
- Export action explains scope and creates audit log.
- Supervisor reports only team data; Employee reports only own data when allowed.

## 6. Attendance Security UX

The UI must communicate these rules without weakening them:

- GPS and selfie are mandatory for check-in and check-out.
- Backend validates RBAC, active employee, active shift, active work location, GPS accuracy, distance, and selfie file.
- Frontend distance calculation is only informational if present.
- Private selfie storage means users do not receive public selfie URLs.
- Authorized selfie views go through protected API routes only.
- Manual attendance adjustment requires reason and creates audit log.
- Outside-radius attempts are rejected or marked pending based on configuration and are stored for audit.

## 7. Accessibility

- Maintain readable contrast against yellow and gray backgrounds.
- Every input has visible label and error text.
- Buttons have clear accessible names.
- Status chips include text, not color alone.
- Loading states avoid layout jumps where possible.
- Camera and GPS permission errors must be readable and actionable.
- Keyboard navigation must work for admin tables, forms, dialogs, and menus.

## 8. Content Tone

Product UI copy should be Indonesian, concise, and operational. Documentation stays English.

Preferred UI tone:

- Direct: "Check-in berhasil".
- Helpful: "Lokasi terlalu jauh dari area kerja".
- Specific: "Selfie wajib diambil langsung dari kamera".
- Non-blaming: "Izin lokasi belum aktif".

Avoid:

- Technical stack terms in user-facing messages.
- Playful or consumer-app language.
- Vague errors like "Something went wrong".

## 9. Implementation Guardrails

- Use Tailwind and existing components/patterns.
- Keep UI code modular and role-aware.
- Do not add heavy UI dependencies without documented reason.
- Do not expose private storage paths or direct upload URLs.
- Do not add attendance upload/gallery fallback.
- Do not bypass backend RBAC or business rules for UI convenience.
- Keep docs updated when UI behavior changes.


## 10. Reference design alignment

Sources: the two MyProdusen design boards (Employee app shell, Super Admin
shell) plus the live web app. This section records what the live UI is
expected to match. Nothing here changes product scope.

### App shells (per-role bottom navigation)

The mobile bottom navigation must hold ≤ 5 tabs per role.

| Role | Primary tabs (left → right) |
| ---- | --------------------------- |
| EMPLOYEE | Beranda · Kehadiran · Cuti · KPI · Akun |
| SUPERADMIN | Beranda · Cabang · Approval · Laporan · Akun |
| ADMIN_HR | Beranda · Kehadiran · Karyawan · Cuti · Akun |
| SUPERVISOR | Beranda · Kehadiran · Karyawan · Cuti · Akun |

`lib/navigation/role-navigation.ts` holds the policy.
`getPrimaryNavigationForRole(role)` returns the ≤ 5 tabs for the bottom
bar; remaining allowed items remain reachable from the secondary menu.
`tests/rbac/role-navigation.test.ts` enforces the per-role primary set.

### Status & geo badge palette

Use these named tokens, never hard-code hex values in components:

| State | Token | Surface |
| ----- | ----- | ------- |
| Aktif / approved / inside radius | `var(--success)` | filled green chip |
| Menunggu / pending review | `var(--warning)` | yellow chip |
| Disetujui (icon) | `var(--success)` | check icon |
| Ditolak / outside radius | `var(--danger)` | red chip |

Implementation: `STATUS_TONE` and `GEO_BADGE` palettes in
`app/dashboard/reports/attendance/page.tsx` and
`src/components/attendance/SelfieViewer.tsx`.

### Typography rhythm

- Primary font: Poppins (loaded by `app/layout.tsx`).
- Heading 1: 24 px (1.5 rem), weight 700.
- Heading 2: 18 px (1.125 rem), weight 600.
- Body: 14 px (0.875 rem), weight 400.
- Caption: 12 px (0.75 rem), weight 500.
- Card padding: 16–20 px. Border radius via `var(--radius-md)` /
  `var(--radius-lg)`.
- Tap target: ≥ 44×44 px on every interactive element.

### Surface → live module map

| Design surface | Live module |
| -------------- | ----------- |
| Splash / onboarding | `app/page.tsx` redirect → `/login` if anonymous, `/dashboard` if authenticated |
| Login form | `app/login/page.tsx` |
| Dashboard (Beranda) | `app/dashboard/page.tsx` |
| Kehadiran (check-in/out) | `app/dashboard/attendance/page.tsx` + `src/components/attendance/RealtimeSelfieCamera.tsx` |
| Selfie viewer modal | `src/components/attendance/SelfieViewer.tsx` |
| Karyawan list | `app/dashboard/employees/page.tsx` |
| Cuti / leave | `app/dashboard/leave/page.tsx` |
| Penggajian (payroll snapshot) | `app/dashboard/payroll/page.tsx` |
| Approval (Super Admin) | `app/dashboard/attendance/exceptions/page.tsx` |
| Manajemen Cabang | `app/dashboard/locations/page.tsx` (live API) |
| Profil | `app/dashboard/profile/page.tsx` |
| Notifikasi | `app/dashboard/notifications/page.tsx` |
| Audit log | `app/dashboard/audit/page.tsx` |
| Reports (Laporan) | `app/dashboard/reports/attendance/page.tsx` (canonical) + `app/dashboard/reports/page.tsx` (entry point) |

### Map preview

`/dashboard/locations` and its create/edit modal render a small OpenStreetMap
preview with the geo-fence radius drawn as an SVG circle. Implementation in
`src/components/locations/WorkLocationMap.tsx`, helpers in
`lib/maps/osm-tile-math.ts`. Zero JS dependency, lazy-loaded via
`IntersectionObserver`. Tile source overridable via `NEXT_PUBLIC_OSM_TILE_URL`.

### Intentionally not adopted

- The reference shows separate "Manajemen Cabang" screens. MyProdusen treats
  work locations as branches; no extra `Branch` entity is added.
- The high-fidelity Penggajian mock is illustrative only. Payroll module is
  intentionally read-only for MVP; full payroll integration is Phase 2.

## 11. Responsive audit log

Last full audit: 2026-05-17. Skills like `superpowers` and `ui ux promax`
were not installed; the audit followed the manual rules from `AGENTS.md`.

### Audit findings and fixes

| # | Finding | Fix | Where |
| - | ------- | --- | ----- |
| 1 | `.mobile-content` / `.nav-container` clamped to `min(100%, 430px)` on tablets | Removed clamp; tablets now full-width with full-width bottom nav | `app/globals.css` |
| 2 | iOS safe-area inset only applied to the nav padding | Apply `env(safe-area-inset-bottom)` to content padding at every breakpoint | `app/globals.css` |
| 3 | Bottom-nav tap targets ~36 px tall (below WCAG 2.5.5) | `.nav-item` 56 px mobile / 48 px desktop | `app/globals.css` |
| 4 | `.btn` / `.btn-sm` / `.btn-lg` no minimum tap height | 44 / 36 / 52 px floors; inputs/selects ≥ 44 px | `app/globals.css` |
| 5 | Long names could push 320 px viewport horizontally | `.card { min-width: 0; word-break }` + global inline-grid guard | `app/globals.css` |
| 6 | Tables with overflow trapped page scroll | `.table-container` + inline overflow containers scroll inside | `app/globals.css` |
| 7 | Animations ignored `prefers-reduced-motion: reduce` | Global media query flattens animation/transition durations | `app/globals.css` |
| 8 | Icon-only buttons had no hit-area floor | `.btn-icon` minimum 44×44 | `app/globals.css` |

### Production sweep 2026-05-18

- BUG-001: `/dashboard/locations` card grid uses `minmax(min(100%, 340px), 1fr)` so cards stay inside 320 px mobile content.
- BUG-002: `/dashboard/shifts` card grid uses `minmax(min(100%, 300px), 1fr)` so cards stay inside 320 px mobile content.
- BUG-003: `/dashboard/overtime` no longer links to missing `/dashboard/overtime/rates`; the header shows active rate count from existing data.
- BUG-004: `/dashboard` quick/insight links respect documented role access for payroll and reports.
- BUG-005: Desktop/sidebar navigation includes existing payroll and overtime pages as non-primary items without changing the five-tab mobile shell.
- BUG-001-FINAL: Superadmin mobile primary tabs now match the reference order: Beranda, Cabang, Approval, Laporan, Akun; Laporan opens `/dashboard/reports/attendance` per `docs/references/design-checklist.md:114`.
- BUG-002-FINAL: `/dashboard/locations` destructive delete uses an in-app confirmation modal instead of raw `confirm()` per `docs/references/design-checklist.md:102`.
- BUG-003-FINAL: `/dashboard/locations` modal coordinate fields wrap with mobile-first grid columns and preserve ≥44 px inputs per `docs/references/design-checklist.md:96`.
- BUG-004-FINAL: `/dashboard/reports` report-type controls wrap on 320 px instead of forcing three cramped columns per `docs/references/design-checklist.md:96`.
- BUG-005-FINAL: `/dashboard/reports` PDF-unavailable feedback uses an inline status alert instead of raw `alert()` per `docs/references/design-checklist.md:102`.
- BUG-006-FINAL: `/dashboard/notifications` destructive delete uses an in-app confirmation modal instead of raw `confirm()` per `docs/references/design-checklist.md:102`.
- BUG-007-FINAL: `/dashboard/leave` balance/request controls use a wrapping mobile-first grid per `docs/references/design-checklist.md:96`.

### Verification gate

Every UI/UX merge must end with:

```bash
npm run release:check
```

The gate runs `lint`, `test`, `build`, and the migration-coverage check.
Manual viewport checks at 320 / 375 / 768 / 1024 / 1440 px must show no
horizontal scroll, the bottom nav respects safe-area insets, and selfie
modals are scrollable on small devices.

## Production Mobile UX Update — 2026-05-19

- Bottom navigation must always expose `Akun` as the account/logout destination.
- Logout belongs inside `/dashboard/profile` only; do not place random/floating logout actions in mobile nav, page headers, or dashboard cards.
- Mobile bottom nav priority:
  - Employee: Beranda, Kehadiran, Cuti, KPI, Akun.
  - Supervisor: Beranda, Kehadiran, Karyawan/Tim, Cuti, Akun.
  - Admin HR/Superadmin: Dashboard/Beranda, Absensi/Kehadiran, Karyawan, Laporan, Akun.
- Content must include bottom safe-area padding so fixed bottom nav never covers cards/forms/buttons.
- Attendance must show GPS readiness and accuracy before check-in/check-out.
- PWA install banner must be dismissible, accessible, non-blocking, and not repeated for 7 days after dismissal.
