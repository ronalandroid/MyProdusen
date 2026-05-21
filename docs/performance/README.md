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
