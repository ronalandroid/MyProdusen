# React Doctor false positives

Documented suppressions verified against each rule's canonical validation prompt.

## react-doctor/no-adjust-state-on-prop-change

The four `error`-severity hits are false positives. The rule's own validation
prompt states it should NOT fire when the effect kicks off async work (fetch,
geolocation, media teardown) whose later callback sets state — only synchronous
prop-derived setters are real. All four sites set state to start async work:

- `app/dashboard/employees/[id]/page.tsx:43` — mount/id effect launches async `checkRole()` + `fetchEmployee()`.
- `src/components/attendance/RealtimeSelfieCamera.tsx:141` — imperative media-stream teardown (`stopCamera`) on `disabled` prop, an external side effect, not duplicated state.
- `src/components/dashboard/EmployeeBeranda.tsx:308` — `setIsGettingGps(true)` starts async `navigator.geolocation.getCurrentPosition`.
- `src/components/dashboard/LeaderBeranda.tsx:259` — same async geolocation start.

---

## Frontend UI/UX v4 update

Current frontend UI/UX baseline:
- Design language: Strava-inspired, metric-first, mobile-first.
- Brand accent: `#FFC107` yellow.
- Fonts: Poppins for UI/headings, JetBrains Mono for stats and numeric values.
- Surfaces: soft gray page bands with white cards.
- Radius: 8px default radius.
- Navigation: white desktop sidebar with yellow active left border; mobile bottom nav with yellow active state.
- Shared primitives restyled globally through `app/globals.css`: `.btn`, `.input`, `.card`, `.table`, `.badge`, `.nav-item`, `.stat-card`, `.alert`.
- Employee Beranda includes Strava-style stat strip: Hadir, Streak, Skor.

Validation status:
- `npm run lint` passed after UI/UX v4 update.
- `npm run build` passed after UI/UX v4 update.

When updating this document, keep workflow/security/data rules unchanged and only align frontend descriptions with v4 UI/UX language.

