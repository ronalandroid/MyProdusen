# Product Requirements Document — MyProdusen

## Current frontend status

MyProdusen frontend now uses v4 UI/UX redesign from handoff. Redesign is implemented globally and applied to main employee/admin flows.

## Product scope

MyProdusen supports HRIS operations for Produsen Dimsum Medan:
- Authentication and account activation.
- Employee attendance with GPS, radius, and selfie validation.
- Leave, permission, sick, overtime, and correction requests.
- KPI and performance scoring.
- Payroll and documents.
- Announcements and notifications.
- Admin employee, shift, location, payroll, audit, and report management.

## Talenta-style professional HRIS UX principles

- Today-first dashboard.
- Admin flows as checklist.
- Tables on desktop, cards on mobile.
- Use status chips for approvals, attendance, payroll, and notifications.
- Use approval timeline for leave, overtime, attendance exception, and payroll review.
- payroll checklist keeps admin flow auditable before final approval.

## Professional Gamification System

- Attendance / Kehadiran: 30%.
- Production KPI: 50%.
- Behavior / Perilaku Kerja: 20%.
- Every new employee starts at 100.
- Formula: `score / 10` for readable 10-point display.
- Badges remain professional and maximum 3–5 visible.

## UI/UX requirements v4

### Visual identity

- Accent: `#FFC107` yellow.
- Default radius: 8px.
- Background: soft gray bands.
- Cards: white, hairline border.
- Fonts: Poppins + JetBrains Mono.

### Employee app

Requirements:
- Phone-first layout.
- Bottom navigation.
- Beranda starts with greeting, stats row, and attendance CTA.
- Attendance card clearly shows shift, location, GPS, clock status, and action.
- Gamification/score visible but secondary to attendance.

Acceptance:
- Employee can identify today’s shift/location within 3 seconds.
- Clock In/Out CTA is primary and thumb-accessible.
- Status messages use color + text, not color alone.

### Admin console

Requirements:
- Desktop white sidebar with yellow active state.
- Dashboard metrics use mono numbers.
- Data tables use compact uppercase headers.
- Status uses badges.
- Management cards remain white/flat.

Acceptance:
- Admin can scan operational counts quickly.
- Active navigation location is obvious.
- Tables remain readable on desktop and scrollable on mobile/tablet.

## Implementation notes

Files updated for v4:
- `app/layout.tsx`
- `app/globals.css`
- `src/components/dashboard/EmployeeBeranda.tsx`

Verification:
- `npm run lint` passed.
- `npm run build` passed.
- Login visual smoke check passed.
