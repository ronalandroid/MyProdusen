# Performance — MyProdusen

> Production performance notes for mobile-first dashboard, PWA, and Coolify deployment.

## UI Performance Rules

- Production dashboard pages must not render engineering/debug pipeline blocks.
- Mobile bottom navigation is limited to five primary items to prevent wrapping and layout thrash.
- Bottom navigation uses safe-area padding so PWA standalone and mobile browser address bars do not hide content.
- Dashboard pages keep content scrollable with dynamic viewport behavior and bottom padding larger than the bottom navigation height.
- Heavy device features such as camera/selfie remain scoped to attendance and must stop streams on unmount.

## Current Production UI Performance Fix — 2026-05-22

- Removed visible debug pipeline cards/chips from dashboard, attendance, approval, audit, employees, KPI, leave, locations, notifications, payroll, reports, shifts, and users pages.
- Reduced mobile navigation to five primary items per role.
- Removed mobile nav logo/mascot leakage by keeping the desktop logo desktop-only.
- Kept feature wiring intact; removed visual debug blocks only.

## QA Breakpoints

Check at minimum: 320, 360, 390, 430, 480, 768, 834, 1024, 1280, 1440, and 1920 px widths.

Pass criteria:

- No horizontal overflow.
- No two-row bottom nav.
- No bottom nav covering page content.
- No clipped button or search text.
- No stuck scroll or frozen camera stream.
- No engineering labels visible to production users.

## CDN Performance And Cache Policy — 2026-05-22

- Cloudflare caches public static assets such as `/_next/static/*` and `logo-fast.webp` with long-lived public cache headers.
- Dashboard and API responses are explicitly `no-store, private` to prevent stale user state after login/logout.
- `/uploads/*` is explicitly `no-store, private` to prevent legacy public upload objects from being cached by browsers or Cloudflare.
- `public/sw.js` stays install/activate-only and does not intercept fetches, preventing stale dashboard, payroll, selfie, PDF, and API responses.
- Validate CDN behavior after redeploy with `BASE_URL=https://myprodusen.online npm run verify:cdn`.

## Mobile Navigation Performance — 2026-05-22

- Phone bottom nav is capped to one row and five items to prevent wrapping, reflow, and content overlap.
- Tablet and desktop switch to sticky sidebar navigation, reducing fixed bottom overlay work on larger screens.
- Mobile content uses `min-height: 100dvh` and safe-area padding so browser address bars and PWA gesture bars do not hide page content.
- Skip link is visually hidden until focus, preventing accidental visible overlay on touch render.
