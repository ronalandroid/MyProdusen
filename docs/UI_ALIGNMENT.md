# UI Alignment with the Reference Designs

> Sources: the two MyProdusen design boards (Employee and Super Admin
> dashboards). This document records what the live web app is expected to
> match and how it currently does. No new product scope.

## Brand tokens (already shipped)

| Token | Value | Use |
| ----- | ----- | --- |
| Primary yellow | `#FDC704` | CTA, active nav, hero highlight |
| Accent red | `#B51B19` | Danger, late, destructive actions |
| Black | `#000000` / `#111111` | Primary text |
| Soft gray | `#E5E3E6` | Borders, neutral surfaces |

These are defined in `app/globals.css` under `:root`. Do not change without
updating both designs.

## App shells

The mobile bottom navigation must hold five tabs per role, exactly as drawn.

| Role | Primary tabs (left → right) | Source |
| ---- | --------------------------- | ------ |
| EMPLOYEE | Beranda · Kehadiran · Cuti · KPI · Akun | gambar 1 |
| SUPERADMIN | Beranda · Approval · Karyawan · Laporan · Akun | gambar 2 |
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
- Section header: 16–18px, weight 700.
- Body: 13–14px, weight 400–500.
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
- The reference's hand-drawn map background is illustrative only. The
  Leaflet preview remains P1 stretch in `REFERENCE_REPO_ANALYSIS.md`.
- The "Penggajian" mock is high-fidelity but our payroll module is
  intentionally read-only for MVP; full payroll integration is Phase 2.
