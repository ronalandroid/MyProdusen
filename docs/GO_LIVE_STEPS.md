# Step-by-Step Go-Live: MyProdusen → Skor 10/10

> Panduan lengkap dari kondisi saat ini (skor 8/10) menuju production-ready 10/10.
> Setiap step harus dicentang sebelum lanjut ke step berikutnya.

---

## FASE 1: Local Verification (Sudah DONE ✅)

Ini sudah selesai dari sesi sebelumnya:

- [x] `npm run lint` — pass
- [x] `npm run test` — 64 files, 331 tests pass
- [x] `npm run build` — success
- [x] `npm run release:check` — full pipeline pass
- [x] `npm run release:migrations` — 20 migrations verified
- [x] `npm run release:references` — 4 screens verified
- [x] Test-support routes di-guard untuk production
- [x] GPS accuracy menggunakan env `GPS_MAX_ACCURACY_METERS`
- [x] Security docs updated

### Automated readiness evidence — 2026-05-21

- [x] `npm run release:check` — pass locally.
- [x] `E2E_BASE_URL=http://127.0.0.1:3015 npm run e2e:public` — 20/20 pass across 360, 390, 768, 1440 viewports.
- [x] `E2E_BASE_URL=http://127.0.0.1:3015 npm run e2e:full-staging` with local E2E credentials — 14 pass, 10 expected skips for non-desktop credential duplication and gated mutation tests.
- [x] `BASE_URL=http://127.0.0.1:3015 npm run verify:live-routes` — health, version, and protected PDF route pass.
- [x] `npm run release:env` with local production-like `.env` — pass; note says remove/rotate bootstrap `SUPERADMIN_*` after first login.

Remaining 10/10 blockers are external/manual: real Coolify deploy, live-domain smoke, backup/restore drill, and stakeholder signoff.

---

## FASE 2: UI/UX Quality Gate (Manual Testing)

**Alat:** Browser DevTools (Chrome/Firefox), responsive mode.

### Step 1: Mobile 360px Test

```
1. Buka Chrome DevTools → Toggle Device Toolbar
2. Set viewport: 360 x 640 (Samsung Galaxy S series)
3. Navigasi ke setiap halaman berikut dan cek:
```

| Halaman | Cek |
|---------|-----|
| `/login` | Form tidak overflow, button full-width, label jelas |
| `/register` | Form fields tidak terpotong, password field visible |
| `/dashboard` | Cards stack vertical, tidak horizontal overflow |
| `/dashboard/attendance` | Button check-in/out tap target ≥44px |
| `/dashboard/leave` | Form modal responsive, button tidak overlap |
| `/dashboard/kpi` | Table scroll horizontal jika perlu, header fixed |
| `/dashboard/employees` | List/table readable, action buttons accessible |
| `/dashboard/payroll` | Data tidak terpotong, angka readable |
| `/dashboard/reports` | Filter form usable, export button visible |
| `/dashboard/notifications` | List items tappable, mark-read accessible |

**Kriteria PASS:**
- [ ] Tidak ada horizontal overflow di semua halaman
- [ ] Tidak ada button text terpotong
- [ ] Tidak ada icon/text overlap
- [ ] Semua tap target ≥ 44px
- [ ] Modal action buttons tidak overlap

### Step 2: Mobile 390px Test

```
Ulangi Step 1 dengan viewport 390 x 844 (iPhone 14/15)
```

- [ ] Semua kriteria Step 1 pass di 390px

### Step 3: Tablet 768px Test

```
Set viewport: 768 x 1024 (iPad)
```

- [ ] Layout transisi dari mobile ke tablet smooth
- [ ] Sidebar/navigation accessible
- [ ] Tables readable tanpa excessive scrolling
- [ ] Dashboard cards grid layout proper

### Step 4: Desktop 1440px Test

```
Set viewport: 1440 x 900
```

- [ ] Sidebar navigation full visible
- [ ] Dashboard panels/cards grid layout optimal
- [ ] Tables full-width dengan semua kolom visible
- [ ] Forms centered dengan max-width yang proper
- [ ] Report/export area spacious dan clear

### Step 5: Functional UI Checks

```
Test di viewport manapun yang paling nyaman:
```

- [ ] Form validation error TIDAK menghapus data yang sudah diisi
- [ ] Loading state muncul saat fetch data
- [ ] Error state muncul saat API gagal (matikan network di DevTools)
- [ ] Empty state muncul saat data kosong
- [ ] Success feedback muncul setelah action berhasil
- [ ] Front-camera selfie preview mirrored (test di HP asli)
- [ ] GPS disabled menampilkan pesan jelas dalam Bahasa Indonesia
- [ ] Tidak ada raw JavaScript error di console (filter Error level)
- [ ] Tidak ada dead button (semua button punya action)
- [ ] Tidak ada scroll freeze

---

## FASE 3: RBAC & Security Smoke Test (Manual)

### Step 6: Employee Isolation Test

```bash
# Login sebagai Employee
# Coba akses URL berikut secara manual:
```

| URL | Expected |
|-----|----------|
| `/dashboard/users` | Redirect/403/hidden |
| `/dashboard/audit` | Redirect/403/hidden |
| `/dashboard/employees` (list semua) | Redirect/403/hidden |
| `/dashboard/reports` | Redirect/403/hidden |
| `/dashboard/payroll` (manage) | Redirect/403/hidden |
| `/api/users` | 403 JSON error |
| `/api/audit` | 403 JSON error |
| `/api/employees` | 403 JSON error |
| `/api/payroll/runs` | 403 JSON error |
| `/api/reports/attendance` | 403 JSON error |

- [ ] Employee TIDAK bisa akses data user lain
- [ ] Employee HANYA bisa lihat payroll sendiri (`/dashboard/payroll/me`)
- [ ] Employee HANYA bisa lihat KPI sendiri
- [ ] Employee HANYA bisa lihat attendance sendiri

### Step 7: Superadmin Full Access Test

```bash
# Login sebagai Superadmin
# Verify akses ke semua modul:
```

- [ ] `/dashboard/users` — list, create, activate/deactivate, role change
- [ ] `/dashboard/employees` — list, create, edit, NIP auto-generated
- [ ] `/dashboard/attendance` — list semua, exceptions review
- [ ] `/dashboard/leave` — approve/reject dengan reason
- [ ] `/dashboard/kpi` — template, assign, score, approve
- [ ] `/dashboard/payroll` — runs, structures, payslips
- [ ] `/dashboard/reports` — all reports, export CSV
- [ ] `/dashboard/audit` — full audit log visible
- [ ] `/dashboard/locations` — CRUD work locations
- [ ] `/dashboard/shifts` — CRUD shifts

### Step 8: Auth Edge Cases

- [ ] User inactive tidak bisa login (pesan jelas)
- [ ] Password salah 5x → rate limited (pesan jelas)
- [ ] Logout menghapus session (redirect ke `/login`)
- [ ] Token expired → redirect ke login (tidak error page)
- [ ] `/api/test-support/activation-token` → 404 di production
- [ ] `/api/test-support/cleanup-user` → 404 di production

---

## FASE 4: Coolify/VPS Deployment

### Step 9: Environment Configuration

```bash
# Di Coolify dashboard, set semua env vars:
```

**Wajib:**
```env
DATABASE_URL: <postgres-url>
JWT_SECRET: <random-64-char>
NEXTAUTH_SECRET: <random-64-char>
APP_URL=https://myprodusen.online
NEXT_PUBLIC_APP_URL=https://myprodusen.online
NODE_ENV=production
UPLOAD_DIR=/app/uploads
ATTENDANCE_SELFIE_DIR=attendance-selfies
MAX_UPLOAD_SIZE=5242880
MAX_SELFIE_SIZE_MB=1
GPS_MAX_ACCURACY_METERS=100
DEFAULT_GEOFENCE_RADIUS_METERS=100
REJECT_OUTSIDE_GEOFENCE=true
GPS_TIMESTAMP_MAX_AGE_SECONDS=120
ATTENDANCE_EXPORT_MAX_ROWS=5000
SESSION_TIMEOUT_HOURS=8
RESEND_API_KEY: <real-key>
RESEND_FROM_EMAIL="MyProdusen <noreply@myprodusen.online>"
PAYROLL_MODULE_ENABLED=true
PAYROLL_MUTATION_ENABLED=true
PDF_REPORT_MAX_ROWS=1000
PDF_REPORT_MAX_DATE_RANGE_MONTHS=12
```

**Bootstrap (hapus setelah pertama kali):**
```env
SUPERADMIN_EMAIL=<email>
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=<strong-password-16-char-min>
```

**WAJIB FALSE/UNSET di production:**
```env
TESTSPRITE_DISABLE_RATE_LIMITS=false
E2E_DISABLE_RATE_LIMITS=false
TESTSPRITE_DISABLE_CSRF_ORIGIN=false
E2E_DISABLE_CSRF_ORIGIN=false
TESTSPRITE_DISABLE_SECURE_COOKIES=false
TESTSPRITE_COMPAT_RESPONSE=false
```

- [ ] Semua env vars configured di Coolify

### Step 10: Volume & Network

```bash
# Di Coolify:
```

- [ ] PostgreSQL service running dan healthy
- [ ] Persistent volume `/app/uploads` mounted
- [ ] Redis service running (optional tapi recommended)
- [ ] Network antara app ↔ postgres ↔ redis terhubung

### Step 11: Deploy & Validate

```bash
# Setelah push ke branch dan Coolify build selesai:

# 1. Masuk ke Coolify shell/terminal:
npm run release:env

# 2. Jika pass, migrations sudah jalan otomatis via docker-entrypoint.sh
# 3. Cek health:
curl -s https://myprodusen.online/api/health | jq .

# 4. Cek version:
curl -s https://myprodusen.online/api/version | jq .
```

- [ ] `npm run release:env` passes di production shell
- [ ] `/api/health` returns `{"status":"ok"}` tanpa secrets
- [ ] `/api/version` shows correct commit SHA dan build time
- [ ] Superadmin bootstrap berhasil (login pertama kali)

### Step 12: Post-Deploy Security

```bash
# Setelah Superadmin pertama berhasil login:
```

- [ ] Hapus/rotate `SUPERADMIN_PASSWORD` dari Coolify env
- [ ] Verify upload volume writable: upload selfie test
- [ ] Verify selfie TIDAK accessible via direct URL (harus lewat API)
- [ ] Verify `/app/uploads` tidak di-serve sebagai static

---

## FASE 5: Production Smoke Test

### Step 13: Live Route Verification

```bash
# Dari local machine:
BASE_URL=https://myprodusen.online npm run verify:live-routes
```

- [ ] Semua public routes accessible
- [ ] Protected routes return proper auth redirect/error

### Step 14: E2E Public Smoke

```bash
# Dari local machine (tidak butuh credentials):
E2E_PORT=443 E2E_BASE_URL=https://myprodusen.online npm run e2e:public
```

- [ ] Public pages render correctly
- [ ] Login page accessible
- [ ] Health/version endpoints respond

### Step 15: E2E Authenticated Smoke

```bash
# Set credentials di local .env atau inline:
E2E_SUPERADMIN_EMAIL=<email>
E2E_SUPERADMIN_PASSWORD=<password>
E2E_EMPLOYEE_EMAIL=<email>
E2E_EMPLOYEE_PASSWORD=<password>
E2E_BASE_URL=https://myprodusen.online

npm run e2e:staging
```

- [ ] Superadmin login → dashboard → basic navigation
- [ ] Employee login → dashboard → attendance page

### Step 16: Critical Flow Smoke (Manual di Production)

| Flow | Test |
|------|------|
| Register | Daftar akun baru → cek email aktivasi masuk |
| Activate | Klik link aktivasi → akun aktif → bisa login |
| Attendance | Employee check-in dengan GPS + selfie → success |
| Leave | Employee ajukan cuti → Superadmin approve |
| KPI | Superadmin assign KPI → Employee lihat KPI sendiri |
| Report | Superadmin export attendance CSV → file download |
| Audit | Superadmin cek audit log → semua action tercatat |
| Payroll | Employee lihat payslip sendiri → data benar |

- [ ] Register + activation flow works
- [ ] Attendance GPS + selfie flow works
- [ ] Leave approval flow works
- [ ] KPI assignment + view flow works
- [ ] Report export works
- [ ] Audit log records actions
- [ ] Payroll employee view works

---

## FASE 6: Backup & Disaster Recovery

### Step 17: Backup Configuration

```bash
# Setup automated backup (cron atau Coolify scheduled task):

# Database backup (daily):
pg_dump "$DATABASE_URL" --format=custom --file=/backups/myprodusen-$(date +%F).dump

# Upload backup (daily):
tar -czf /backups/myprodusen-uploads-$(date +%F).tar.gz /app/uploads
```

- [ ] Database backup automated (daily)
- [ ] Upload volume backup automated (daily)
- [ ] Backups stored OUTSIDE app container
- [ ] Backup retention policy set (min 7 hari)

### Step 18: Restore Drill

```bash
# Di staging environment:

# 1. Restore database:
pg_restore --clean --if-exists -d myprodusen_staging /backups/myprodusen-latest.dump

# 2. Restore uploads:
tar -xzf /backups/myprodusen-uploads-latest.tar.gz -C /staging/uploads

# 3. Run migrations (untuk additive yang lebih baru):
npm run db:deploy

# 4. Smoke test staging
```

- [ ] Restore drill executed di staging
- [ ] Data integrity verified setelah restore
- [ ] App functional setelah restore
- [ ] Hasil restore drill documented

### Step 19: Rollback Plan

Documented rollback procedure:

```
1. Identify issue → check /api/health dan logs
2. If app-only: rollback ke previous Docker image di Coolify
3. If data corruption: restore dari backup terakhir (butuh approval)
4. Verify setelah rollback: /api/health, login, attendance, payroll
5. Record: timestamp, operator, reason, commit, backup ID
```

- [ ] Rollback plan documented dan accessible
- [ ] Tim tahu siapa yang bisa trigger rollback
- [ ] Rollback tested minimal 1x di staging

---

## FASE 7: Final Signoff

### Step 20: Documentation Final Check

- [ ] `README.md` — doc map current, setup instructions clear
- [ ] `AGENTS.md` — concise, enforceable, matches current state
- [ ] `docs/prd.md` — matches implemented features
- [ ] `docs/DATABASE.md` — matches current schema
- [ ] `docs/SECURITY.md` — matches current hardening
- [ ] `docs/GO_LIVE_STEPS.md` — matches Coolify setup, backup, restore, and rollback
- [ ] `docs/TESTING_QA.md` — test results documented
- [ ] `docs/UI_UX_GUIDE.md` — matches current UI

### Step 21: Stakeholder Signoff

| PIC | Responsibility | Signed |
|-----|---------------|--------|
| Owner/Direktur | Business approval, go-live decision | [ ] |
| HR PIC | Feature completeness, workflow correctness | [ ] |
| Technical PIC | Security, performance, deployment readiness | [ ] |

### Step 22: Final Status Update

Setelah semua step di atas selesai, update `docs/FINAL_CHECKLIST.md`:

```bash
# Ganti semua [ ] menjadi [x] yang sudah verified
# Tambahkan tanggal signoff
# Set status: Release is READY
```

- [ ] Final checklist semua tercentang
- [ ] Production smoke passed
- [ ] Release status: **READY** ✅

---

## Quick Reference: Commands

```bash
# Local verification (sudah done)
npm run release:check

# Production env validation (di Coolify shell)
npm run release:env

# Live route check
BASE_URL=https://myprodusen.online npm run verify:live-routes

# E2E public
E2E_BASE_URL=https://myprodusen.online npm run e2e:public

# E2E authenticated
E2E_BASE_URL=https://myprodusen.online npm run e2e:staging

# Full release check with env (production-like)
npm run release:check:full
```

---

## Timeline Estimasi

| Fase | Durasi | Siapa |
|------|--------|-------|
| Fase 2: UI/UX Testing | 2-3 jam | Developer |
| Fase 3: RBAC Smoke | 1-2 jam | Developer |
| Fase 4: Coolify Deploy | 1-2 jam | DevOps/Developer |
| Fase 5: Production Smoke | 2-3 jam | Developer + HR |
| Fase 6: Backup Setup | 1-2 jam | DevOps |
| Fase 7: Signoff | 1 hari | All stakeholders |

**Total estimasi: 2-3 hari kerja** dari sekarang sampai 10/10 production-ready.

---

> Dokumen ini adalah panduan operasional. Setelah semua step selesai, hapus file ini
> atau pindahkan ke `/docs/changelog/` sebagai catatan go-live.

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

