# Design Production Final — MyProdusen UI/UX v4

## Status

Production frontend design baseline is v4 Strava-language UI/UX.

## Implemented design system

- Accent: `#FFC107` yellow.
- Typography: Poppins for UI/headings, JetBrains Mono for numeric values.
- Surfaces: soft gray page bands and white cards.
- Radius: 8px default.
- Cards: flat white surfaces with hairline border.
- Buttons: yellow primary CTA, white secondary, compact ghost.
- Inputs: 1.5px border, 8px radius, yellow focus border.
- Tables: uppercase muted headers, hairline rows, hover state.
- Badges: tinted status pills.
- Desktop nav: white sidebar, yellow active left border.
- Mobile nav: bottom nav, white surface, yellow active state.

## Key production files

- `app/layout.tsx` — Poppins + JetBrains Mono loaded with `next/font/google`.
- `app/globals.css` — v4 token/component override layer.
- `src/components/dashboard/EmployeeBeranda.tsx` — employee Strava stat row.
- `components/ui/*` — shared primitives inherit v4 variables.

## Screen baseline

### Login

- White form panel.
- Yellow brand action.
- Poppins headings.
- Soft background and clean input fields.

### Employee Beranda

- Greeting and avatar.
- Stats row: Hadir, Streak, Skor.
- Primary attendance card with shift/location/GPS/Clock In/Out.
- Gamification and score cards below.

### Admin console

- White sidebar navigation.
- Metric cards with mono numbers.
- Clean table/card management views.
- Status badges and tinted alerts.

## Production validation

- `npm run lint` passed.
- `npm run build` passed.
- Login browser smoke check passed.

## Review notes

- Recheck login button contrast on physical devices.
- Recheck forgot-password link contrast.
- Recheck floating widget overlap on login left feature list.
- Recheck dense admin tables after Poppins/mono changes.
