# Gamification — Professional HRIS Motivation

## Professional Gamification System

### Purpose
Gamification exists to help employees understand attendance, production KPI, behavior score, and annual raise projection in a motivating but professional way. MyProdusen remains a professional HRIS first; fun motivation is secondary and must support factory/team productivity.

### Formula
Total score is 100 points:

- Attendance / Kehadiran: 30%.
- Production KPI: 50%.
- Behavior / Perilaku Kerja: 20%.

Every new employee starts at 100. Score changes must come from real attendance, KPI, and behavior/culture score data only.

### Annual Raise Projection
Default projection:

- Score 100 = up to 10% raise projection.
- Score 60 = up to 6% raise projection.
- Formula: `score / 10`.

Projection is an estimate only and must wait for Superadmin/company owner evaluation and approval. It must not be presented as guaranteed salary change.

### Required Gamification UI Components
Keep gamification focused on these elements only:

1. Main score card.
2. Attendance streak calendar.
3. Raise projection/progress card.
4. Achievement badges, maximum 3–5 visible.
5. Simple motivational copy.

Avoid too many badges, noisy animation, excessive colors, game-like clutter, childish UI, fake numbers, payroll privacy leaks, and generic AI-dashboard appearance.

### Attendance Streak Calendar
Monthly view states:

- Attended day = active chicken marker.
- Today = highlighted ring.
- Leave day = soft leave indicator.
- Holiday/off day = grey/neutral marker.
- Absent day = muted warning.
- Future day = empty/neutral.

### Achievement Badges
Recommended badges:

- 7 hari hadir.
- 14 hari konsisten.
- 30 hari konsisten.
- Tepat waktu 7 hari.
- KPI target tercapai.

Do not add excessive badges. Badge visibility should remain compact and mobile-first.

### Role Access
Employee sees own score, own streak, own badges, and own raise projection only.

Leader sees own score/streak plus assigned team attendance and KPI summary only. Leader must not see team salary, payroll amount, or private payslip data.

Superadmin sees company performance overview, division/team/month filters where available, all employee score summaries, top performers, at-risk employees, behavior score input/review, and report export if already supported.

### Privacy and Data Integrity
Gamification must not expose payroll details to Leader or other employees. No fake score, mock attendance, or fake KPI is allowed in production. Private gamification endpoints must use authenticated RBAC and no-store/private cache where sensitive.

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

