# Design Checklist

> **AI agent role source of truth:** MyProdusen production uses exactly two roles: `SUPERADMIN` and `EMPLOYEE`. `ADMIN_HR` and `SUPERVISOR` are historical database values only and must not be exposed in production UI or route access.


Per-screen contract derived from `docs/references/screens/*.png`. Every box
must hold for the live web app. Reference for tooling: a deviation = the
canonical gate must fail. If you cannot match an item exactly, stop and
ask the operator before improvising.

Conventions:

- **Required:** must be present and visually equivalent to the reference.
- **Forbidden:** must NOT appear, even if it would seem like an improvement.
- **Tokens:** brand tokens defined in `app/globals.css` `:root`. Never
  hard-code hex values in components.

## Brand tokens (locked)

| Token | Value | Allowed use |
| ----- | ----- | ----------- |
| `--primary` | `#FFC107` | CTA, active nav, hero highlight |
| `--accent-red` / `--danger` | `#E53935` | Danger, late, destructive |
| `--text-primary` | `#111111` | Primary text |
| `--bg-main` | `#F5F5F5` | Background, neutral surfaces |
| `--success` | `#22C55E` | Approved, valid, on-time |
| `--warning` | `#F59E0B` | Pending review |

---

## EMPLOYEE APP SHELL — `screens/employee-full-ui-ux-mobile.png`

### Bottom navigation (5 tabs, mobile only)

Required (left → right):

1. Beranda (home icon)
2. Kehadiran (clock icon)
3. Cuti (calendar icon)
4. KPI (chart icon)
5. Akun (user icon)

Forbidden:

- More than 5 tabs.
- Sidebar on mobile (≤ 1023 px).
- Reordering tabs.
- Replacing icons with emoji.

### Beranda (Employee dashboard)

Required:

- Yellow greeting card at top with first-name, role label, and avatar
  initial in a circle.
- 4 metric cards in a 2×2 grid (mobile) or single row (desktop) showing:
  Hadir (green check), Izin (blue), Cuti (yellow), Sakit (red).
- 7-day attendance bar chart using `var(--primary)` for "hadir" days and
  `var(--bg-input)` for empty days.
- "Lokasi Kerja" card with name, address, distance, and a small map preview.
- "Riwayat Kehadiran" list with the last 5 records and their status chip.

Forbidden:

- Gradients other than the documented yellow gradient.
- Stat cards with neutral grey-only colour (status colour is required).
- Decorative emoji as primary visual.

### Kehadiran (Check-in / check-out)

Required:

- Date header with weekday in Indonesian.
- Status banner (Sudah / Belum check-in / check-out) with the right token
  colour: yellow for pending, green for done, red for missed.
- Realtime selfie camera card (no file picker, no gallery, no
  `<input type="file">`, no `accept="image/*"`).
- Compressed selfie preview after capture with size + format meta.
- Two large action buttons: green Check-In (success), red-outline Check-Out
  (danger-outline). Disabled state when not allowed.
- "Lokasi Kerja" card with map pin and address.
- "Riwayat Kehadiran" with "Lihat Selfie Masuk / Pulang" buttons that open
  the protected SelfieViewer modal.
- "Ajukan Koreksi Absensi" form (`MyExceptionPanel`) below history with
  "Pengajuan Saya" list of own pending/approved/rejected exceptions.

Forbidden:

- Any path or URL string of a selfie shown to non-admin viewers.
- Direct `<img src=…>` to upload paths.
- Manual upload fallback under any condition.

### Cuti / Karyawan / KPI / Profil

Required:

- Use the same card vocabulary: yellow header zone, white body, soft-gray
  app background, status chips with named tokens.
- Forms have visible labels, ≥ 44 px tap targets, `loading/empty/error/success`
  states.
- Lists are paginated server-side, never infinite scroll.
- Profile page shows brand logo, identity, role, action buttons (Ubah Kata
  Sandi, Notifikasi, Tentang Aplikasi, Keluar).

Forbidden:

- Raw `confirm()` / `alert()` for destructive actions on production pages.
- Tables that horizontally scroll the page (only the table-container should
  scroll).

---

## SUPER ADMIN APP SHELL — `screens/super-admin-full-ui-ux-mobile.png` and `screens/super-admin-full-ui-ux-desktop.png`

### Bottom navigation (5 tabs, mobile only)

Required (left → right):

1. Beranda (home icon)
2. Cabang (map-pin icon) — `/dashboard/locations`
3. Approval (check-circle icon) — `/dashboard/attendance/exceptions`
4. Laporan (file-text icon) — `/dashboard/reports/attendance`
5. Akun (user icon)

Forbidden:

- Same forbiddens as Employee shell.

### Dashboard Super Admin

Required:

- Hero card with "Selamat Datang, Super Admin!" copy and yellow-on-black
  brand bar.
- Ringkasan Perusahaan: 4 metric cards (Total Karyawan, Cabang Aktif,
  Pengajuan Pending, Total Gaji).
- "Trend Kehadiran" line/bar chart for the last 7 days.
- "Aktivitas Sistem Terbaru" feed.
- "Approval Pending" list with row actions: Detail / Setujui / Tolak.

### Manajemen Cabang

Required (uses live API at `/dashboard/locations`):

- Search input (debounced) + active/inactive filter.
- Card grid using `minmax(min(100%, 340px), 1fr)` so cards never break
  320 px viewport.
- Each card: brand-yellow status strip, address, koordinat, radius m,
  edit/delete actions, OSM map preview with SVG geofence circle.
- Create/edit modal with live OSM map preview as the form fields change.

Forbidden:

- Mock data. Always use the live API.

### Manajemen User & Role / Approval Center / Monitoring Payroll & KPI / Pengaturan Sistem

Required:

- Same card vocabulary.
- Search + filter + paginated list.
- Status chips for Aktif / Menunggu / Disetujui / Ditolak using tokens.
- Activity logs visible in `Pengaturan Sistem` mapping to `AuditLog`.

---

## EMAILING SYSTEM — `screens/full-ui-ux-emailing-system.png`

Detailed style/tone/copy is locked in `docs/references/email-style-guide/README.md`.
Summary contract:

Required:

- Yellow header with `MyProdusen` brand and `Produsen Dimsum Medan`
  subtitle, plus optional `by TBM Group` badge.
- Single rounded white card on a `#FFF9E6` outer background.
- Single primary CTA (yellow, black text, ≥ 48 px height, `border-radius: 12px`).
- Footer: `MyProdusen / Sistem internal perusahaan by TBM Group / Produsen
  Dimsum Medan / Medan, Sumatera Utara` plus the disclaimer line.
- Indonesian copy. Friendly, professional, never marketing.
- Each transactional email has the documented purpose:
  - Register / Welcome
  - Email Verification (24h expiry)
  - Waiting Assignment
  - Account Activated
  - Forgot Password (30 min expiry)
  - Password Changed
  - General Notification
  - Leader / KPI Production
- Inline CSS only, table-based layout, mobile-friendly.

Forbidden:

- Marketing language (`Beli`, `Diskon`, `Trial`, `Demo`, `Customer`, `Client`).
- Multiple CTAs in the same email.
- External fonts that the email client may not render.
- Showing tokens or passwords in the body.

---

## Acceptance criteria → screen map

| PRD §8 acceptance criterion | Reference screen |
| --------------------------- | ---------------- |
| User register + activation + login | `full-ui-ux-emailing-system.png` (Register, Verify, Welcome flow) |
| Superadmin user placement | `super-admin-full-ui-ux-mobile.png` / `super-admin-full-ui-ux-desktop.png` (Manajemen User & Role) |
| Employee creation with auto-NIP | Employee shell + Super Admin Karyawan |
| Work location + shift configuration | Manajemen Cabang on Super Admin shell |
| Check-in / check-out with GPS + realtime selfie | `employee-full-ui-ux-mobile.png` Kehadiran |
| Backend geofence + selfie metadata | (no UI; covered by tests) |
| Leave / sick / permission flow | Employee Cuti screen |
| KPI template + assignment + scoring + approval | Employee KPI + Super Admin Monitoring KPI |
| Role-aware dashboards | Beranda on both shells |
| Reports + export | Laporan on Super Admin shell |
| Notifications + audit log | Footer of every email + Pengaturan Sistem audit |

---

## Verification rules

For every UI merge:

1. The diff must match a row in this checklist.
2. `npm run release:check` exits 0.
3. Manual viewport spot-check at 320 / 375 / 768 / 1024 / 1440 px.
4. If a regression test exists for the feature (e.g. RBAC, reports, GPS
   validation), it must pass.

If the operator has not approved a new design board, the checklist wins —
not the engineer's interpretation.
