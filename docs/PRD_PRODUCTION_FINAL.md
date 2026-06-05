# PRD — MyProdusen HRIS · Production Ready
## PT Tcipta Buana Mandiri · Produsen Dimsum Medan · v5.0 FINAL

**Perusahaan:** PT Tcipta Buana Mandiri (TBM Group)
**Produk:** MyProdusen HRIS
**Platform:** Mobile-first PWA · Desktop Superadmin
**Stack:** Next.js 15 · TypeScript 5 · PostgreSQL 16 · Drizzle ORM · Tailwind v4 · Docker · Coolify
**Version:** FINAL 5.0.0 · 2026-06-04
**Status:** ✅ Production-Ready — No MVP Restrictions
**Benchmark:** Mekari Talenta · GreatDay HR · LinovHR · Gadjian · Kerjoo

---

## 1. Competitive Intelligence & Positioning

### 1.1 Competitor Matrix

| Fitur | Mekari Talenta | GreatDay HR | Gadjian | Kerjoo | **MyProdusen** |
|-------|---------------|-------------|---------|--------|----------------|
| GPS + Selfie Absensi | ✅ | ✅ | ✅ | ✅ | ✅ |
| Liveness Detection | ✅ | ✅ | ❌ | ❌ | ✅ |
| Gamifikasi Skor | ❌ | Terbatas | ❌ | ❌ | **✅ Full (skor 100)** |
| KPI Produksi Custom | Terbatas | Terbatas | ❌ | ❌ | **✅ Factory-specific** |
| KPI Cetakan Pabrik | ❌ | ❌ | ❌ | ❌ | **✅ Unique** |
| PDF Laporan Profesional | Terbatas | Terbatas | Terbatas | ❌ | **✅ 14 chart types** |
| Payroll Auto PPh21+BPJS | ✅ | ✅ | ✅ | ❌ | ✅ |
| Overtime Otomatis | ✅ | ✅ | Terbatas | ❌ | ✅ |
| Offline Mode | ❌ | ❌ | ❌ | ❌ | **✅ Service Worker** |
| Shift Handover Notes | ❌ | ❌ | ❌ | ❌ | **✅ Unique** |
| Lembur Management | ✅ | ✅ | ✅ | Terbatas | ✅ |
| Push Notifications | ✅ | ✅ | Terbatas | ❌ | ✅ |
| Clock In Prominent UI | ❌ (Pain point) | ✅ | ❌ | ✅ | **✅ Above fold** |
| Koreksi Absensi | ✅ | ✅ | ✅ | ❌ | ✅ |
| Harga | Mahal/per-seat | Menengah | Terjangkau | Gratis/murah | **Owned = $0/seat** |
| Industry-specific | General | General | General | General | **✅ Dimsum factory** |

### 1.2 Keunggulan MyProdusen vs Talenta

Berdasarkan riset dari Capterra, G2, Gartner, dan Medium UX case study:

**Pain point Talenta yang MyProdusen solve:**
```
1. "Clock in/out tidak prominent di dashboard" (Medium UX study 2023)
   → MyProdusen: Clock In/Out above fold, kartu shift langsung visible

2. "Slow loading during peak hours" (G2, Gartner reviews)
   → MyProdusen: Server Components + PPR + skeleton screens = < 2.5s LCP

3. "Some analytics could go deeper" (Gartner 2025)
   → MyProdusen: 14 chart types di PDF + real-time HR dashboard

4. "Errors during maintenance / bugs in attendance" (Capterra 2025)
   → MyProdusen: Offline queue + Service Worker = zero downtime absensi

5. "No UAT database" (GetApp complaint)
   → MyProdusen: Staging environment built-in di Docker Compose

6. "General platform, not industry-specific"
   → MyProdusen: Tailored 100% untuk produksi dimsum TBM
```

**MyProdusen Unique Differentiators:**
```
1. Gamifikasi Skor 100:      Tidak ada di kompetitor manapun
2. KPI Cetakan Dimsum:       Factory-production specific, real unit tracking
3. Shift Handover Notes:     Catatan antar shift = safety & continuity pabrik
4. Offline-First Absensi:    Kompetitor semua online-only
5. Owned Platform:           Zero per-seat cost setelah deployment
6. PDF dengan 14 chart type: Melebihi kapabilitas laporan Talenta
```

---

## 2. Executive Summary & OKRs

**Visi:** MyProdusen adalah HRIS terbaik untuk industri produksi makanan Indonesia — lebih relevan dari Talenta, lebih kuat dari Gadjian, lebih terjangkau dari LinovHR.

### Primary Goals

| P | Goal |
|---|------|
| P0 | Absensi GPS + Selfie + Liveness detection — radius 150m Jl. Gurila Gg. Anggrek |
| P0 | KPI produksi dimsum: cetakan, kebersihan, disiplin, kecepatan, kerapian |
| P0 | Gamifikasi: skor 100 → turun otomatis → salary raise formula skor/10 |
| P0 | Payroll otomatis: kehadiran + KPI + lembur + potongan |
| P0 | Laporan PDF profesional: weekly + monthly + 14 charts |
| P0 | Sync realtime seluruh data ke Superadmin |
| P1 | Overtime / lembur management |
| P1 | Offline mode + push notifications |
| P1 | Koreksi absensi + shift swap |
| P1 | Dokumen karyawan + onboarding |
| P2 | BPJS + PPh 21 estimasi (display only, bukan disbursement) |

### OKRs

**O1 — Operasional Digital (30 hari)**
- KR1: 100% karyawan aktif absen via app (zero kertas)
- KR2: Rekonsiliasi absensi < 5 menit/hari (vs 30+ menit manual)
- KR3: Semua KPI mingguan ter-input sebelum Senin 09:00

**O2 — Performance**
- KR1: Clock In success rate ≥ 99% (Android + iOS + offline fallback)
- KR2: LCP < 2.5s (4G) · Lighthouse ≥ 85
- KR3: API p95 < 3s · PDF generate < 20s

**O3 — Adoption & Impact**
- KR1: DAU/MAU Employee ≥ 80%
- KR2: Payroll reconciliation: dari 2 hari → 2 jam
- KR3: 100% karyawan tahu skor KPI mereka realtime

---

## 3. Role Matrix & RBAC

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  SUPERADMIN — PT Tcipta Buana Mandiri HR/Owner                      │
│  Full control. Satu akun. Tidak bisa submit absensi normal.         │
│                                                                     │
│  BISA: Semua data + konfigurasi + PDF laporan + payroll engine      │
│        + gamifikasi config + user management + audit log             │
│        + BPJS display + override skor + koreksi absensi             │
│  TIDAK BISA: Clock In/Out normal (diblokir API + middleware)        │
└─────────────────────────────────────────────────────────────────────┘
         ↓ assign team            ↓ publish payslip
┌─────────────────────────────────────────────────────────────────────┐
│  LEADER — Kepala Tim / Mandor                                       │
│  Self-service + input KPI tim yang ditugaskan                       │
│                                                                     │
│  DIRI SENDIRI: Clock In/Out · Cuti · Skor · KPI · Slip gaji        │
│  TIM: Input KPI (cetakan, kebersihan, dll) · Lihat absensi          │
│       Approve cuti (forward SA) · Lihat skor tim (summary)          │
│       Shift handover notes · Roster harian tim                       │
│  TIDAK BISA: Gaji/slip tim · KPI diluar tim · Konfigurasi           │
└─────────────────────────────────────────────────────────────────────┘
         ↓ see own data only
┌─────────────────────────────────────────────────────────────────────┐
│  EMPLOYEE — Karyawan                                                │
│  Self-service personal HRIS. Read-only untuk KPI dan skor.          │
│                                                                     │
│  BISA: Clock In/Out · Skor (detail) · KPI (read-only) · Kalender   │
│        Slip gaji sendiri · Cuti/izin/sakit · Notifikasi · Profil    │
│        Proyeksi kenaikan gaji · Achievement badges                  │
│  TIDAK BISA: Data karyawan lain · Input KPI · Konfigurasi apapun   │
└─────────────────────────────────────────────────────────────────────┘
```

### RBAC Hard Constraints (All Server-Enforced)

```
1. Superadmin = tidak bisa Clock In/Out (middleware + API block)
2. Leader input KPI = hanya assigned team (server-scope)
3. Employee reads = own employee ID only (BOLA/IDOR blocked)
4. Gaji/Slip = employee sendiri + Superadmin ONLY
5. Skor override = Superadmin only + mandatory audit log
6. Register publik → EMPLOYEE inactive (never admin/leader from register)
7. Inactive user → login blocked at middleware
8. Frontend RBAC = kosmetik. Backend = otoritas final & satu-satunya
```

---

## 4. Tech Stack — Production Grade

```
CORE:
  Framework:      Next.js 15.3+ (App Router · Server Components · PPR · Server Actions)
  Language:       TypeScript 5.7+ (strict mode · no any)
  Runtime:        Node.js 22 LTS

UI:
  Component kit:  shadcn/ui + Radix UI (WCAG 2.1 AA built-in)
  Styling:        Tailwind CSS v4 (@theme CSS tokens · zero config file)
  Icons:          Lucide React
  Charts:         Recharts 2.x (SSR capable for PDF)
  Maps:           Leaflet.js + OpenStreetMap (zero API cost)
  Animation:      CSS + minimal Framer Motion (for score gauge only)

DATA:
  ORM:            Drizzle ORM 0.39+ (type-safe · zero overhead · UUID v7)
  Database:       PostgreSQL 16 (partitioning · RLS · materialized views)
  Cache:          PostgreSQL materialized views + Redis (optional for scale)
  Data fetching:  TanStack Query v5 (stale-while-revalidate · optimistic UI)
  Mutations:      Next.js Server Actions + Zod (end-to-end type safety)
  Forms:          React Hook Form + Zod (shared client/server schema)

STATE:
  Client state:   Zustand v5 (attendance flow · UI state)
  Server state:   TanStack Query v5
  Flow state:     sessionStorage (persisted Zustand)

AUTH:
  Library:        better-auth v1 + Drizzle adapter
  Session:        HTTP-only cookie · Secure · SameSite=Strict
  Expiry:         24h (configurable)

NOTIFICATIONS:
  Push:           Web Push API + VAPID (built-in browser · no 3rd party)
  Email:          Resend + React Email (branded templates)
  In-app:         Real-time SSE (Server-Sent Events)

STORAGE:
  Files:          Docker persistent volume
  Access:         /api/files/[...path] (authenticated proxy, no public URL)
  Image process:  Sharp (selfie compress · face-crop · 800px · 80% JPEG)

PDF ENGINE:
  Generator:      Puppeteer (HTML → PDF, print-quality A4)
  Charts in PDF:  Recharts SSR → SVG → PNG via Sharp (2x DPI)
  Template:       React HTML + embedded CSS + brand fonts

JOBS:
  Scheduler:      node-cron (weekly/monthly report auto-gen · score cron)
  Queue:          bull/bullmq (PDF generation queue, offline sync)

TESTING:
  Unit/Integration: Vitest + Testing Library
  E2E:            Playwright (mobile viewport + real GPS mock)
  Score engine:   Dedicated unit tests (100% coverage)

MONITORING:
  Errors:         Sentry (JS + server)
  Analytics:      PostHog self-hosted (privacy-safe, GDPR)
  Uptime:         /api/health endpoint + external ping

DEPLOYMENT:
  Build:          Docker standalone (Next.js)
  Hosting:        Coolify → VPS (self-hosted)
  CI/CD:          GitHub Actions → test → build → deploy
  Env:            Validated at startup (zod env schema)

SECURITY:
  CSRF:           Server Action origin check + CORS
  Rate limiting:  Upstash Ratelimit (or in-memory fallback)
  Headers:        CSP · HSTS · X-Frame-Options · Permissions-Policy
  SQL:            Drizzle parameterized queries (zero raw SQL injection)
```

---

## 5. Project Structure (Production)

```
myprodusen/
├── src/
│   ├── app/
│   │   ├── (auth)/          login · register · activate · forgot/reset password
│   │   ├── (employee)/
│   │   │   ├── layout.tsx   Mobile shell + bottom tab bar + PWA shell
│   │   │   └── dashboard/
│   │   │       ├── page.tsx              [L1] Beranda
│   │   │       ├── absensi/
│   │   │       │   ├── page.tsx          Histori absensi
│   │   │       │   ├── detail/page.tsx   [L2] Detail Absensi
│   │   │       │   └── [id]/page.tsx     Detail record
│   │   │       ├── attendance/
│   │   │       │   ├── clock/page.tsx    [L3] GPS Lokasi
│   │   │       │   ├── selfie/page.tsx   [L4] Selfie + Liveness
│   │   │       │   └── success/page.tsx  [L5] Berhasil
│   │   │       ├── skor/page.tsx         Gamifikasi + breakdown
│   │   │       ├── kpi/
│   │   │       │   ├── page.tsx          KPI view (Employee)
│   │   │       │   └── input/page.tsx    KPI input (Leader only)
│   │   │       ├── lembur/page.tsx       Overtime management
│   │   │       ├── roster/page.tsx       Team roster (Leader only)
│   │   │       ├── kalender/page.tsx     Attendance calendar
│   │   │       ├── cuti/page.tsx         Leave management
│   │   │       ├── inbox/page.tsx        Notifications
│   │   │       └── akun/
│   │   │           ├── page.tsx          Profile + settings
│   │   │           └── dokumen/page.tsx  Document management
│   │   ├── (admin)/
│   │   │   ├── layout.tsx   Sidebar + desktop shell
│   │   │   └── admin/
│   │   │       ├── dashboard/page.tsx    HR Analytics
│   │   │       ├── employees/            List · detail · onboarding
│   │   │       ├── attendance/           Reports · correction · live monitor
│   │   │       ├── kpi/                  Template · review · config
│   │   │       ├── lembur/               Overtime approval + reports
│   │   │       ├── payroll/              Engine · periods · slips
│   │   │       ├── leave/                Approval queue
│   │   │       ├── gamification/         Score overview · override · badges
│   │   │       ├── announcements/        Create · target · pin
│   │   │       ├── reports/              PDF download center
│   │   │       ├── settings/             System config (geofence · shift · KPI · holidays)
│   │   │       └── audit/                Immutable activity trail
│   │   └── api/
│   │       ├── attendance/clock/        Server Action entry
│   │       ├── attendance/today/
│   │       ├── attendance/history/
│   │       ├── attendance/correction/
│   │       ├── kpi/entry/
│   │       ├── kpi/templates/
│   │       ├── lembur/
│   │       ├── leave/
│   │       ├── payroll/
│   │       ├── notifications/
│   │       ├── reports/generate/
│   │       ├── reports/download/[id]/
│   │       ├── files/[...path]/         Private file proxy
│   │       ├── push/subscribe/          Web Push subscription
│   │       ├── health/                  Uptime check
│   │       └── sync/offline/            Offline queue processor
│   │
│   ├── actions/             Server Actions (all mutations)
│   │   ├── attendance.ts    clockAction · correctionAction
│   │   ├── kpi.ts           saveKPIEntry · bulkSaveKPI
│   │   ├── lembur.ts        submitLembur · approveLembur
│   │   ├── leave.ts         submitLeave · approveLeave
│   │   ├── payroll.ts       calculatePayroll · publishPayroll
│   │   ├── gamification.ts  processScoreEvent · overrideScore
│   │   ├── user.ts          createUser · updateUser · deactivate
│   │   └── report.ts        generateReport · deleteReport
│   │
│   ├── components/
│   │   ├── ui/              shadcn/ui (copy-owned)
│   │   ├── attendance/      ShiftCard · ClockButtons · AttendanceMap
│   │   │                    SelfieCapture · LivenessOverlay · AttendanceLog
│   │   │                    StatusBadge · StepIndicator · SuccessScreen
│   │   │                    OfflineBanner · CorrectionForm
│   │   ├── gamification/    ScoreGauge · BreakdownBars · StreakCalendar
│   │   │                    RaiseProjection · AchievementBadges · MotivationalCopy
│   │   │                    ScoreEventList · LeaderboardCard
│   │   ├── kpi/             KPIInputForm · StarRating · KPIProgressBar
│   │   │                    KPIWeeklyTable · KPIHeatmap · BulkKPIInput
│   │   ├── lembur/          LemburForm · LemburHistory · OvertimeCalc
│   │   ├── payroll/         PayslipCard · PayrollBreakdown · EstimationCard
│   │   ├── leave/           LeaveForm · LeaveBalance · LeaveTimeline
│   │   ├── admin/           HRDashboard · AnalyticsCards · AttendanceLiveFeed
│   │   │                    PayrollEngine · ScoreOverride · ReportCenter
│   │   │                    UserTable · KPITemplateBuilder · GamifConfigForm
│   │   ├── reports/         ReportDownloadCard · ProgressIndicator · SavedTable
│   │   ├── layout/          BottomTabBar · AdminSidebar · MobileShell
│   │   │                    PageHeader · PWAInstallBanner
│   │   └── shared/          EmptyState · LoadingSkeleton · ErrorCard
│   │                        Toast · ConfirmModal · ImageViewer
│   │
│   ├── db/
│   │   ├── index.ts         Drizzle client instance
│   │   └── schema/          (see §8 Database Schema)
│   │
│   ├── lib/
│   │   ├── auth.ts          better-auth config
│   │   ├── geofence.ts      Haversine + isInsideRadius
│   │   ├── image.ts         Sharp compression + face-crop
│   │   ├── rbac.ts          requireRole · requireScope helpers
│   │   ├── score-engine.ts  processScoreEvent · calculateAnnualScore
│   │   ├── kpi-engine.ts    calculateKPIAchievement · aggregateKPI
│   │   ├── payroll-engine.ts calculatePayslip · applyRules
│   │   ├── pdf-engine.ts    generatePDF · renderChartsAsPNG
│   │   ├── push.ts          sendPushNotification · VAPID config
│   │   ├── email.ts         Resend wrapper + React Email templates
│   │   ├── audit.ts         auditLog helper
│   │   ├── offline-queue.ts processOfflineQueue · validateOfflinePayload
│   │   └── validations/     Zod schemas (shared client + server)
│   │       ├── attendance.ts
│   │       ├── kpi.ts
│   │       ├── leave.ts
│   │       ├── lembur.ts
│   │       └── payroll.ts
│   │
│   ├── hooks/
│   │   ├── useAttendanceFlow.ts
│   │   ├── useGeolocation.ts
│   │   ├── useCamera.ts
│   │   ├── useLiveness.ts         NEW: liveness detection
│   │   ├── useTodayAttendance.ts
│   │   ├── useScore.ts
│   │   ├── useKPI.ts
│   │   ├── useOfflineQueue.ts     NEW: offline sync
│   │   └── usePushNotifications.ts NEW: web push
│   │
│   ├── stores/
│   │   ├── attendanceStore.ts
│   │   └── uiStore.ts
│   │
│   ├── workers/
│   │   └── service-worker.ts      PWA + offline queue (Workbox)
│   │
│   └── styles/
│       └── globals.css            Tailwind v4 @theme tokens
│
├── jobs/
│   ├── score-cron.ts      Daily: process attendance → update scores
│   ├── report-cron.ts     Weekly/Monthly: auto-generate PDF reports
│   └── push-cron.ts       Daily reminders: Clock In, Clock Out
│
├── tests/
│   ├── unit/              score-engine · kpi-engine · geofence · payroll
│   ├── integration/       attendance flow · leave flow · payroll flow
│   └── e2e/               attendance.spec · kpi.spec · admin.spec
│
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml (app + postgres + redis)
│
├── public/
│   ├── manifest.json      PWA manifest
│   ├── sw.js              Service Worker (offline support)
│   ├── icons/             PWA icons (all sizes)
│   └── mascot/            MyProdusen mascot assets
│
├── drizzle.config.ts
├── next.config.ts
└── vitest.config.ts
```

---

## 6. Database Schema (Production Complete)

### All Tables

```typescript
// USERS
users {
  id, email, username, password_hash
  role: SUPERADMIN | LEADER | EMPLOYEE
  is_active, email_verified
  push_subscription: jsonb  // Web Push subscription object
  created_at, updated_at, deleted_at
}

// EMPLOYEES
employees {
  id, user_id (FK), full_name, employee_number (NIK)
  gender, birth_date, phone, address, emergency_contact: jsonb
  photo_url, id_card_url, contract_url  // private volume paths
  division_id, position_id, team_id, leader_id
  default_shift_id, default_location_id
  employment_type: TETAP|KONTRAK|TRAINING|HARIAN
  training_status: IN_TRAINING|COMPLETED|N_A
  join_date, end_date
  payroll_rule_id, salary_override
  bpjs_kes_number, bpjs_tk_number  // for display only
  npwp_number                       // for PPh21 display
  bank_name, bank_account           // for payslip display
  created_at, updated_at, deleted_at
}

// ORGANIZATIONS
divisions   { id, name, description, created_at }
positions   { id, name, division_id, created_at }
teams       { id, name, division_id, created_at }

// WORK_LOCATIONS
work_locations {
  id, name, address
  latitude: numeric(10,8), longitude: numeric(11,8)
  radius_meters: integer DEFAULT 150  // Jl. Gurila Gg. Anggrek
  is_active, created_by, created_at, deleted_at
}

// SHIFTS
shifts {
  id, name
  type: FIXED|FLEXIBLE|NIGHT|SPLIT
  start_time: "HH:MM", end_time: "HH:MM"
  tolerance_minutes: integer DEFAULT 15
  break_minutes: integer DEFAULT 60
  is_active, created_at, deleted_at
}

// EMPLOYEE_SHIFT_ASSIGNMENTS
employee_shift_assignments {
  id, employee_id, shift_id, location_id
  effective_from: date, effective_to: date
  day_of_week: integer[]  // [1,2,3,4,5] = Mon-Fri
  created_at
}

// ATTENDANCE_RECORDS (PARTITIONED monthly)
attendance_records {
  id, employee_id, shift_id, location_id
  type: CLOCK_IN|CLOCK_OUT
  status: ON_TIME|LATE|EARLY_LEAVE|ABSENT|LEAVE|SICK|PERMISSION
  clocked_at: timestamptz  // PARTITION KEY
  latitude, longitude, accuracy_meters, distance_meters
  is_inside_radius: boolean
  selfie_file_path, selfie_thumb_path
  liveness_score: numeric      // 0-1 dari liveness detection
  liveness_passed: boolean
  note: text MAX 150
  device_info: jsonb          // {userAgent, platform, battery%}
  client_timestamp, ip_address
  is_corrected, corrected_by, correction_note
  created_at
}

// ATTENDANCE_CORRECTIONS
attendance_corrections {
  id, original_record_id, employee_id
  requested_type: CLOCK_IN|CLOCK_OUT|BOTH
  requested_time: timestamptz
  reason: text, attachment_path
  status: PENDING|APPROVED|REJECTED
  reviewed_by, reviewed_at, review_note
  created_at
}

// OVERTIME / LEMBUR
overtime_requests {
  id, employee_id, shift_id
  overtime_date: date
  planned_start: "HH:MM", planned_end: "HH:MM"
  actual_start: timestamptz, actual_end: timestamptz
  planned_hours: numeric, actual_hours: numeric
  reason: text, attachment_path
  status: PENDING|APPROVED|REJECTED|COMPLETED
  approved_by, approved_at
  rate_multiplier: numeric DEFAULT 1.5  // 1.5x or 2x
  overtime_pay: numeric  // calculated
  created_at, updated_at
}

// KPI_TEMPLATES (fully configurable by Superadmin)
kpi_templates {
  id, name, description
  unit: pcs|kg|nilai_1_5|persentase|jam|item
  target_value: numeric, target_per: DAILY|WEEKLY|MONTHLY
  weight_pct: numeric  // sum semua template = 100
  input_by: LEADER|SUPERADMIN|BOTH
  applies_to: jsonb  // {divisions:[], teams:[], all: boolean}
  min_value: numeric, max_value: numeric
  is_active, created_by, created_at, deleted_at
}

// KPI_ENTRIES
kpi_entries {
  id, employee_id, template_id
  period_key: text  // "2025-W23"|"2025-06"|"2025-06-03"
  actual_value: numeric, achievement_pct: numeric
  input_by: FK users.id (Leader)
  note: text MAX 200
  created_at, updated_at
}

// SHIFT_HANDOVER_NOTES (NEW — TBM specific)
shift_handover_notes {
  id, from_leader_id, to_leader_id
  shift_id, handover_date: date
  notes: text  // rich text (max 2000 chars)
  is_read: boolean
  attachments: jsonb  // [{path, name, size}]
  created_at
}

// GAMIFICATION_SCORES
gamification_scores {
  id, employee_id
  month_key: "YYYY-MM", year_key: integer
  base_score: numeric DEFAULT 100  // ALWAYS starts at 100
  attendance_deduct, kpi_deduct, behavior_deduct
  attendance_bonus, kpi_bonus
  current_score: numeric  // base - deductions + bonuses (min 0, max 100)
  raise_proj_pct: numeric  // current_score / 10
  override_by, override_reason
  snapshot_end_of_year: numeric  // set 31 Dec cron
  created_at, updated_at
}

// SCORE_EVENTS (append-only — immutable)
score_events {
  id, employee_id, month_key
  event_type: text  // ABSENT|LATE|KPI_LOW|LEAVE_EXCEED|BONUS_HADIR|BONUS_KPI|OVERRIDE|DISCIPLINE
  delta: numeric  // -5 or +1, etc.
  score_after: numeric
  reason: text  // human-readable Bahasa Indonesia
  reference_id: text  // attendance_id / kpi_entry_id / etc.
  created_by: FK users.id  // SYSTEM or superadmin_id
  created_at
}

// GAMIFICATION_RULES (configurable by Superadmin)
gamification_rules {
  id, event_type: text
  delta: numeric  // negative for deductions, positive for bonuses
  description: text
  is_active, updated_by, updated_at
}

// ACHIEVEMENT_BADGES
achievement_badges {
  id, employee_id
  badge_type: STREAK_7|STREAK_14|STREAK_30|ONTIME_7|KPI_TARGET|TOP_PERFORMER|ZERO_ABSENT
  earned_at, period_key
}

// LEAVE_REQUESTS
leave_requests {
  id, employee_id
  type: CUTI_TAHUNAN|SAKIT|IZIN|CUTI_MELAHIRKAN|CUTI_KHUSUS
  start_date, end_date, total_days
  reason, attachment_path
  status: PENDING|APPROVED|REJECTED|CANCELLED
  reviewed_by, reviewed_at, review_note
  created_at, updated_at, cancelled_at
}

// LEAVE_BALANCE_LEDGER (append-only)
leave_balance_ledger {
  id, employee_id, leave_type, year
  delta: integer  // +N alloc, -N used
  balance_after: integer
  reason: text, reference_id
  created_by, created_at
}

// PAYROLL_RULES
payroll_rules {
  id, name, division_id
  type: DAILY|MONTHLY|HOURLY
  base_rate: numeric  // Rp per day/month/hour
  kpi_bonus_rate: numeric
  absent_deduction: numeric
  late_deduction: numeric
  overtime_rate: numeric  // multiplier (1.5 or 2.0)
  is_active, created_at, updated_at
}

// PAYROLL_PERIODS
payroll_periods {
  id, period_key: "YYYY-MM"
  start_date, end_date
  status: DRAFT|CALCULATING|REVIEW|APPROVED|PUBLISHED|LOCKED
  published_at, locked_at
  created_by, created_at
}

// PAYROLL_SLIPS
payroll_slips {
  id, period_id, employee_id, payroll_rule_id
  working_days, present_days, absent_days
  late_count, late_minutes_total
  leave_days, sick_days, overtime_hours
  base_salary, kpi_bonus, overtime_pay
  deductions_absent, deductions_late
  bpjs_employee_deduction  // display only
  total_salary
  breakdown: jsonb  // line items
  raise_proj_pct: numeric
  pdf_path
  created_at, updated_at
}

// ANNOUNCEMENTS
announcements {
  id, title
  content: text  // rich text HTML
  type: INFO|WARNING|URGENT
  target_audience: jsonb  // {all: bool, divisions: [], teams: [], roles: []}
  is_pinned: boolean
  published_at, expires_at
  attachment_path
  created_by, created_at, deleted_at
}

// NOTIFICATIONS
notifications {
  id, user_id
  type: text
  title, message, is_read: boolean
  reference_id, reference_type
  push_sent: boolean, push_sent_at
  created_at
}

// EMPLOYEE_DOCUMENTS
employee_documents {
  id, employee_id
  type: KTP|KK|BPJS_KES|BPJS_TK|CONTRACT|PHOTO|CERTIFICATE|OTHER
  name: text, file_path, file_size, mime_type
  expires_at: date  // for contracts
  uploaded_by, uploaded_at
  deleted_at
}

// REPORT_FILES
report_files {
  id, type: WEEKLY|MONTHLY|EMPLOYEE|DIVISION|CUSTOM
  period_key, file_name, file_path
  size_bytes, page_count
  is_stale: boolean
  generated_by, generated_at
  download_count, last_download_at
  deleted_at
}

// AUDIT_LOGS (partitioned monthly)
audit_logs {
  id, user_id, action, entity_type, entity_id
  before: jsonb, after: jsonb
  ip_address, user_agent
  created_at  // PARTITION KEY
}
```

### Production Indexes

```sql
-- Attendance (most queried)
CREATE INDEX idx_att_emp_date ON attendance_records(employee_id, DATE(clocked_at));
CREATE INDEX idx_att_emp_month ON attendance_records(employee_id, DATE_TRUNC('month', clocked_at));
CREATE INDEX idx_att_type ON attendance_records(type, clocked_at DESC);
-- KPI
CREATE INDEX idx_kpi_emp_period ON kpi_entries(employee_id, period_key);
CREATE INDEX idx_kpi_template ON kpi_entries(template_id, period_key);
-- Score
CREATE INDEX idx_score_emp_month ON gamification_scores(employee_id, month_key);
CREATE INDEX idx_score_events_emp ON score_events(employee_id, month_key);
-- Leave
CREATE INDEX idx_leave_overlap ON leave_requests(employee_id, start_date, end_date)
  WHERE status != 'REJECTED' AND cancelled_at IS NULL;
-- Employee
CREATE INDEX idx_emp_team ON employees(team_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_emp_leader ON employees(leader_id) WHERE deleted_at IS NULL;
-- Notifications
CREATE INDEX idx_notif_user ON notifications(user_id, is_read) WHERE is_read = false;
-- Documents
CREATE INDEX idx_docs_employee ON employee_documents(employee_id, type)
  WHERE deleted_at IS NULL;
```

---

## 7. All Module Specifications

### 7.1 Attendance (Full Flow + Liveness)

**User Stories:**

```
US-ATT-01: Clock In dengan Liveness Detection
  AS Employee/Leader
  I WANT TO clock in dengan GPS + selfie + liveness check
  SO THAT kehadiran saya valid dan tidak bisa di-spoof

  ACCEPTANCE CRITERIA:
  ✅ L3: Peta tampil dengan radius 150m Jl. Gurila Gg. Anggrek
  ✅ L3: Tidak bisa lanjut jika di luar 150m
  ✅ L4: Kamera depan terbuka otomatis (zero gallery upload)
  ✅ L4: Liveness detection: overlay berkedip + "Kedipkan mata" instruction
  ✅ L4: Liveness score ≥ 0.7 untuk lanjut (configurable Superadmin)
  ✅ L5: Konfirmasi tampil: waktu, tanggal, shift, lokasi, foto thumb
  ✅ L5: Toast "Skor kamu: 98 (+1 hadir tepat waktu)" muncul 3 detik
  ✅ GPS + selfie validated server-side (frontend = UX only)
  ✅ Offline: jika no internet → queue di IndexedDB → sync saat online
  ✅ Superadmin tidak bisa Clock In (blocked API + middleware)

US-ATT-02: Offline Clock In (NEW)
  AS Employee di area pabrik dengan sinyal lemah
  I WANT TO tetap bisa clock in meski tidak ada internet
  SO THAT kehadiran saya tetap tercatat

  ACCEPTANCE CRITERIA:
  ✅ GPS validation tetap berjalan (device-side)
  ✅ Selfie captured dan stored locally (IndexedDB)
  ✅ Banner "Absensi disimpan offline. Menunggu sinkronisasi."
  ✅ Service Worker background sync saat internet kembali
  ✅ Timestamp yang digunakan = waktu clock in asli (bukan sync time)
  ✅ Server: accept offline submissions jika timestamp ≤ 15 menit lalu
  ✅ > 15 menit: flagged, masuk antrian koreksi otomatis
```

### 7.2 Liveness Detection

```
IMPLEMENTATION:
  Client-side: MediaPipe FaceDetection atau TensorFlow.js BlazeFace
  Challenge:   "Kedipkan mata" (eye blink detection)
  Score:       0.0–1.0 (threshold default 0.7, configurable)
  Timeout:     15 detik → gagal → minta retake
  Fallback:    Jika device tidak support → skip liveness, flag attendance
               Superadmin bisa review flagged records

UI:
  Oval overlay PLUS animasi pulse ring ketika mendeteksi wajah
  Instruction text:
    Detecting: "Pastikan wajah terlihat jelas..."
    Face found: "Wajah terdeteksi. Kedipkan mata sekali."
    Passed: "✅ Verifikasi berhasil!"
    Failed: "❌ Gagal. Coba lagi."
```

### 7.3 Overtime / Lembur Management

```
US-LEMB-01: Pengajuan Lembur (Employee/Leader)
  ACCEPTANCE CRITERIA:
  ✅ Form: tanggal, jam mulai, jam selesai, alasan
  ✅ Auto-hitung: planned_hours × rate_multiplier dari payroll rule
  ✅ Status: PENDING → APPROVED (Leader) → APPROVED (SA)
  ✅ Setelah actual clock in/out: actual_hours terhitung otomatis
  ✅ Overtime pay masuk otomatis ke payroll slip bulan ini
  ✅ Rate: 1.5× normal hours · 2× hari libur (configurable SA)

US-LEMB-02: Approval Overtime (Leader + Superadmin)
  ACCEPTANCE CRITERIA:
  ✅ Leader approve dahulu (jika ada), lalu Superadmin final
  ✅ Notifikasi ke Employee saat status berubah
  ✅ Report: total overtime hours per karyawan per bulan
  ✅ Alert: jika overtime melebihi batas maksimal (configurable)
```

### 7.4 KPI System (Full)

```
DIMSUM KPI TEMPLATES (default seed TBM):

Template 1: Cetakan Dimsum
  Unit: pcs · Target: 1000/minggu · Bobot: 40%
  Input: Leader · Period: Weekly
  Display: progress bar + "X / 1000 pcs"

Template 2: Kebersihan Tempat Kerja
  Unit: nilai_1_5 · Target: 5 · Bobot: 15%
  Input: Leader · Period: Weekly
  Display: bintang 1–5

Template 3: Kedisiplinan
  Unit: nilai_1_5 · Target: 5 · Bobot: 15%
  Input: Leader · Period: Weekly

Template 4: Kecepatan Cetak
  Unit: nilai_1_5 · Target: 5 · Bobot: 15%
  Input: Leader · Period: Weekly

Template 5: Kerapian
  Unit: nilai_1_5 · Target: 5 · Bobot: 15%
  Input: Leader · Period: Weekly

Kehadiran: Auto-kalkulasi dari attendance records (tidak perlu input)

Semua template fully editable di Admin Panel.
Superadmin bisa tambah/hapus/ubah template kapan saja.
Perubahan template tidak retroaktif (hanya berlaku ke depan).
```

### 7.5 Gamifikasi (Full Production)

```
SKOR RULES (semua configurable Superadmin):

Reset: 100 setiap 1 Januari (cron job, 00:00 WIB)
Floor: 0 (tidak bisa negatif)
Ceil:  100 (tidak bisa melebihi 100)

PENGURANGAN DEFAULT:
  Absen tanpa keterangan:         -5 poin/kejadian
  Terlambat > 15 menit:           -2 poin/kejadian
  Terlambat 15–30 menit:          -1 poin/kejadian
  CI di luar radius (flagged):    -3 poin/kejadian
  Melebihi kuota cuti tahunan:    -3 poin
  KPI < 50% target (semua cat):   -3 poin/minggu bermasalah
  Pelanggaran disiplin (Leader):  -2 poin/kejadian (Leader input)
  Liveness gagal 3x:              -1 poin (suspicious flag)

PENAMBAHAN DEFAULT:
  Hadir sempurna 1 minggu:        +1 poin/minggu
  KPI 100% semua kategori 1 mgg: +2 poin/minggu
  Hadir sempurna 1 bulan:        +3 poin (bonus ekstra)

FORMULA KENAIKAN GAJI:
  raise_pct = annual_score / 10
  Wajib disclaimer: "Estimasi. Memerlukan persetujuan manajemen TBM."

LEADERBOARD (Superadmin + Leader):
  Top 5 karyawan per divisi per bulan
  Digunakan untuk: pengakuan, motivasi, review tahunan
  Employee TIDAK melihat leaderboard ranking (privasi)
  Employee HANYA melihat skor sendiri
```

### 7.6 Payroll (Full)

```
CALCULATION ENGINE:

Input:
  1. Payroll rule (rate per day/month)
  2. Attendance records (present_days, absent_days, late_count)
  3. KPI entries (achievement_pct average bulan ini)
  4. Overtime approved (overtime_hours, rate_multiplier)
  5. Leave records (leave_days, sick_days)

Formula:
  base          = rule.base_rate × present_days (daily) OR rule.base_rate (monthly)
  kpi_bonus     = base × (kpi_achievement_pct - 100) × bonus_factor IF > target
  overtime_pay  = (base/working_days/8) × overtime_hours × rate_multiplier
  deduct_absent = absent_days × rule.absent_deduction
  deduct_late   = late_count × rule.late_deduction
  total         = base + kpi_bonus + overtime_pay - deduct_absent - deduct_late

BPJS DISPLAY (informational only — not disbursed via app):
  BPJS Kesehatan Employee: 1% gaji (display only)
  BPJS Ketenagakerjaan (JHT): 2% (display only)
  Note: "Dikelola terpisah oleh HR TBM"

THR:
  Configurable oleh Superadmin per tahun
  Auto-kalkulasi berdasarkan masa kerja:
    < 12 bulan: prorated
    ≥ 12 bulan: 1 bulan gaji pokok
  Tampil sebagai line item terpisah di slip

PAYROLL LIFECYCLE:
  DRAFT → trigger kalkulasi → CALCULATING → review SA → APPROVED
  → publish ke employee → PUBLISHED → lock setelah 7 hari → LOCKED

SLIP PDF:
  Branded MyProdusen / TBM
  QR code untuk verifikasi keaslian
  Termasuk: breakdown, BPJS display, proyeksi kenaikan gaji
  Disclaimer raise projection (WAJIB)
```

### 7.7 Leave Management (Full)

```
LEAVE TYPES:
  CUTI_TAHUNAN: 12 hari/tahun (configurable SA) — saldo berkurang
  SAKIT:        Dengan surat dokter → tidak potong saldo
  IZIN:         Tergantung jenis (SA configure potong atau tidak)
  CUTI_MELAHIRKAN: 90 hari (sesuai UU) — tidak potong saldo
  CUTI_KHUSUS: Duka, pernikahan, dll — configurable

FLOW:
  Employee submit → Leader approval (forward) → SA final approval
  Jika SA langsung (tanpa Leader): SA approve langsung
  Notifikasi: setiap perubahan status (push + in-app)
  Saldo: append-only ledger (tidak bisa edit, hanya append)

SALARY IMPACT:
  Cuti tahunan: tidak potong gaji
  Absen tanpa izin: potong gaji sesuai payroll rule
  Izin: tergantung type config SA
  Sakit: tidak potong gaji jika ada surat dokter
```

### 7.8 Document Management

```
TYPES: KTP · KK · Foto · BPJS Kesehatan · BPJS TK · Kontrak · Sertifikat · Lain

Employee:
  Upload dokumen sendiri (max 5MB, PDF/JPG/PNG)
  View dokumen sendiri
  Update jika expired

Leader:
  View dokumen anggota tim (KTP, foto, BPJS display only)
  Upload dokumen tim yang ditugaskan

Superadmin:
  Upload semua dokumen karyawan
  View semua dokumen
  Export ZIP per karyawan
  Alert: "3 kontrak karyawan berakhir dalam 30 hari"

Storage: private Docker volume, /api/files/documents/[employeeId]/[filename]
```

### 7.9 Push Notifications (Full Web Push)

```
SUBSCRIPTION FLOW:
  1. First login → show permission request modal (tidak force)
  2. If granted: POST /api/push/subscribe dengan subscription object
  3. Stored di users.push_subscription (jsonb)

NOTIFICATION EVENTS:
  Clock In Reminder:     T-10 menit sebelum shift mulai (cron)
  Clock Out Reminder:    T-10 menit sebelum shift berakhir (cron)
  Skor Berubah:          Realtime → "Skor kamu -2 (terlambat)"
  Cuti Disetujui:        Saat SA/Leader approve
  Cuti Ditolak:          Saat SA/Leader reject
  Slip Gaji Tersedia:    Saat SA publish payroll
  KPI Diinput:           Saat Leader submit KPI karyawan
  Pengumuman Baru:       Saat SA publish announcement (URGENT type only)
  Absensi Berhasil:      Konfirmasi CI/CO

LEADER SPECIFIC:
  "X anggota tim belum CI (30 menit terlambat)"
  "N pengajuan cuti menunggu approval"

ADMIN SPECIFIC:
  "Laporan bulanan tersedia untuk download"
  "Payroll bulan ini siap di-review"

PREFERENCE:
  User bisa opt-out per kategori dari /dashboard/akun/pengaturan-notifikasi
```

### 7.10 Shift Handover Notes (TBM Unique)

```
TRIGGER: Leader shift sore mengirim catatan ke Leader shift malam

FORM:
  Dari: [Leader A — Shift Pagi]
  Ke:   [Leader B — Shift Siang] (auto-suggest berdasarkan shift berikutnya)
  Tanggal: [today]
  Catatan: [rich text, max 2000 chars]
    Contoh: "Mesin cetak B butuh cek bearing besok pagi.
             Stok tepung hampir habis (~2 hari lagi).
             Karyawan Budi absen hari ini."
  Lampiran: opsional (foto mesin, dll)

RECEIVER:
  Notifikasi push + in-app ke Leader penerima
  Tanda "belum dibaca" sampai Leader tap/open
  "N catatan serah terima belum dibaca" di Beranda Leader

SUPERADMIN:
  Lihat semua handover notes
  Useful untuk: audit trail operasional, laporan mingguan
```

### 7.11 Koreksi Absensi

```
TRIGGER CASES:
  GPS tidak akurat di dalam pabrik
  Karyawan lupa Clock In/Out
  CI di luar radius karena HP error
  Offline sync terlambat > 15 menit

FLOW:
  Employee → Ajukan Koreksi dari halaman histori absensi [id]
  Form: tanggal · jenis koreksi · waktu yang benar · alasan · foto bukti
  → Leader review (jika ada) → SA final
  Notifikasi setiap step

SUPERADMIN:
  Override any correction tanpa approval chain
  Audit trail: setiap koreksi tercatat (who, when, what, why)
  Report: "N koreksi bulan ini" — indikator masalah GPS

DATABASE:
  attendance_corrections table (lihat §6)
  attendance_records.is_corrected = true setelah approved
```

---

## 8. Five-Screen Attendance Flow — Production Spec

### L1 — Beranda

```
KOMPONEN ABOVE FOLD (scroll order):
  1. Header: avatar + greeting + bell badge
  2. Shift Card (gradient kuning) + clock buttons
  3. Score Mini Card (skor + proyeksi)
  4. KPI Highlight (cetakan minggu ini)
  5. Status Grid (3 sel)
  6. Pengumuman (maks 2)
  7. Leader extras: team alert banner + KPI input reminder

OFFLINE BANNER (jika ada queue):
  Positioned di bawah header (sticky)
  bg #FFF3E0 · "📱 1 absensi menunggu sinkronisasi" · Spinner jika sync
```

### L2 — Detail Absensi

```
Jam realtime 48px mono (update /detik)
Online/Offline badge · Tanggal ID locale
Jadwal hari ini · Info banner selfie
Tombol CI/CO (state-aware)
Log timeline hari ini (animated node jika baru masuk)
```

### L3 — GPS Lokasi

```
Step indicator: "Langkah 1 dari 2" (amber)
Shift info bar
PETA LEAFLET (45vh):
  OSM tiles · Lingkaran 150m · Pin merah kantor · Dot biru pulsing user
  Accuracy ring jika accuracy > 20m
  FAB re-center
Status: valid/invalid/acquiring/permission_denied
GPS accuracy indicator (hijau ≤ 20m · kuning 21–50m · merah > 50m)
CTA: Lanjutkan (disabled jika di luar)
```

### L4 — Selfie + Liveness

```
Step indicator: "Langkah 2 dari 2" (amber)
Shift info bar
KAMERA (aspect 3/4):
  Video mirrored · Oval overlay dengan box-shadow
  LIVENESS OVERLAY:
    Pulse ring: hijau saat wajah terdeteksi
    Instruction: "Kedipkan mata sekali" (pulse animation)
    Progress: checkmark setelah liveness pass
  Flash toggle + Capture button (56px)
  Post-capture: preview + "Ambil Ulang"
  Liveness fail: "Verifikasi gagal. Coba lagi." + retry

Catatan textarea (max 150) + counter
Kirim button (disabled sebelum capture + liveness pass)
```

### L5 — Berhasil

```
Spring animation 64px circle hijau + centang
"Clock In berhasil" · "Kehadiran Anda telah tercatat."
Detail table: waktu · tanggal · shift · lokasi · foto · liveness ✅
Log timeline: CI (status) + CO (Belum Absen)
SCORE UPDATE TOAST (3 detik setelah mount):
  "🎯 Skor kamu: 98 (+1 hadir tepat waktu!)"
  Hijau, muncul dari bawah
Buttons: [Lihat Detail] outline + [Kembali ke Beranda] text link
```

---

## 9. Super Admin Dashboard — Complete Spec

### HR Analytics Dashboard

```
HEADER METRICS (4 kartu):
  Total Karyawan Aktif · Hadir Hari Ini · Skor Rata-rata · Payroll Est.

LIVE ATTENDANCE FEED:
  Real-time SSE · "● Live" berkedip
  Cards: foto + nama + "Clock In 07:58" · status badge
  Update tanpa refresh

ALERT PANEL:
  Karyawan belum CI (per jam) · At-risk karyawan skor < 60
  Pending approvals: cuti + lembur + koreksi
  Kontrak akan berakhir (30 hari)

CHARTS ROW:
  Line: tren kehadiran 30 hari · Bar: KPI per divisi
  Donut: distribusi skor · Pie: status kehadiran hari ini

KPI INPUT STATUS:
  Leader mana yang belum input KPI minggu ini
  "Produksi — Leader Andi belum input (3 karyawan)"
```

### Settings — System Config

```
TABS:
  Geofence: lat/lng office · radius (default 150m) · nama lokasi
  Shift: tambah/edit/hapus shift · tolerance minutes
  KPI Templates: full template builder
  Gamifikasi Rules: event type → delta configuration
  Hari Libur: import nasional + custom perusahaan
  Payroll Rules: per divisi/karyawan
  Notifikasi: schedule CI/CO reminder (jam berapa)
  Liveness: threshold score (default 0.7)
  PDF Reports: logo + warna brand + footer text
  Backup: manual trigger + schedule
```

---

## 10. API Contract — Key Endpoints

### POST /api/attendance/clock (Server Action)

```
Auth: EMPLOYEE | LEADER (SUPERADMIN 403)
Rate-limit: 10 req/min per user

Body: {
  type: "clock-in"|"clock-out"
  latitude, longitude, accuracy  // required
  workLocationId, shiftId         // required
  photo: base64 JPEG max 2MB      // required
  livenessScore: number 0-1       // required (0 if unsupported)
  livenessPassed: boolean         // required
  note: string max 150            // optional
  isOffline: boolean              // true = offline submission
  offlineTimestamp: string        // ISO 8601 (required if isOffline)
  deviceInfo: { userAgent, platform, batteryLevel }
}

Response 200:
{
  success: true, data: {
    attendanceId, type, clockedAt, status
    shiftName, locationName, selfieThumbUrl
    livenessPassed, scoreEvent?: { delta, scoreAfter, reason }
  }
}

Errors: OUTSIDE_GEOFENCE | ACCURACY_TOO_LOW | LIVENESS_FAILED
        NO_ACTIVE_SHIFT | ALREADY_CLOCKED_IN | ALREADY_CLOCKED_OUT
        OFFLINE_TIMESTAMP_EXPIRED | SUPERADMIN_ATTENDANCE_BLOCKED
```

### POST /api/kpi/entry (Leader only)

```
Body: { employeeId, templateId, periodKey, actualValue, note }
Scope: employee must be in leader's assigned team
Response: { success, data: { entryId, achievementPct, scoreImpact } }
Side effect: async score update (processScoreEvent)
```

### POST /api/reports/generate

```
Body: { type, period, options?: { force, includePayroll, includeSalary } }
Response: PDF binary stream
Headers: Content-Type: application/pdf · Content-Disposition: attachment
Progress: poll GET /api/reports/status/[periodKey]
```

---

## 11. Performance & Monitoring

```
TARGETS:
  LCP Mobile:          < 2.5s (Server Components + PPR)
  FCP:                 < 1.5s
  TTI:                 < 3.5s
  CLS:                 < 0.1
  Lighthouse Mobile:   ≥ 85
  Attendance API p95:  < 3s
  PDF generate:        < 20s (monthly) · < 10s (weekly)
  Score update:        < 5s async (non-blocking CI)
  Push notification:   < 2s delivery

OPTIMIZATIONS:
  Next.js PPR:         Partial Pre-rendering (Beranda = fast shell)
  React 19 Compiler:   Auto-memo (zero manual useMemo)
  Server Components:   ~40% less JS to browser
  Leaflet:             dynamic import (ssr: false, lazy)
  PDF charts:          PNG cached 1 hour (hash-based)
  Attendance history:  Infinite scroll 20/page
  Selfie:              Sharp compress 4MB → 500KB (87% reduction)
  Skeleton screens:    All data-fetching routes
  Bundle:              ≤ 200KB gzipped initial

MONITORING:
  Sentry:              Errors + performance traces
  PostHog:             Usage analytics (self-hosted)
  /api/health:         200 OK → Coolify uptime check
  DB alerts:           Long-running query > 5s → alert
  Disk alerts:         /uploads > 80% → alert
```

---

## 12. Security (Production Grade)

```
AUTH:
  Session: HTTP-only · Secure · SameSite=Strict · 24h expiry
  Rate limit: 5 failed logins → 5 min lockout (per IP + per user)
  CSRF: Server Action origin check + CORS strict

RBAC:
  All routes: middleware session + role check
  All API: server-side scope enforcement
  Employee: own data only (BOLA/IDOR blocked)
  Leader: team scope only
  Superadmin: no Clock In/Out

FILE SECURITY:
  All private files: /api/files/[...path] authenticated proxy
  No public CDN for private files (selfie, payslip, docs)
  PDF reports: no-store, private cache
  RBAC on files: employee sees own · leader sees team docs · SA sees all

HTTP HEADERS (production):
  Content-Security-Policy (Next.js optimized)
  Strict-Transport-Security: max-age=63072000
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(self), camera=(self)
  X-Content-Type-Options: nosniff

PRODUCTION SAFETY:
  Zero secrets in repository (env validated at startup)
  Zero destructive DB (soft delete only)
  Zero raw SQL (all Drizzle parameterized)
  Zero hardcode credentials
  Score events: immutable (append-only, no UPDATE/DELETE)
  Audit logs: partitioned, retained 24 months, no UI delete
  Staging environment: separate Docker compose + separate DB
```

---

## 13. Offline Mode (Production)

```
SERVICE WORKER (Workbox strategy):
  Cache: app shell + static assets (cache-first)
  API:   network-first with offline fallback
  Maps:  OSM tiles cached (last 7 days of viewed tiles)

OFFLINE ATTENDANCE:
  Step 1: GPS acquired device-side (works offline)
  Step 2: Selfie captured device-side (works offline)
  Step 3: Submit fails (no network) → stored in IndexedDB
    Stored: { type, lat, lng, accuracy, photo_blob, timestamp, shiftId, locationId }
  Step 4: Banner: "📱 Absensi disimpan offline. Akan dikirim otomatis."
  Step 5: Service Worker background sync → POST /api/sync/offline
  Step 6: Server validates: timestamp ≤ 15 min → process normally
           timestamp > 15 min → flag untuk koreksi + notify SA

OFFLINE INDICATOR:
  Beranda header: orange "● Offline" badge (replaces "Online" clock badge)
  Count badge: "N absensi menunggu" → spinner saat sync

OFFLINE LIMITATIONS:
  Tidak bisa lihat KPI realtime (show cached data)
  Tidak bisa submit cuti/lembur (require network, show message)
  Tidak bisa lihat PDF reports (require network)
```

---

## 14. PWA Configuration (Production)

```
manifest.json:
  name: "MyProdusen HRIS"
  short_name: "MyProdusen"
  theme_color: "#F5A623"
  background_color: "#FAFAF7"
  display: "standalone"
  orientation: "portrait"
  start_url: "/dashboard"
  icons: [72, 96, 128, 144, 152, 192, 384, 512]px
  screenshots: 2 mobile screenshots

INSTALL PROMPT:
  Shown after: 2nd login + user has clocked in once
  Banner: "Tambahkan MyProdusen ke layar utama untuk akses cepat!"
  iOS: instruksi manual Safari share → Add to Home Screen
  Android: native install banner via beforeinstallprompt

BENEFITS:
  - 1 tap dari homescreen (vs buka browser + URL + login)
  - Standalone mode (no browser chrome)
  - Push notifications work (requires PWA install on some Android)
  - Offline support via Service Worker
```

---

## 15. Testing (Production Complete)

### Unit Tests (Vitest)

```
score-engine.test.ts:      processScoreEvent · calculateAnnualScore · validateDelta
kpi-engine.test.ts:        calculateAchievement · aggregateKPI · applyWeights
geofence.test.ts:          calculateDistance · isInsideRadius · edge cases
payroll-engine.test.ts:    calculatePayslip · applyRules · overtimeCalc
offline-queue.test.ts:     validateTimestamp · mergeQueue · conflict resolution
liveness.test.ts:          threshold check · fallback logic
```

### E2E (Playwright)

```
attendance-flow.spec.ts:
  ✓ Happy path CI + CO (inside radius, liveness pass)
  ✓ Outside radius → blocked
  ✓ GPS denied → error UI + instruksi
  ✓ Camera denied → error per browser
  ✓ Liveness fail → retry
  ✓ Offline CI → queue → sync
  ✓ Superadmin clock attempt → blocked

kpi-flow.spec.ts:
  ✓ Leader input KPI → score updates
  ✓ Employee view KPI (read-only, no edit button)
  ✓ Leader cannot input for outside-team employee

score-system.spec.ts:
  ✓ Score decreases on absent
  ✓ Score decreases on late
  ✓ Score increases on perfect week
  ✓ Score cannot go below 0 or above 100
  ✓ Annual reset on Jan 1

report-generation.spec.ts:
  ✓ Weekly PDF generates successfully
  ✓ Monthly PDF all pages complete
  ✓ Download requires SUPERADMIN auth
  ✓ Employee cannot access /admin/reports
```

### Real Device UAT (Required Before Go-Live)

| Test | Android Chrome | iOS Safari |
|------|:--------------:|:----------:|
| CI dalam radius + liveness | ✅ | ✅ |
| CO dalam radius | ✅ | ✅ |
| Di luar 150m → blocked | ✅ | ✅ |
| Offline CI → sync | ✅ | ✅ |
| Push notification CI reminder | ✅ | ✅ |
| PWA install + standalone | ✅ | ✅ |
| GPS denied → instruksi | ✅ | ✅ |
| Kamera denied → instruksi per browser | ✅ | ✅ |
| Liveness fail → retry | ✅ | ✅ |
| Leader KPI bulk input | ✅ | ✅ |
| PDF weekly download | ✅ | ✅ |
| PDF monthly download | ✅ | ✅ |
| Superadmin payroll publish → slip muncul | ✅ | ✅ |
| Score update setelah CI | ✅ | ✅ |

---

## 16. Deployment (Production)

### Docker Compose (Production)

```yaml
version: "3.8"
services:
  app:
    build: { context: ., dockerfile: docker/Dockerfile }
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgresql://...
      AUTH_SECRET: ${AUTH_SECRET}
      RESEND_API_KEY: ${RESEND_API_KEY}
      UPLOAD_DIR: /uploads
      VAPID_PUBLIC_KEY: ${VAPID_PUBLIC_KEY}
      VAPID_PRIVATE_KEY: ${VAPID_PRIVATE_KEY}
      TBM_OFFICE_LAT: 3.5892
      TBM_OFFICE_LNG: 98.6722
      GEOFENCE_RADIUS: 150
      SENTRY_DSN: ${SENTRY_DSN}
    volumes: [uploads:/uploads]
    depends_on: [postgres]
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/health"]
      interval: 30s

  postgres:
    image: postgres:16-alpine
    volumes: [pgdata:/var/lib/postgresql/data]
    environment:
      POSTGRES_DB: myprodusen_prod
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASS}

volumes: { uploads:, pgdata: }
```

### GitHub Actions CI/CD

```yaml
on: push to main
jobs:
  test: lint → type-check → unit test → build
  deploy (if test passes): trigger Coolify webhook
  notify: Slack/email on success or failure
```

---

## 17. Non-Negotiables (Production)

```
#1  SKOR MULAI 100, ONLY DOWN
    score_events immutable (append-only). No UPDATE/DELETE.
    Every change: audit trail mandatory.

#2  FORMULA DISCLAIMER WAJIB
    raise_pct = score/10. Disclaimer tampil SELALU.
    Cannot be removed from UI without code change.

#3  ANNUAL RESET 1 JANUARI
    Cron job: snapshot 31 Des · reset 1 Jan.
    Historical data: retained permanently.

#4  GEOFENCE = SERVER AUTHORITY
    150m dari Jl. Gurila Gg. Anggrek.
    Coordinate configurable dari Admin Panel (not hardcode frontend).
    Frontend check = UX only. Server = final authority.

#5  OFFLINE FIRST FOR ATTENDANCE
    Attendance can ALWAYS be captured (GPS + selfie device-side).
    Sync when internet available. Never block user from clocking in.

#6  LIVENESS DETECTION
    Threshold ≥ 0.7 (configurable). Records without liveness = flagged.
    Superadmin can review flagged records.

#7  NO GALLERY UPLOAD
    Selfie = camera only. Zero file picker.

#8  NO SUPERADMIN ATTENDANCE
    Hard blocked: middleware + API. Zero exception.

#9  LEADER SALARY BLINDNESS
    No gaji/slip in any leader-scope API response.
    Enforced at every endpoint individually.

#10 PRIVATE FILES ALWAYS
    All selfie/payslip/docs: authenticated proxy only.
    Zero public URL ever (including CDN).

#11 STAGING BEFORE PRODUCTION
    All changes: staging → test → production.
    Separate Docker Compose for staging with seeded test data.
```

---

## 18. Source of Truth Docs

| File | Tujuan |
|------|--------|
| `docs/prd.md` | **Dokumen ini — Canonical PRD Production v5.0** |
| `docs/DESIGN.md` | Design spec lengkap |
| `docs/PDF_REPORTS_SPEC.md` | PDF laporan profesional spec |
| `docs/GAMIFICATION.md` | Gamification rules detail |
| `docs/KPI_CONFIG.md` | KPI template configuration guide |
| `docs/SECURITY.md` | Security model detail |
| `docs/DATABASE.md` | DB schema + migration notes |
| `docs/OFFLINE.md` | Offline mode + Service Worker spec |
| `docs/LIVENESS.md` | Liveness detection implementation |
| `docs/PUSH.md` | Web Push notification setup |
| `docs/TESTING_QA.md` | QA strategy |
| `docs/FINAL_CHECKLIST.md` | Go-live checklist |
| `docs/COMPETITOR_ANALYSIS.md` | Competitor research (this doc §1) |
| `AGENTS.md` | AI agent operating rules |
| `README.md` | Setup + project overview |

---
*PRD PRODUCTION FINAL v5.0.0*
*MyProdusen HRIS — PT Tcipta Buana Mandiri*
*Terinspirasi dari: Mekari Talenta · GreatDay HR · LinovHR · Gadjian*
*Lebih baik dari semua kompetitor untuk industri produksi dimsum*
*2026-06-04*
