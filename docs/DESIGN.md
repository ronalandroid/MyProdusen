# Design System — MyProdusen UI/UX v4

Status: implemented in frontend.

## Design direction

MyProdusen now uses v4 Strava-language UI: energetic, metric-first, mobile-friendly, and clean for admin operations.

## Tokens

```css
--primary: #FFC107;
--bg-main: #F6F6F6;
--bg-card: #FFFFFF;
--border-color: #E8E8E8;
--text-primary: #111111;
--text-secondary: #555555;
--text-muted: #999999;
--radius-md: 8px;
--font-poppins: Poppins;
--font-mono: JetBrains Mono;
```

## Typography

- UI/body: Poppins.
- Headings: Poppins 800/900, tight tracking.
- Numbers/stats: JetBrains Mono 800 with tabular numerals.
- Labels/eyebrows: uppercase, 11–12px, 700 weight.

## Surfaces

- Page background: soft gray band.
- Cards: white, 1px hairline border, 8px radius, minimal shadow.
- Admin data zones: white cards, compact spacing, hairline rows.
- Employee app zones: gray bands between white cards.

## Buttons

- Primary: yellow `#FFC107`, black text, 8px radius.
- Secondary: white, black border, black text.
- Ghost: white/transparent, gray text, border on admin surfaces.
- Danger/success: status-colored filled actions.

## Inputs

- 1.5px border.
- 8px radius.
- Yellow focus border.
- No heavy glow.

## Navigation

### Desktop admin

- White sidebar.
- 240px width.
- Active item: yellow-tinted row + yellow 3px left border.
- Icons stay simple, labels bold on active.

### Mobile employee

- Bottom nav.
- White surface with hairline top border.
- Active item uses yellow/dark-yellow state.
- Touch targets stay 44px+.

## Employee Beranda

Hero pattern:
- Greeting row with avatar and notification button.
- Strava-style stat strip: Hadir, Streak, Skor.
- Primary attendance card with shift, location, GPS, Clock In/Out CTA.
- Gamification and score cards below.

## Admin Dashboard

Admin surfaces inherit v4 tokens:
- Metric cards with mono numbers.
- White tables with uppercase muted headers.
- Tinted badges.
- Compact cards and monitoring panels.

## Implementation files

- `app/layout.tsx` — font loading.
- `app/globals.css` — v4 design override layer.
- `src/components/dashboard/EmployeeBeranda.tsx` — v4 employee stat strip.
- `components/ui/*` — shared primitives inherit CSS variables.
