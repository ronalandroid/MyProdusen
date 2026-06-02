# UI/UX Guide

> **AI agent role source of truth:** MyProdusen production uses exactly three roles: `SUPERADMIN`, `LEADER`, and `EMPLOYEE`. `ADMIN_HR` and `SUPERVISOR` are historical database values only and must not be exposed in production UI or route access.


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

Superadmin mobile bottom navigation should prioritize:

1. Beranda
2. Karyawan
3. KPI
4. Payroll
5. Akun

Navigation rules:

- Active item uses yellow accent and clear label.
- Disabled or unauthorized items must not appear as accessible routes.
- Backend RBAC remains source of truth even if navigation hides items.
- Navigation labels should be short and understandable in Indonesian UI.
- Bottom navigation must contain at most five primary items, one row only, safe-area aware, and no mascot or marketing copy.
- Superadmin mobile primary items are `Beranda`, `Karyawan`, `KPI`, `Payroll`, and `Akun`.
- Employee mobile primary items are `Beranda`, `Absensi`, `Cuti`, `KPI`, and `Akun`.
- Secondary items such as KPI management, reports, payroll, audit, documents, shifts, and notifications belong in desktop sidebar, dashboard shortcuts, or Akun menu.

## Production UI Cleanliness

Production pages must not show engineering/debug labels such as `Frontend`, `API`, `Service`, `Drizzle`, `PostgreSQL`, endpoint chips, database index names, or implementation pipeline cards. Keep those details in documentation or tests, not user-facing UI.

The Akun page owns logout. It must show a real `Keluar` button, danger/outline styling, confirmation text `Anda yakin ingin keluar?`, loading state, error state, and redirect to `/login` after logout.

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

Superadmin dashboard shows:

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
- Approval actions only visible to Superadmin.

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
- Superadmin reports all permitted data; Employee reports only own data when allowed.

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
| EMPLOYEE | Beranda · Absensi · Cuti · KPI · Akun |
| LEADER | Beranda · Absensi · Input KPI · Tim · Akun |
| SUPERADMIN | Beranda · Karyawan · KPI · Payroll · Akun |

`lib/navigation/role-navigation.ts` holds the policy.
`getPrimaryNavigationForRole(role)` returns the ≤ 5 tabs for the bottom
bar; remaining allowed items remain reachable from the secondary menu.
`tests/rbac/role-navigation.test.ts` enforces the per-role primary set.

### Role-Based Dashboard UX Structures

The live dashboards are structured strictly around roles, keeping core HRIS operations clean, direct, and clutter-free:

#### 1. EMPLOYEE Dashboard Layout
- **Greeting Header**: Personalized time-of-day greeting ("Selamat pagi", etc.), employee avatar (WebP compressed), NIP label, and unread notifications count trigger.
- **Primary Attendance Card**:
  - Displays today's date, assigned work shift times, and work location name.
  - Features real-time GPS Geofence widget showing: GPS Accuracy, Distance to work location (under 1000m in meters, 1000m and above in kilometers), and inside/outside geofence warnings.
  - Clean side-by-side Clock In and Clock Out buttons that redirect to the camera selfie Absensi flow, shifting states dynamically depending on check-in/out records.
- **Menu Utama Quick Action Grid**: 8 responsive actions mapped cleanly without horizontal scroll (Absensi, Cuti, KPI Saya, Payroll Saya, Lembur, Dokumen, Notifikasi, Akun).
- **Ringkasan Saya (Personal Summary)**: Quick metrics cards showing available Cuti balance, today's Attendance status, monthly Attendance summaries, and payroll Payslip shortcuts.
- **Pengumuman & Notifikasi**: Latest 3 unread items with an empty state placeholder and a direct "Lihat Semua" link.

#### 2. LEADER Dashboard Layout
- **Greeting Header**: Personalized time-of-day greeting, avatar, and notification trigger.
- **Primary Attendance Card**: Captures the leader's own shift schedule, geofenced GPS proximity, and Clock In/Out buttons.
- **Menu Leader Quick Action Grid**: Integrates leader-scoped features (Absensi Saya, Input KPI Tim, Tim Saya, KPI Saya, Laporan Tim, Payroll Saya, Notifikasi, Akun).
- **Ringkasan Tim Saya (Team Summary)**: Tracks assigned team metadata and today's team KPI production count.
- **Pengumuman & Notifikasi**: Latest 3 notifications scoped to the leader's access level.

#### 3. SUPERADMIN Dashboard Layout
- **Executive Summary Card**: Company-wide statistics showing active employee count, present attendance rate, pending leave approvals, pending KPI template actions, and payroll periods.
- **Menu Utama Admin Quick Action Grid**: Renders the 8 control center buttons (Pengguna, Cabang/Lokasi, KPI, Payroll, Cuti, Laporan PDF, Approval, Notifikasi).
- **Company Performance Summary**: Visual monitoring panels tracking attendance trends (7-day chart), KPI average scores, per-division compliance rates, and attention/risk alerts.
- **Aktivitas Terbaru / Approval Queue**: Lists pending leave/exception approvals with inline quick-actions (Setujui/Tolak) and system-wide auditable logs.
- *Strict Rule*: Superadmin dashboard is dedicated to administrative control and reports; it never renders employee check-in or check-out camera selfie CTA elements.

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
- BUG-001-FINAL: Superadmin mobile primary tabs now match the reference order: Beranda, Cabang, Approval, Laporan, Akun; Laporan opens `/dashboard/reports/attendance` per `docs/references/design-checklist/README.md:114`.
- BUG-002-FINAL: `/dashboard/locations` destructive delete uses an in-app confirmation modal instead of raw `confirm()` per `docs/references/design-checklist/README.md:102`.
- BUG-003-FINAL: `/dashboard/locations` modal coordinate fields wrap with mobile-first grid columns and preserve ≥44 px inputs per `docs/references/design-checklist/README.md:96`.
- BUG-004-FINAL: `/dashboard/reports` report-type controls wrap on 320 px instead of forcing three cramped columns per `docs/references/design-checklist/README.md:96`.
- BUG-005-FINAL: `/dashboard/reports` PDF-unavailable feedback uses an inline status alert instead of raw `alert()` per `docs/references/design-checklist/README.md:102`.
- BUG-006-FINAL: `/dashboard/notifications` destructive delete uses an in-app confirmation modal instead of raw `confirm()` per `docs/references/design-checklist/README.md:102`.
- BUG-007-FINAL: `/dashboard/leave` balance/request controls use a wrapping mobile-first grid per `docs/references/design-checklist/README.md:96`.

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
- Dashboard layout owns the authenticated role and passes it into navigation; sidebar must not refetch profile data.
- Bottom/side navigation uses `next/link` with prefetch to reduce tap delay and preserve browser navigation semantics.
- Dashboard content scroll resets on route change so mobile/tablet views do not keep stale scroll position between modules.
- Icon-looking controls must be real buttons or links with labels; no dead settings/back icons.
- Realtime attendance camera must stop tracks and clear video source whenever closed, disabled, retaken, or unmounted.
- Mobile bottom nav priority:
  - Employee: Beranda, Kehadiran, Cuti, KPI, Akun.
  - Superadmin: Beranda, Cabang, Approval, Laporan, Akun.
- Content must include bottom safe-area padding so fixed bottom nav never covers cards/forms/buttons.
- Attendance must show GPS readiness and accuracy before check-in/check-out.
- PWA install banner must be dismissible, accessible, non-blocking, and not repeated for 7 days after dismissal.

## UI/UX Audit Guardrails — 2026-05-19

- Keep dashboard scroll changes instant; do not use global smooth scrolling for route changes because it can feel like mobile nav delay.
- PWA install banner must fit 360px and high browser zoom; actions stack vertically when needed and banner scrolls within viewport.
- Profile icon actions must be semantic buttons/links with labels, never decorative dead icons.
- Logout remains only in Akun/Profile with `Keluar`, confirmation, loading state, and real logout call.

## PWA Install UX — 2026-05-19

- Install banner uses `Install App` primary CTA and `Nanti` secondary action.
- Banner is dismissible, non-blocking, mobile-friendly, and respects a 7-day dismissal cooldown.
- Unsupported browsers show manual install guidance: Android Chrome menu ⋮ → Tambahkan ke layar utama; iOS Safari Share → Add to Home Screen.

## UI/UX Patch Note — Buttons, Modals, Attendance

- Action buttons must use icon/text flex with 44px minimum touch target, shrink-safe icons, and non-clipping text.
- Destructive modal footers must stack actions on mobile and wrap right-aligned on larger screens.
- Runtime JavaScript errors must never render directly to users; show Indonesian fallback and retry guidance.
- Attendance CTA must show missing requirements before submit: work location, GPS, selfie.
- Report export action groups use responsive grid: one column on mobile, two columns on wider screens.

## UI Reference Alignment Patch — 2026-05-19

- Buttons follow reference screen rhythm: rounded, 44px mobile minimum, 48px desktop, 8px icon gap, no clipped label.
- Pagination uses compact `Prev` / `Hal.` / `Next` controls with readable minimum widths and wrapping for 360px screens.
- Search inputs reserve a 20px icon slot and keep text min-width safe inside cards.
- Selfie front-camera preview is mirrored and captured image matches preview.
- Shared modals must use `role="dialog"`, `aria-modal="true"`, labelled title, Escape close, focus trap, focus restore, and non-overlapping footer buttons.
- Icon-only or close buttons need Indonesian `aria-label` and minimum 44px hit area.
- Decorative input icons must be `aria-hidden`; field errors must be connected through `aria-describedby` / `aria-invalid` where component pattern supports it.
- Status colors used as text must meet WCAG contrast; prefer `--success-text`, `--danger-text`, `--warning-text`, and `--info-text` on light backgrounds.

## Stitch UI Sync Update — 2026-05-21

Dashboard UI now includes Stitch-aligned frontend/backend sync patterns for the MyProdusen role model:

- Employee beranda shows role-safe identity, NIP, attendance proof requirements, API route labels, and a visible `Frontend -> API -> Service -> Drizzle -> PostgreSQL` sync strip.
- Employee feature cards map personal modules to protected backend routes: attendance, leave balance, KPI results, payroll me, notifications, and sync status.
- Superadmin dashboard shows a production control center for employee/NIP/user review, attendance/geofence, leave/KPI approvals, reports/export, audit logs, and safe version metadata.
- All added cards use existing brand tokens: `#FFC107`, warm white surfaces, rounded cards, semantic badges, 44px minimum action height, and Indonesian labels.
- Legacy roles remain hidden from production UI. User-facing role labels stay limited to `Superadmin` and `Karyawan`.

## Feature Page Stitch Sync — 2026-05-21

Feature pages now use the same Stitch-aligned sync language as the dashboard:

- `/dashboard/attendance` explains GPS, geo-fence, selfie realtime, no-store, and protected selfie endpoints before the attendance action flow.
- `/dashboard/leave` explains pending request workflow, balance read-back, overlap rejection, approval/rejection endpoints, rejection reason, and audit requirement.
- `/dashboard/kpi` explains employee read-only KPI access, Superadmin approval, template weight `100`, approved result lock, and audit reason rules.
- `/dashboard/reports` explains protected exports, filters, permissions, no-store PDF/report access, and audit logging.

These additions are informational UI sections only; backend remains source of truth for auth, RBAC, validation, attendance, KPI, leave, exports, and audit logs.

## Core HR Stitch Sync — 2026-05-21

Core HR pages now follow the same Stitch-aligned sync pattern:

- `/dashboard/employees` shows NIP generation, user-account linkage, default shift/location, and database index context.
- `/dashboard/users` shows activation/deactivation and production-safe role rules. UI remains limited to `Superadmin` and `Karyawan`.
- `/dashboard/locations` shows geo-fence master-data ownership, radius constraints, and backend-source-of-truth rules.
- `/dashboard/shifts` shows active shift ownership and attendance dependency.

These sections do not create frontend-only authorization. Backend APIs and services remain the source of truth.

## Mobile Navigation Hardening — 2026-05-22

- Phone widths below `768px` use fixed bottom navigation only.
- Mobile bottom navigation is one row, max five primary items, `72px–84px` high plus safe-area inset.
- Mobile nav must never contain mascot/chicken artwork, marketing copy, endpoint/debug text, or logout helper text.
- Superadmin mobile tabs: `Beranda`, `Karyawan`, `KPI`, `Payroll`, `Akun`.
- Employee mobile tabs: `Beranda`, `Absensi`, `Cuti`, `KPI`, `Akun`.
- Tablet widths from `768px` use compact sidebar behavior, not bottom nav.
- Desktop widths from `1024px` use wider sidebar behavior.
- Dashboard content reserves bottom space with `calc(96px + env(safe-area-inset-bottom))` on phone so nav does not cover cards or CTAs.
- Accessibility skip link remains visually hidden by default and appears only on keyboard focus.
- Logout belongs on the Akun page as a real `Keluar` button with confirmation `Anda yakin ingin keluar?`.

## Attendance Location UX — 2026-05-22

- Cabang/Lokasi Kerja page shows name, address, latitude, longitude, radius, active status, map preview, and Google Maps link.
- Attendance page may preview GPS accuracy, distance to assigned location, official radius, and inside/outside status.
- Frontend preview is informational only; backend geofence validation is final.
- If employee has no assigned location, show `Lokasi kerja belum tersedia. Hubungi Superadmin.` and disable attendance action.
- Keep Indonesian messages for GPS not ready, weak accuracy, outside radius, inactive/missing location, camera missing, and selfie missing.


## 3-Role Leader Model — 2026-05-24

Production roles are now exactly `SUPERADMIN`, `LEADER`, and `EMPLOYEE`. `ADMIN_HR` and `SUPERVISOR` remain historical database enum values only and must not appear in production UI, seed accounts, tests, or new route access.

### SUPERADMIN

- Full system control: users, employees, roles, teams, leader assignment, employee team assignment, cabang/lokasi kerja, shifts, attendance, KPI, reports/export, payroll if active, and audit logs.
- Can create teams such as Cetak, Gudang, Pengiriman, Packing, Produksi, and Quality Control.
- Can assign one or more active `LEADER` users to teams and assign active employees to teams.
- Can view all attendance, KPI production entries, personal KPI, and global reports.

### LEADER

`LEADER` is also an active employee and must have an employee profile, default work location, and active shift for attendance. If incomplete, UI/API returns: “Anda belum memiliki data karyawan/lokasi kerja/shift. Hubungi Superadmin.” If not assigned to a team, UI/API returns: “Anda belum ditetapkan ke tim. Hubungi Superadmin.”

As self-service employee, `LEADER` can use GPS + realtime selfie attendance, own attendance history, own leave/cuti, own KPI/kinerja, own personal performance report, own notifications, and own payslip if payroll is active.

As team role, `LEADER` can view assigned team members only, input daily KPI/production count for assigned employees only, view team KPI summary, and view daily/weekly/monthly team performance reports scoped to assigned team. `LEADER` cannot view team payroll, edit sensitive employee data, access another leader team, access Superadmin global reports, or input own KPI unless `ALLOW_LEADER_SELF_KPI_INPUT=true`.

### EMPLOYEE

`EMPLOYEE` can use GPS + realtime selfie attendance, submit leave/cuti, view own KPI/kinerja only, view own attendance history only, view own personal report only, and view own notifications/payslip if active. `EMPLOYEE` cannot input KPI, see other employee data, or access leader/superadmin pages.

### Database Additions

Additive Drizzle migration `0020_leader_role_teams_kpi_production.sql` adds enum value `LEADER`, `Team`, `LeaderAssignment`, `EmployeeTeamAssignment`, and `KpiProductionEntry`. Migration is non-destructive and keeps historical data.

### API/RBAC Additions

- Superadmin: `GET/POST /api/teams`, `POST /api/teams/leader-assignment`, `POST /api/teams/employee-assignment`.
- Leader: `GET /api/leader/me`, `GET /api/leader/team-employees`, `GET/POST /api/leader/kpi-production`.
- Self KPI view: `GET /api/kpi/production/me`.
- Backend enforces role, active user, leader team scope, employee membership, quantity/date validation, self-KPI policy, and no-store API responses.

### UI Additions

- Leader dashboard has “Saya / Pribadi” and “Tim Saya”.
- Leader mobile primary nav: Beranda, Absensi, Input KPI, Tim, Akun.
- Leader pages: `/dashboard/leader/kpi-input`, `/dashboard/leader/team`, `/dashboard/leader/reports`.
- Employee KPI page shows production count source “Diinput oleh Leader” and empty state “Belum ada input KPI hari ini.”

## Final Role And Assignment UAT Update — 2026-05-24

- Public register is employee-only: backend strips any submitted role/team/division/position/location/shift escalation and creates `EMPLOYEE` with existing activation policy.
- Only `SUPERADMIN` can change role, active status, team/division, position/title, work location, and shift.
- `LEADER` remains a self-service employee for GPS+selfie attendance and personal reports, plus team-scoped KPI input for assigned members only.
- `EMPLOYEE` remains self-service only and cannot input KPI, view other employees, access Leader pages, or access Superadmin pages.
- Role and work identity are separate: role controls access; team/division/position/location/shift control work assignment.
- Team/division examples include Produksi, Kargo, Cetak, Gudang, Pengiriman, Packing, and Quality Control; active data remains configurable by Superadmin.
- Added safe additive migration for position metadata and primary active employee team assignment guard.
- Added/updated production-safe scripts: `seed:leader-teams`, `setup:uat-leader-flow`, `verify:uat-leader-flow`, and `release:runtime`.
- `release:runtime` is target-container safe and intentionally excludes lint/test/build because production images may not ship dev dependencies.
- Remaining production signoff blockers: target-container `release:env`, authenticated E2E with real credentials, real-device GPS+selfie attendance, and protected selfie authorization verification.

## Final Role Assignment UI Update — 2026-05-24

- Register page keeps the existing brand, spacing, tone, and mobile-first style; no role/team selector is shown.
- Success message states: “Akun berhasil dibuat sebagai Karyawan. Superadmin akan menetapkan divisi, posisi, lokasi kerja, dan shift.”
- Superadmin Pengguna cards now expose role, team/divisi, posisi/jabatan, lokasi kerja, shift, and active status using responsive controls.
- Leader without team shows a warning: “Leader belum ditetapkan ke tim.”
- Controls are kept in stacked mobile-friendly cards to avoid clipped selects, horizontal overflow, and modal overflow.

## First Login Personal Profile Onboarding — 2026-05-24

- After registration, activation, and first login, the dashboard checks `/api/profile/me` with `no-store, private` behavior.
- If phone, address, or `profileCompletedAt` is missing, the app shows mandatory modal “Lengkapi Data Pribadi”.
- User-editable fields are limited to `phone` / Nomor HP and `address` / Alamat lengkap.
- Users cannot edit role, team/division, position/title, leader status, work location, shift, active status, payroll, or permissions.
- If a self-registered activated user has no employee row yet, saving personal profile creates a minimal employee profile with generated NIP and no work assignment.
- Superadmin-only assignment fields remain role, team/division, position/title, work location, shift, and active status.
- Employee/Leader dashboard shows clean assignment status cards when division, position, location, shift, or Leader team is missing.
- Near-real-time assignment sync uses authenticated profile refetch on dashboard focus and a light 60-second dashboard interval; role/nav updates after refetch/refresh while backend permissions apply immediately.
- Phone/address are private employee data. Owner and Superadmin may access them; Leader team APIs do not expose employee phone/address by default.
- Real-device GPS+selfie, protected selfie authorization, and authenticated live E2E remain required before production signoff.

## UAT UI/UX Polish — 2026-05-24

- Superadmin attendance page uses monitoring/report actions, not employee selfie check-in/out controls.
- Employee/Leader attendance GPS card shows clear Indonesian copy: current distance, official radius, and inside/outside status.
- Distance displays in meters below 1000m and kilometers at 1000m or more.
- First-login onboarding asks for Foto profil/avatar, Nomor HP, and Alamat lengkap with mobile-safe controls and logout as the only escape while incomplete.
- Pengguna nav icon uses an account-management icon distinct from Beranda and Karyawan while keeping existing icon style.

## Lean HRIS Navigation Policy — 2026-05-24

Main navigation follows MyProdusen core scope instead of showing every Talenta-like module. Visible defaults stay focused: Superadmin sees Beranda, Karyawan, Cabang/Lokasi, KPI, Payroll, Cuti, Reports/PDF, and Akun; Leader sees Beranda, Absensi, Input KPI, Tim, Cuti, Payroll Saya, and Akun; Employee sees Beranda, Absensi, Cuti, KPI, Payroll Saya, and Akun. Recruitment, LMS, reimbursement, business travel, survey, asset, announcements, documents, and overtime stay hidden unless enabled by feature flag. Do not redesign colors, logo, spacing, or component tone.



## Production Attendance, KPI, Payroll Realtime Sync — 2026-05-26

- Attendance priority flow is GPS + realtime selfie for `EMPLOYEE` and `LEADER`; `SUPERADMIN` does not use normal employee selfie clock-in/out.
- Official geofence default radius is 150 meters. Backend remains source of truth for distance, GPS accuracy, stale GPS rejection, selfie requirement, and inside/outside decision.
- Attendance late payroll policy is configurable by Superadmin and must not be treated as irreversible legal/business law. Default policy: 1–15 minutes late deducts Rp5.000, 16–30 minutes late deducts Rp10.000, and more than 30 minutes late counts as half-day payroll with pay factor 0.5.
- Shift start uses assigned active shift. Default 08:00 is a fallback reference only for policy defaults; production attendance should require assigned employee shift and show a clear Indonesian error when missing.
- Payroll realtime sync can be ON/OFF globally through company policy and ON/OFF per payroll rule. Payroll rules may target company/division/team/employee, weekly or monthly periods, base salary, attendance policy, KPI target, bonus type, and bonus amount.
- Payroll calculation includes attendance deductions, half-day impact, holiday multiplier, KPI production bonus, and manual adjustments. Approval/reject/paid/unpaid status changes require audit log and user notification.
- Work calendar is configurable by Superadmin. Custom holidays such as Hari Buruh, Hari Pahlawan, Company Holiday, or Custom Libur Pabrik may use paid holiday multiplier; default holiday work multiplier is 2x when enabled by payroll rule.
- KPI Cetak flow: Leader may input production count only for assigned team members, especially Karyawan Cetak. Employee sees only own KPI. KPI production can feed payroll bonus when linked to configured payroll rule.
- Profile photo/avatar is private protected upload data. Users can update own avatar; Superadmin employee list must refresh near-realtime and show protected avatar or initials fallback.
- Production payroll deductions and multipliers must be reviewed and approved by company policy/legal owner before production payroll use.

## Production Attendance-Payroll-Policy UIs — 2026-05-26

- **Superadmin Attendance Policy Panel**: Integrated grace minutes, geofence radius, two-tier late deduction settings, half-day pay factors, and a global realtime sync switch in `/dashboard/settings`.
- **Superadmin Work Calendar Panel**: Interactive custom holiday scheduler supporting holiday type selections, custom names, active toggles, and Pengali Gaji (multiplier 2x) displays.
- **Realtime Selfie Camera Integration**: Launches camera user stream automatically when clicking Clock In/Out on the Beranda.
- **Embedded Leader KPI Cetak Card**: Streamlined pack input, pre-populated daily entries, and POST save handlers directly on `LeaderBeranda.tsx`.


## Gamification & Performance Score Update

- Performance score module adds Attendance Score (30%), KPI Score (50%), and Culture & Discipline Score / Penilaian Perilaku Kerja (20%) defaults; configuration must total 100 or return `GAMIFICATION_WEIGHT_INVALID`.
- New active Employee and Leader start from score 100 and can maintain annual 365-day performance for configurable raise projection tiers.
- Default Platinum projection: score 100 maintained 365 days = +10%, with disclaimer: “Proyeksi ini bersifat estimasi dan dapat berubah sesuai kebijakan perusahaan.”
- Badge service definitions cover Streak 7 Hari, Streak 30 Hari, KPI Perfect Month, Zero Alpha Quarter, Top Performer, and Consistent Gold. Badges are backend-calculated, not fake frontend state.
- Culture & Discipline Score / Penilaian Perilaku Kerja is limited to assigned team members, disallows self-scoring, requires score 0–100 plus notes minimum 10 characters, and queues anomalies for score < 40 or score delta > 30.
- Superadmin controls periods, score weights, raise tiers, anomalies, score overrides with audit reason, reports, and company distribution.
- Theme customization stores sanitized hex colors only, validates contrast, emits safe CSS tokens, audits changes, and resets to default MyProdusen yellow/cream/charcoal/red identity.
- Private performance/theme APIs use no-store responses; payroll/attendance/security actions must not use fake optimistic success.
- UX includes skeleton states, safe progress states (Memvalidasi GPS…, Mengaktifkan kamera…, Menyimpan data…, Menghitung payroll…, Memperbarui skor…), double-submit prevention, and input preservation on error.

## Gamification & Theme UI UAT Pass — 2026-05-31

- **Employee Gamification Dashboard**: Styled cumulative Score Card (0–100) displaying active tier, SVG trend line chart, raise projection banner, and showcase badges with loading skeletons. Included dynamic subcriteria display (Kebersihan, Disiplin, Kerapian, Kepatuhan SOP, Kerja Sama Tim, Tanggung Jawab) if available in backend records.
- **Leader Scoring and Team UI**: Interactive team management card on `/dashboard/leader/team` with Team Score Table, Team Leaderboard, and Input Penilaian Perilaku Tim form validating score (0-100), note minimums, optional subcriteria sliders, and client-side anomaly warnings. No employee private salary info is exposed in the leader team space.
- **Superadmin Control Hub**: Features performance overview distributions, raise budget projections, top performers list, period controllers, and a full theme color wheel kustomisasi page with contrast check safeguards. Includes direct final score inputs with priority warnings and optional subcriteria sliders.

## Culture & Discipline Score Update
- Old user-facing "Leader Score" label is now "Culture & Discipline Score" / "Penilaian Perilaku Kerja".
- Legacy `LeaderScoreEntry` storage remains for backward compatibility; no destructive rename.
- Formula: Attendance 30% + KPI Produksi 50% + Perilaku Kerja 20%.
- `GAMIFICATION_WEIGHT_CULTURE=20` is primary; `GAMIFICATION_WEIGHT_LEADER` remains legacy alias fallback.
- Superadmin can input/edit Culture & Discipline Score for any Employee/Leader and final score has priority by default (`CULTURE_SCORE_SUPERADMIN_PRIORITY=true`).
- Leader can input only assigned team members, cannot score self, cannot score outside team, cannot see team salary projection amounts, and cannot override Superadmin final score.
- Advanced subcriteria can evaluate kebersihan, disiplin, ketepatan waktu perilaku, kerapian, kepatuhan SOP, kerja sama tim, tanggung jawab, and optional attitude.
- All submit/update/override actions require audit log: `CULTURE_SCORE_SUBMITTED`, `CULTURE_SCORE_UPDATED`, `CULTURE_SCORE_OVERRIDDEN`.
- Employee sees transparent score breakdown with Perilaku Kerja explanation.
- Preferred API: `/api/performance/culture-score`; legacy `/api/leader/performance/leader-score` remains alias.

## QA Automation Checkpoint — Live/Public + Culture Build
- Local quality gates passed: `npm run lint`, `npm run test`, `npm run build`, `npm run release:check`.
- Live route verification passed for `/api/health`, `/api/version`, and unauthenticated PDF protection.
- CDN cache verification passed: static assets cacheable; API/dashboard/PDF/attendance/payroll responses no-store/private or non-cacheable.
- Playwright public live smoke found horizontal overflow on `/login` mobile-360. Root cause: auth decorative/background layout could extend document width on deployed build.
- Fix applied locally: `.auth-page` now uses `max-width: 100vw`, `overflow-x: clip`, and `box-sizing: border-box`; regression test added in `tests/ui/auth-overflow-source.test.ts`.
- Authenticated E2E is BLOCKED because `E2E_SUPERADMIN_EMAIL`, `E2E_LEADER_EMAIL`, and `E2E_EMPLOYEE_EMAIL` are missing. Password env values without matching emails are insufficient.
- TestSprite API key is present, but no TestSprite MCP/CLI runner is available in this repo session; TestSprite frontend/backend runs are BLOCKED pending runner/tool access.
- Real-device GPS+selfie UAT is BLOCKED / NOT RUN. See `docs/manual-real-device-uat.md`.
- GO/NO-GO: NO-GO for production signoff. Public live smoke must pass after redeploy, authenticated E2E credentials must be supplied, TestSprite must run, and real-device UAT must complete.

## Final QA Hotfix Checkpoint — Parallel Readiness
- Parallel QA agents verified local Playwright public E2E, backend release/RBAC gates, and TestSprite runner availability.
- Local public Playwright passed: `npm run e2e:public` => 20 passed.
- Authenticated E2E environment is partial: Superadmin/Employee credentials present in `.env`, Leader credentials missing (`E2E_LEADER_EMAIL`, `E2E_LEADER_PASSWORD`). Authenticated production signoff remains BLOCKED until all three roles are available and pass.
- Authenticated Playwright helpers now forward auth cookies on API-context requests so browser login state and API checks stay aligned.
- Superadmin users-page assertion accepts current UI label `Pengguna` plus legacy `Manajemen User & Aktivasi`.
- TestSprite remains BLOCKED: local MCP/CLI runner not installed; `@testsprite/testsprite-runner` and `@testsprite/testsprite-cli` are not available from npm; existing cloud execution previously blocked by billing/credits.
- No destructive DB commands were run. Migration/static release checks passed.
- GO/NO-GO: READY FOR REDEPLOY only after commit/push; NOT production signoff until redeploy live public, authenticated roles, TestSprite/owner acceptance, real-device GPS+selfie, prod db deploy, and backup/restore are done.

## UAT Hotfix — Attendance/Profile/Contrast
- Direct attendance CTA added for Employee and Leader dashboards: `Absensi Hari Ini`, `Absen Masuk`, `Absen Pulang`, `Absensi Selesai`.
- Attendance page now keeps one selfie+GPS capture flow with `Ambil Selfie`, GPS status, work location, distance, radius, inside/outside status, and submit labels `Kirim Absen Masuk/Pulang`.
- Manual correction remains available via `Ajukan Koreksi Manual`; backend selfie/GPS/geofence validation remains authoritative.
- First-login onboarding now requires `Nama Lengkap` minimum 3 chars plus avatar, phone, and address; self-update forbidden fields remain blocked.
- Profile page avatar click opens `Perbarui Foto Profil` modal with preview, WebP compression at max 512px/0.8 quality, progress copy, and save.
- Superadmin employee list renders protected avatar URLs with alt text, on-focus refetch, and fallback-safe behavior.
- Sidebar brand contrast improved with dark charcoal/brown brand text and readable cream Super Admin badge while preserving yellow/cream MyProdusen style.
- No destructive DB changes.
- Production signoff still requires redeploy, authenticated E2E, real-device GPS+selfie UAT, and protected avatar/selfie live verification.

## Production Feature Bundle — Work Duration, Payroll, Streak, Raise Projection
- Added safe additive `Employee.work_start_date`, `start_date_set_by`, and `start_date_set_at` fields; no destructive migration.
- Work duration is calculated dynamically in Asia/Jakarta calendar days and shown as `Tanggal mulai kerja` / `Masa kerja`.
- Superadmin-only start-date API audits `EMPLOYEE_START_DATE_SET` / `EMPLOYEE_START_DATE_UPDATED`; Employee/Leader cannot edit start date.
- Simple payroll calculator documents `gross = baseSalary + kpiBonus + holidayBonus + manualAdditions`, `deductions = lateDeduction + halfDayDeduction + manualDeductions`, `netPay = gross - deductions`.
- Payroll privacy rule: Superadmin may see all; Employee/Leader only own estimate; Leader must not see team salary/payroll.
- Chicken attendance streak service maps PRESENT/HOLIDAY/LEAVE/ABSENT/LATE/HALF_DAY; holiday and approved leave do not break streak.
- Annual raise projection default formula: `projectedRaisePercent = annualScore / 10` with max raise 10%; projection is estimate only and requires company approval.
- Profile and Superadmin employee list source now surface work duration, payroll estimate copy, chicken streak, score/raise projection copy.
- Executive PDF remains protected/no-store and must include work duration/payroll/performance fields after report template expansion.
- UAT: validate payroll privacy, protected PDF, work duration sync, chicken streak calendar, and raise disclaimer after redeploy.

## Attendance Selfie Clocking UX
- Reference-video inspired flow: dashboard greeting, one attendance card, Clock In / Clock Out, dedicated capture screen.
- MyProdusen keeps yellow/cream rounded card style, readable dark text, simple bottom navigation.
- Capture screen opens camera after user gesture, shows face guide overlay, GPS validation, optional note, and sticky submit.
- Outside radius shows manual correction entry; Superadmin approval and audit trail required.
- Real Android/iPhone GPS + selfie UAT required after redeploy.

## Attendance Map-First Clocking Flow
- New reference-video correction: dashboard Clock In / Clock Out opens `/dashboard/attendance/clock?type=...`.
- Step 1 `Validasi Lokasi` appears before selfie, with map-style UI showing current location, office location, radius circle, distance, GPS accuracy, and status chip.
- Google Maps can replace the fallback if key/component is available; fallback map-style UI remains production-safe.
- Step 2 opens selfie camera only after `Lanjutkan`; face guide, `Ambil Foto`, preview/retake, optional note, and sticky submit follow.

## Gamification UX Standard — 2026-06-02

- Employee dashboard must present `Skor Performa Saya` with real score, 30/50/20 breakdown, and Superadmin approval disclaimer for raise projection.
- Attendance streak calendar uses monthly mobile-first grid, chicken marker for attended days, ring for today, soft blue/neutral leave state, grey off-day state, and muted warning for absence.
- Gamification animation must be tasteful and respect `prefers-reduced-motion: reduce`.
- Motivation copy must be warm, professional, and not childish.
- Leader team gamification must avoid payroll/salary amounts.
- Superadmin analytics must not show normal Clock In/Clock Out CTA.

## Gamification UI/UX Standard

MyProdusen gamification must be professional HRIS first and fun motivation second. It should help factory employees understand attendance, KPI, behavior score, streak, and annual raise estimate without making the dashboard feel like a childish game.

### Visual Rules

- Preserve MyProdusen yellow/cream tone, white rounded cards, dark readable text, and clean HRIS layout.
- Use chicken markers subtly for streak days only; avoid cartoon overload.
- Keep dashboard clean and uncrowded.
- Use limited status colors. Red appears only for meaningful risk.
- Avoid yellow text on yellow background and all low-contrast combinations.
- Avoid generic AI-dashboard clutter, excessive icons, and decorative noise.
- Achievement badges must be limited to 3–5 visible items.

### Employee Layout

Recommended order:

1. Greeting.
2. Attendance action card.
3. Score card.
4. Streak calendar.
5. Raise projection.
6. Achievement badges.
7. KPI/attendance summary.

### Leader Layout

Recommended order:

1. Own attendance.
2. Own score.
3. Team KPI/attendance summary.
4. Assigned team list.

Leader team cards may show attendance status, KPI completion, score indicator, and attention flags. They must not show salary or payroll amounts.

### Superadmin Layout

Recommended order:

1. Company overview.
2. Attendance/KPI summary.
3. Score distribution.
4. Top performers.
5. At-risk employees.
6. Filters by division/team/month where available.

Superadmin dashboard must not show normal employee Clock In/Clock Out CTA.

### Mobile and Accessibility Rules

- Minimum tap target: 44px.
- Streak calendar must fit 320px mobile width without horizontal overflow.
- Bottom navigation must not cover gamification cards; content needs safe-area bottom padding.
- Use semantic labels for score, status, calendar days, and buttons.
- Do not rely on color alone for attendance states.

### Animation Rules

- Subtle pop-in for attended day is allowed.
- Count-up score is allowed when it does not cause layout shift.
- Soft shimmer for unlocked badge is allowed.
- No excessive bounce, looping distraction, or heavy animation dependency.
- Always respect `prefers-reduced-motion: reduce`.

## MyProdusen MVP Finalization Scope — Produsen Dimsum Medan

MVP scope is intentionally limited to operational HRIS flows needed for daily use:

1. Absensi selfie + geotag/geofence.
2. Payroll/gajian sederhana.
3. KPI produksi sync.
4. Pengajuan cuti + saldo cuti.
5. Role-based dashboard for `SUPERADMIN`, `LEADER`, and `EMPLOYEE` only.

Postponed/non-MVP: recruitment, complex BPJS/tax automation, bank disbursement, 360 review, reimbursement, multi-company, enterprise workflow builder, and extra roles such as `ADMIN_HR` or `SUPERVISOR`.

### Attendance MVP

Employee/Leader dashboard flow: Clock In/Clock Out → GPS/map validation → distance/radius status → selfie capture → optional note → submit → attendance history refresh. Backend must require authenticated employee profile, assigned active shift, assigned active work location, GPS evidence, selfie evidence, geofence validation, protected selfie storage, and audit-sensitive action logging. Superadmin does not use normal attendance CTA.

### Payroll/Gajian MVP

Superadmin owns payroll setup, calculation review, period/status control, payslip/report access, and approval/payment state. Employee and Leader can see own payroll/payslip only. Leader cannot see assigned-team salary, payroll amount, payslip, or payroll export. Payroll breakdown should remain simple: base salary, KPI bonus if configured, attendance deduction, holiday multiplier if supported, and final amount.

### KPI Production MVP

Leader inputs production KPI only for assigned team members. Leader outside-team input is blocked. Leader self-KPI input stays blocked unless an explicit env/policy allows it. Employee sees own KPI read-only. Superadmin can see all KPI, configure target/rules where available, and filter by division/team/month where available.

### Leave/Cuti MVP

Employee and Leader can submit leave request with reason/date/duration, see status, and consume balance only through approved flow. Server blocks overlap and insufficient balance with `LEAVE_BALANCE_INSUFFICIENT`. Leave balance changes are append-only ledger events. Superadmin approves/rejects and may adjust balance through ledgered workflow.

### MVP Release Rule

No fake GPS, fake selfie, fake KPI, fake payroll, or fake leave balance may be marked pass. Real-device attendance and authenticated UAT remain required before production signoff.


## TBM Division & Payroll Master Data

MyProdusen supports configurable TBM master data for `Administrasi`, `Produksi`, `Packing`, and `BEGE`. Superadmin manages divisions, positions, payroll rules, and employee payroll placement from “Struktur Divisi & Gaji”. Defaults are editable seed data, not locked business constants.

Default payroll rules seed:
- Admin Training: Administrasi/Admin monthly training Rp2.000.000 and full Rp2.300.000.
- Produksi Harian: Produksi daily Rp60.000/day.
- Packing Harian: Packing daily Rp60.000/day.
- Produksi Cetak Perempuan: Produksi/Produksi Cetak daily Rp50.000/day.
- Adon Helper Laki-laki: Produksi/Adon Helper daily Rp60.000/day.
- BEGE Default: configurable daily default with custom amount.

Salary privacy: Superadmin can manage and report all salary rules. Employees can read only their own salary rule and payslip. Leaders can see attendance, KPI, score, and production progress only; leaders must not see team salary amounts. Employee-specific custom overrides beat division/position defaults. Training status resolves training salary until training ends, then full salary.
