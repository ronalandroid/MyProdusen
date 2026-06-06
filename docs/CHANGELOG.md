# Changelog

## 2026-06-06 — Frontend UI/UX v4 redesign

### Added

- Poppins font loading through `next/font/google`.
- JetBrains Mono font loading through `next/font/google`.
- v4 global design override layer in `app/globals.css`.
- Strava-style employee stat row on Beranda: Hadir, Streak, Skor.
- New v4 helper classes:
  - `.v4-stats-row`
  - `.v4-stat`
  - `.v4-stat-label`
  - `.v4-stat-value`
  - `.mono`

### Changed

- Brand accent standardized to `#FFC107`.
- Default product radius standardized to 8px.
- Cards flattened to white surfaces with hairline borders.
- Buttons, inputs, badges, tables, alerts, and nav restyled through shared CSS variables.
- Desktop sidebar restyled to white Strava-like nav with yellow active left border.
- Mobile bottom nav restyled to clean white surface with yellow active state.
- Dashboard numbers now inherit JetBrains Mono where shared stat classes apply.

### Verified

- `npm run lint` passed.
- `npm run build` passed.
- Login page smoke check passed in browser.
