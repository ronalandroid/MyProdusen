# UI/UX Guide

This guide defines the approved mobile-first interface direction for MyProdusen. It complements `prd.md` and does not change product scope, RBAC, attendance rules, storage rules, or the approved stack: Next.js App Router, TypeScript, Drizzle ORM, PostgreSQL, and Tailwind CSS.

## 1. Design Direction

MyProdusen is a yellow-accent HRIS app for Produsen Dimsum Medan. The interface must feel like a practical internal operations tool: clean, warm, direct, fast to understand, and comfortable for non-technical employees.

Approved visual direction:

- Mobile-first HRIS layout with desktop responsive expansion.
- Yellow brand accent used for primary actions, highlights, and active navigation.
- Soft gray app background with white rounded cards.
- Rounded cards, rounded inputs, and rounded action buttons.
- Clear hierarchy with short Indonesian labels in product UI.
- Dashboard-style information cards with status chips and concise metrics.
- Bottom navigation for core employee mobile flows.
- Professional admin desktop layouts for dense tables, filters, and reports.

Do not redesign the product into a different brand, theme, or UI kit. Do not introduce Bootstrap, Tabler, or unrelated design systems.

## 2. Brand Tokens

Use existing brand colors consistently:

| Token | Value | Usage |
| --- | --- | --- |
| Primary Yellow | `#FFC107` | Primary CTA, active bottom-nav item, key highlights |
| Accent Red | `#E53935` | Danger, rejection, late status |
| Base Black | `#111111` | Primary text |
| Soft Gray | `#F5F5F5` | Backgrounds, borders, neutral areas |
| White | `#FFFFFF` | Cards, panels, form surfaces |

Guidelines:

- Use yellow with restraint; one primary action per main view is preferred.
- Use red only for destructive, rejected, late, or critical states.
- Keep status colors accessible and do not rely on color alone.
- Preserve existing logo and product name.

## 3. Layout System

### Mobile-first shell

Mobile screens should use:

- Safe-area aware page container.
- Sticky or fixed bottom navigation for employee flows.
- Main content cards stacked vertically with consistent spacing.
- Large touch targets, minimum 44 px height.
- Primary action placed near thumb reach when possible.
- Clear loading, empty, error, and success states.

### Desktop admin shell

Desktop screens should use:

- Existing dashboard layout and navigation pattern.
- Filter bar above tables and reports.
- Summary cards before dense data.
- Paginated tables for employees, attendance, KPI, leave, and reports.
- Responsive columns that collapse cleanly on tablets.

### Cards and surfaces

- Cards use white surface, rounded corners, subtle border or shadow.
- Related actions stay inside the relevant card.
- Avoid noisy gradients and decorative elements that reduce clarity.
- Use compact cards for metrics and wider cards for forms or tables.

## 4. Navigation

Employee mobile bottom navigation should prioritize:

1. Dashboard
2. Attendance
3. Leave
4. KPI
5. Profile

Admin and Superadmin navigation should prioritize:

1. Dashboard
2. Employees
3. Attendance
4. Leave
5. KPI
6. Reports
7. Settings / Audit, depending on role

Navigation rules:

- Active item uses yellow accent and clear label.
- Disabled or unauthorized items must not appear as accessible routes.
- Backend RBAC remains source of truth even if navigation hides items.
- Navigation labels should be short and understandable in Indonesian UI.

## 5. Required Screens

### Onboarding

Purpose: introduce MyProdusen as internal HRIS and guide user to login.

Requirements:

- Brand-focused welcome screen with yellow accent.
- Short copy explaining attendance, leave, KPI, and employee profile.
- Clear login CTA.
- No marketing-heavy content; app is internal.

### Login

Requirements:

- Simple email/username and password form.
- Clear validation messages.
- Visible loading state after submit.
- Friendly inactive-user and invalid-credential errors without leaking account details.
- No public registration unless explicitly approved.

### Dashboard

Employee dashboard shows:

- Today attendance status.
- Check-in / check-out action entry point.
- Shift and work location summary.
- Leave request status.
- KPI snapshot.
- Recent notifications.

Admin/Superadmin dashboard shows:

- Active employee count.
- Attendance today.
- Late, absent, leave/sick/permission counts.
- Geo-fence rejected/pending alerts.
- KPI summary and risk indicators.
- Reports shortcuts.

Superadmin monitoring dashboard additionally shows:

- Management cards for `Management User & Role`, `Approval Center`, and
  `Reports & Export`.
- 7-day attendance bar diagram using brand-safe CSS bars.
- Division monitoring bars for active employee count and attendance rate.
- KPI overview with average score, approval counts, top performers, and low
  performers.
- Employee risk list for repeated late/absent/low KPI signals.
- All cards keep the same MyProdusen visual system: yellow for primary
  highlight, red for risk only, white rounded cards, soft gray surfaces, and
  concise Indonesian labels.

### Attendance

Requirements:

- Realtime camera-only selfie capture using `navigator.mediaDevices.getUserMedia()`.
- Live camera preview before capture.
- Capture frame through canvas and submit as `FormData` blob.
- No upload button, no gallery picker, no `<input type="file">`, no `accept="image/*"` attendance fallback.
- GPS permission request with clear status: waiting, allowed, denied, inaccurate, outside radius.
- Backend geofence result displayed in plain language.
- Check-in and check-out flows both require realtime selfie and GPS.
- Pending or rejected outside-radius attempts show next steps.

### Employees

Requirements:

- Admin table with search, filters, pagination, status chips, and action menu.
- Employee detail cards for identity, NIP, division, position, supervisor, work location, shift, and status.
- NIP shown as system-generated and not editable after creation.
- Deactivation UI must explain historical data remains preserved.

### Leave / Sick / Permission

Requirements:

- Employee request form with type, date range, reason, and optional attachment only if backend allows secure upload.
- Overlap validation error shown clearly.
- Pending, approved, and rejected states use readable status chips.
- Rejection reason visible to requester.
- Approval actions only visible to authorized Supervisor, Admin HR, or Superadmin.

### KPI

Requirements:

- KPI template and assignment screens use clear weight totals.
- KPI scoring UI shows method: higher is better, lower is better, or boolean.
- Employee view is read-only.
- Approved KPI edit requires authorized role and reason.
- KPI dashboard shows score trend and status without exposing unauthorized employee data.

### Profile

Requirements:

- Employee identity, role, division, position, supervisor, work location, and shift summary.
- Account status and notification preferences where supported.
- No sensitive data beyond authenticated user's scope.

### Email Templates

Purpose: make authentication emails feel like the same MyProdusen product,
not generic system mail.

Requirements:

- Use the same brand direction as the app: yellow header, black primary text,
  white rounded card, soft gray background, and concise Indonesian copy.
- Header shows `MyProdusen` and `Produsen Dimsum Medan`.
- Footer explains the email is automatic and directs users to HRD/Superadmin.
- Primary action uses one yellow CTA button with black text.
- Security-sensitive emails include clear expiry or warning copy.
- Copy may be warm and motivating, but must stay professional and easy for
  non-technical staff.
- Templates live in `lib/email.ts` and are sent through Resend.

Approved copy tone examples:

- “Semangat kerja dimulai dari langkah kecil yang rapi.”
- “Satu sistem, banyak manfaat: data lebih tertata, kerja lebih tenang, tim
  lebih kompak.”
- “Kerja lancar dimulai dari akun yang aman.”

### Reports

Requirements:

- Filter-first interface for date range, division, position, work location, employee, and status.
- Summary cards before export actions.
- CSV export as required baseline.
- Export action explains scope and creates audit log.
- Supervisor reports only team data; Employee reports only own data when allowed.

## 6. Attendance Security UX

The UI must communicate these rules without weakening them:

- GPS and selfie are mandatory for check-in and check-out.
- Backend validates RBAC, active employee, active shift, active work location, GPS accuracy, distance, and selfie file.
- Frontend distance calculation is only informational if present.
- Private selfie storage means users do not receive public selfie URLs.
- Authorized selfie views go through protected API routes only.
- Manual attendance adjustment requires reason and creates audit log.
- Outside-radius attempts are rejected or marked pending based on configuration and are stored for audit.

## 7. Accessibility

- Maintain readable contrast against yellow and gray backgrounds.
- Every input has visible label and error text.
- Buttons have clear accessible names.
- Status chips include text, not color alone.
- Loading states avoid layout jumps where possible.
- Camera and GPS permission errors must be readable and actionable.
- Keyboard navigation must work for admin tables, forms, dialogs, and menus.

## 8. Content Tone

Product UI copy should be Indonesian, concise, and operational. Documentation stays English.

Preferred UI tone:

- Direct: "Check-in berhasil".
- Helpful: "Lokasi terlalu jauh dari area kerja".
- Specific: "Selfie wajib diambil langsung dari kamera".
- Non-blaming: "Izin lokasi belum aktif".

Avoid:

- Technical stack terms in user-facing messages.
- Playful or consumer-app language.
- Vague errors like "Something went wrong".

## 9. Implementation Guardrails

- Use Tailwind and existing components/patterns.
- Keep UI code modular and role-aware.
- Do not add heavy UI dependencies without documented reason.
- Do not expose private storage paths or direct upload URLs.
- Do not add attendance upload/gallery fallback.
- Do not bypass backend RBAC or business rules for UI convenience.
- Keep docs updated when UI behavior changes.
