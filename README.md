# MyProdusen

MyProdusen is internal HRIS frontend for Produsen Dimsum Medan. App covers attendance, leave, overtime, KPI, payroll, documents, announcements, audit, reports, settings, and employee self-service.

## Frontend UI/UX v4 — Strava-language redesign

Status: implemented.

Design source: `MyProdusen Design System-handoff.zip`.

Core visual language:
- Brand accent: `#FFC107` yellow.
- Surfaces: white cards on soft gray bands.
- Radius: 8px as default product radius.
- Typography: Poppins for UI and headings; JetBrains Mono for stat numbers.
- Layout: mobile-first employee app, desktop admin console.
- Navigation: desktop white sidebar with yellow active left border; mobile bottom navigation with yellow active state.
- Components: flat cards, hairline borders, bold CTAs, tinted status badges, compact data tables.

Implemented frontend changes:
- `app/layout.tsx` loads Poppins and JetBrains Mono via `next/font/google`.
- `app/globals.css` contains v4 token and component override layer.
- Shared primitives now inherit v4 tokens through CSS variables.
- Employee Beranda has Strava-style stats row: Hadir, Streak, Skor.
- Login and dashboard screens inherit v4 fonts, colors, surfaces, buttons, inputs, cards, tables, and badges.

## Run

```bash
npm install
npm run dev
```

## Verify

```bash
npm run lint
npm run build
```

Both passed after v4 UI/UX update.
