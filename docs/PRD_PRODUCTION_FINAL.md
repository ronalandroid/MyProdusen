# PRD Production Final — MyProdusen Frontend v4

## Product status

MyProdusen frontend is production-ready with v4 UI/UX baseline implemented.

## Product modules

- Authentication and activation.
- Employee Beranda.
- Attendance with GPS/radius/selfie.
- Leave, permission, sick, overtime, and corrections.
- KPI and performance scoring.
- Payroll and documents.
- Announcements and notifications.
- Admin employee, shifts, locations, payroll, reports, audit, and settings.

## Frontend UI/UX v4 requirements

### Brand and design language

- Use yellow `#FFC107` for primary actions and active navigation.
- Use white cards on gray bands.
- Use 8px default radius.
- Use Poppins for interface text.
- Use JetBrains Mono for stats, scores, counts, times, and currency.

### Employee mobile app

Requirements:
- Mobile-first experience.
- Bottom navigation.
- Beranda surfaces: greeting, stat strip, attendance CTA, score/gamification.
- Attendance CTA must remain dominant.
- GPS/radius status must be explicit and textual.

Acceptance criteria:
- Employee can locate Clock In/Out quickly.
- Employee can see Hadir, Streak, and Skor at top of Beranda.
- GPS error or outside-radius state is readable without relying on color only.

### Admin console

Requirements:
- White sidebar with yellow active left-border.
- Metric cards with mono numbers.
- Dense tables with muted uppercase headers.
- Badge status system.
- Flat cards; no heavy shadows.

Acceptance criteria:
- Admin can scan dashboard metrics quickly.
- Active section is clear in sidebar.
- Tables remain readable and build-safe.

## Implemented files

- `app/layout.tsx` — font loading.
- `app/globals.css` — global v4 tokens and component overrides.
- `src/components/dashboard/EmployeeBeranda.tsx` — v4 stats row.

## Verification

- `npm run lint` passed.
- `npm run build` passed.
- Browser smoke check for `/login` passed.

## Open review items

- Login button contrast.
- Small auth links contrast.
- Floating widget overlap on login page.
- Dense admin table readability after redesign.
