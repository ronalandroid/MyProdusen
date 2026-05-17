# UI Alignment with the Reference Designs

> Sources: the two MyProdusen design boards (Employee and Super Admin
> dashboards). This document records what the live web app is expected to
> match and how it currently does. No new product scope.

## Brand tokens (already shipped)

| Token | Value | Use |
| ----- | ----- | --- |
| Primary yellow | `#FFC107` | CTA, active nav, hero highlight |
| Accent red | `#E53935` | Danger, late, destructive actions |
| Black | `#111111` | Primary text |
| Soft gray | `#F5F5F5` | Borders, neutral surfaces |
| Success green | `#22C55E` | Active, approved, success states |

These are defined in `app/globals.css` under `:root`. Do not change without
updating both designs.

## App shells

The mobile bottom navigation must hold five tabs per role, exactly as drawn.

| Role | Primary tabs (left → right) | Source |
| ---- | --------------------------- | ------ |
| EMPLOYEE | Beranda · Kehadiran · Cuti · KPI · Akun | gambar 1 |
| SUPERADMIN | Beranda · Cabang · Approval · Laporan · Akun | gambar 2 |
| ADMIN_HR | Beranda · Kehadiran · Karyawan · Cuti · Akun | extends gambar 1 |
| SUPERVISOR | Beranda · Kehadiran · Karyawan · Cuti · Akun | mirrors EMPLOYEE + team |

`lib/navigation/role-navigation.ts` holds the policy. `getPrimaryNavigationForRole(role)`
returns the ≤ 5 tabs to render in the bottom bar; the remaining allowed
items remain reachable from the secondary menu. The nav tests in
`tests/rbac/role-navigation.test.ts` enforce the per-role primary set.

## Status & geo badges

The reference uses four status chips:

- `Aktif` — success green
- `Menunggu` — warning yellow
- `Disetujui` — success green (filled)
- `Ditolak` — danger red

Implementation: `STATUS_TONE` and `GEO_BADGE` palettes live in
`app/dashboard/reports/attendance/page.tsx` and
`src/components/attendance/SelfieViewer.tsx`. They reuse the brand tokens via
`var(--success)`, `var(--warning)`, `var(--danger)`. Stay within those
tokens; never hard-code hex values in components.

## Typography & layout discipline

- Primary font: Poppins (loaded by `app/layout.tsx`).
- Heading 1 / Bold: 24px (1.5rem), weight 700.
- Heading 2 / Semibold: 18px (1.125rem), weight 600.
- Body / Regular: 14px (0.875rem), weight 400.
- Caption / Medium: 12px (0.75rem), weight 500.
- Card padding: 16–20px. Border radius via `var(--radius-md)` /
  `var(--radius-lg)`.
- Mobile target: ≥ 44×44 px tap target on all buttons / icons.

## Components used by the design and where they live

| Design surface | Live module |
| -------------- | ----------- |
| Splash / onboarding | `app/page.tsx` redirect chain → `/login` for unauthenticated, `/dashboard` for authenticated. |
| Login form | `app/login/page.tsx` |
| Dashboard (Beranda) | `app/dashboard/page.tsx` |
| Kehadiran (check-in/out) | `app/dashboard/attendance/page.tsx` + `src/components/attendance/RealtimeSelfieCamera.tsx` |
| Selfie viewer modal | `src/components/attendance/SelfieViewer.tsx` |
| Karyawan list | `app/dashboard/employees/page.tsx` |
| Cuti / leave | `app/dashboard/leave/page.tsx` |
| Penggajian (payroll snapshot) | `app/dashboard/payroll/page.tsx` |
| Approval (Super Admin) | `app/dashboard/attendance/exceptions/page.tsx` |
| Manajemen Cabang | `app/dashboard/locations/page.tsx` (live API, not mock) |
| Profil | `app/dashboard/profile/page.tsx` |
| Notifikasi | `app/dashboard/notifications/page.tsx` |
| Audit log | `app/dashboard/audit/page.tsx` |
| Reports (Laporan) | `app/dashboard/reports/attendance/page.tsx` (canonical) and `app/dashboard/reports/page.tsx` (entry point) |

## Things the design implies but our docs already enforce

- Selfies are private and lazy-loaded only inside the modal.
- GPS validation runs server-side; the green "Lokasi valid" / yellow
  "Menunggu review" / red "Di luar radius" copy maps directly to
  `check_in_geo_status` values from `lib/attendance/gps-validation.ts`.
- Reports always paginate; never render a list without an empty/error/loading
  state.

## What is intentionally not adopted

- The reference shows Manajemen Cabang screens. We treat work locations as
  branches today; no separate "branch" entity is added — `WorkLocation`
  covers it, per `prd.md`.
- The "Penggajian" mock is high-fidelity but our payroll module is
  intentionally read-only for MVP; full payroll integration is Phase 2.

## Map preview (P1, shipped)

The work-location admin (`/dashboard/locations`) and its create/edit modal
both render a small OpenStreetMap preview with the geo-fence radius drawn
as an SVG circle. Implementation lives in
`src/components/locations/WorkLocationMap.tsx` with pure helpers in
`lib/maps/osm-tile-math.ts`.

- Zero JS dependency: the component uses native `<img>` tiles + an
  `IntersectionObserver` lazy-load.
- No bundle bloat: no Leaflet, no Mapbox.
- Tile source defaults to public OSM but is configurable through
  `NEXT_PUBLIC_OSM_TILE_URL`. When traffic outgrows OSM fair-use, swap the
  env to a paid provider (MapTiler/Mapbox) without touching the code.
- Render is automatically suppressed if the user supplies invalid lat/lon.
- Failed tile loads degrade to a coordinate-only placeholder.


## Responsive UI/UX audit (delivered)

Audit baseline taken on 2026-05-17. Skills `superpowers` and `ui ux promax`
were not installed in this environment, so the audit followed the manual
rules from `AGENTS.md` instead.

### Findings and fixes

| # | Finding | Fix | Where |
| - | ------- | --- | ----- |
| 1 | `.mobile-content` and `.nav-container` were clamped to `min(100%, 430px)` even on tablets, leaving a thin column at 768–1023 px. | Removed the 430 px clamp. Tablets now use full viewport width with full-width bottom nav. Desktop sidebar unchanged. | `app/globals.css` |
| 2 | iOS safe-area inset only applied to the bottom-nav padding, content could sit under the nav on devices with home indicators. | Applied `env(safe-area-inset-bottom)` to `.mobile-content` padding-bottom on every breakpoint. | `app/globals.css` |
| 3 | Bottom-nav tap targets were ~36 px tall, below WCAG 2.5.5 minimum of 44 px. | Bumped `.nav-item` to `min-height: 56px` on mobile and `48 px` on desktop. | `app/globals.css` |
| 4 | `.btn` and `.btn-sm` had no minimum tap height; some screens had buttons ~32 px tall. | `.btn` → `min-height: 44px`, `.btn-sm` → `36 px`, `.btn-lg` → `52 px`. Inputs/selects also bumped to ≥ 44 px. | `app/globals.css` |
| 5 | Long employee names / addresses could push a 320 px viewport horizontally. | Added `.card { min-width: 0; word-break: break-word; overflow-wrap: anywhere; }` and `.card > * { min-width: 0; }` plus a global guard for inline-styled grids. | `app/globals.css` |
| 6 | Reports/locations tables with horizontal overflow trapped page scroll. | `.table-container` and inline-styled overflow containers now allow `-webkit-overflow-scrolling: touch` and degrade with a visible border. | `app/globals.css` |
| 7 | Animations played even with `prefers-reduced-motion: reduce`. | Added a global `@media (prefers-reduced-motion: reduce)` rule that flattens transitions and animations. | `app/globals.css` |
| 8 | Icon-only ghost buttons (close-modal `✕`) had no minimum hit area. | Added `.btn-icon` minimum 44×44 with consistent padding. | `app/globals.css` |

### Verification

- `npm run lint` clean.
- `npm run test` — 36 files / **218 / 218 passing**.
- `npm run build` succeeds.
- Manual viewport spot-checks at 320 / 375 / 768 / 1024 / 1440 px all
  render without horizontal scroll, with bottom nav respecting safe-area
  insets, with selfie modal scrollable on small devices.
