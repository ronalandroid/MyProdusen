# Test Playwright MyProdusen

Tanggal: 2026-05-18
Domain live: `https://myprodusen.online`
Stack: Next.js App Router, TypeScript, Drizzle ORM, PostgreSQL, Tailwind CSS, Docker, Coolify.

## Ringkasan

Playwright sudah dipasang untuk smoke test lokal dan live staging. Test lokal berjalan tanpa error. Test live menemukan satu masalah deployment: route `POST /api/reports/pdf` di live masih `404`, padahal source lokal sudah memiliki route `app/api/reports/pdf/route.ts` dan lokal mengembalikan proteksi auth `401/403`.

## File Test Dibuat

- `playwright.config.ts`
- `tests/e2e/public-smoke.spec.ts`
- `tests/e2e/staging-smoke.spec.ts`

## Script NPM

- `npm run e2e`
- `npm run e2e:public`
- `npm run e2e:staging`

## Perbaikan Test

- Playwright auto-start app lokal via `npm run start:prod` pada port `3010` jika `E2E_BASE_URL` kosong.
- Live/staging bisa dites dengan `E2E_BASE_URL` tanpa start server lokal.
- Browser project memakai Chromium viewport:
  - `mobile-360`: 360x800
  - `mobile-390`: 390x844
  - `tablet-768`: 768x1024
  - `desktop-1440`: 1440x900
- Login Superadmin dibatasi hanya `desktop-1440` agar tidak memicu rate limit live.
- Selector password dibuat spesifik ke `input[type="password"]` agar tidak bentrok dengan tombol tampilkan password.
- Selector heading user dibuat spesifik ke `Manajemen User & Aktivasi` agar tidak ambigu.
- Wait live dibuat lebih tahan lambat dengan `domcontentloaded`, timeout page `45s`, body `15s`, title `20s`.

## Hasil Local Playwright

Command:

```bash
npm run e2e:public && npm run e2e:staging && npm run lint
```

Hasil:

- `npm run e2e:public`: PASS, 12 passed.
- `npm run e2e:staging`: PASS, 12 passed, 4 skipped.
- `npm run lint`: PASS.

Catatan skip:

- 4 test login Superadmin skipped saat lokal karena `E2E_SUPERADMIN_EMAIL` dan `E2E_SUPERADMIN_PASSWORD` tidak diset.

## Hasil Live Playwright

Command publik live:

```bash
E2E_BASE_URL=https://myprodusen.online npm run e2e:public
```

Hasil awal:

- Public pages desktop/tablet: PASS.
- Healthcheck: PASS.
- Mobile public pages sempat flaky karena live lambat; sudah diperbaiki dengan timeout lebih besar.
- PDF public protection: FAIL karena live mengembalikan `404`, bukan `401/403`.

Command cek langsung:

```bash
curl -X POST https://myprodusen.online/api/reports/pdf \
  -H 'Content-Type: application/json' \
  --data '{"reportType":"attendance_summary"}'
```

Hasil:

- Status live saat dicek: `404`.
- Expected setelah latest build terdeploy: `401` atau `403` untuk non-auth/non-superadmin.

Command health live:

```bash
curl https://myprodusen.online/api/health
```

Hasil:

- Status: `200`.
- Response tidak membocorkan secret.

## Hasil Live Superadmin

Command live dengan credential:

```bash
E2E_BASE_URL=https://myprodusen.online \
E2E_SUPERADMIN_EMAIL=<superadmin-email> \
E2E_SUPERADMIN_PASSWORD=<superadmin-password> \
npm run e2e:staging
```

Hasil:

- Desktop login sempat PASS sampai halaman `/dashboard/users`.
- Test paralel awal memicu rate limit login di live.
- Mobile/tablet login tidak lagi dijalankan agar rate limit tidak berulang.
- Jika muncul pesan `Terlalu banyak percobaan login. Coba lagi dalam 15 menit`, tunggu rate limit selesai lalu run ulang hanya desktop login.

## Bug Ditemukan

### 1. Live PDF route belum tersedia

Status: belum fix di live.

Bukti:

- Source lokal ada: `app/api/reports/pdf/route.ts`.
- Local Playwright PDF protection PASS: endpoint mengembalikan `401/403`.
- Live mengembalikan `404`.

Analisis:

- Kemungkinan deployment live belum memakai latest commit/build yang punya `app/api/reports/pdf/route.ts`.
- Kemungkinan Coolify build cache masih pakai image lama.
- Kemungkinan branch/commit yang dideploy belum sama dengan working tree terbaru.

Fix yang harus dilakukan:

1. Commit semua perubahan terbaru.
2. Push ke branch yang dipakai Coolify.
3. Trigger redeploy di Coolify dengan rebuild image.
4. Jalankan `npm run release:migrations` atau `npm run db:deploy` sesuai SOP deploy.
5. Cek ulang endpoint `POST /api/reports/pdf`.

Expected setelah fix:

- Non-auth: `401`.
- Non-superadmin: `403`.
- Superadmin valid: `200` PDF dengan `Cache-Control: no-store`.

### 2. Login test paralel memicu rate limit

Status: fixed di test.

Fix:

- Credential login hanya berjalan di project `desktop-1440`.
- Device lain skip login credential.

### 3. Selector Playwright ambigu

Status: fixed.

Fix:

- Password selector memakai `input[type="password"]`.
- Users heading selector memakai teks lengkap `Manajemen User & Aktivasi`.

## Status UI/UX Responsif

Local:

- 360px: PASS.
- 390px: PASS.
- 768px: PASS.
- 1440px: PASS.
- Tidak ada horizontal overflow pada public pages.

Live:

- Public pages PASS setelah timeout distabilkan.
- Perlu ulang setelah redeploy latest build.

## Status Security Smoke

Local:

- `/api/health`: PASS.
- `POST /api/reports/pdf` tanpa auth: PASS, protected `401/403`.

Live:

- `/api/health`: PASS.
- `POST /api/reports/pdf`: FAIL, `404`, harus redeploy latest build.

## Cara Test Ulang Setelah Redeploy

Public live:

```bash
E2E_BASE_URL=https://myprodusen.online npm run e2e:public
```

Staging/live dengan Superadmin:

```bash
E2E_BASE_URL=https://myprodusen.online \
E2E_SUPERADMIN_EMAIL=<superadmin-email> \
E2E_SUPERADMIN_PASSWORD=<superadmin-password> \
npm run e2e:staging
```

Full lokal:

```bash
npm run e2e:public && npm run e2e:staging && npm run lint
```

## TestSprite Status

TestSprite MCP sudah dijalankan dengan API key user. Safe non-mutating smoke selesai PASS 3/3. Detail final ada di bagian `TestSprite Execution Update`.

Referensi:

- https://docs.testsprite.com/mcp/getting-started/installation
- https://docs.testsprite.com/web-portal/getting-started/overview

## Final Status

- Local Playwright: PASS.
- Live health: PASS.
- Live public responsive: PASS setelah timeout fix.
- Live Superadmin desktop login: PASS sebelum rate limit aktif.
- Live PDF report endpoint: NOT READY, `404`.
- TestSprite safe smoke: PASS, 3/3.

## Next Action

1. Commit dan push latest source yang berisi `app/api/reports/pdf/route.ts`.
2. Redeploy di Coolify dengan rebuild image.
3. Tunggu rate limit login selesai.
4. Run ulang `E2E_BASE_URL=https://myprodusen.online npm run e2e:public`.
5. Run ulang staging smoke dengan credential Superadmin.
6. Setelah akun role test tersedia, jalankan full role-based TestSprite/UAT.

## TestSprite Execution Update

Tanggal update: 2026-05-18 22:40 WIB.

### Akun TestSprite

- API key tervalidasi lewat MCP `testsprite_check_account_info`.
- Plan akun: Free.
- Credits saat validasi: 150.
- Catatan keamanan: API key pernah dikirim di chat. Disarankan rotate API key setelah sesi testing selesai.

### TestSprite Run 1 — AI Full Plan

TestSprite membuat 30 frontend test case dari PRD:

- `testsprite_tests/testsprite_frontend_test_plan.full-ai.json`
- `testsprite_tests/TC001_*.py` sampai `testsprite_tests/TC030_*.py`

Hasil:

- Banyak test `BLOCKED` karena membutuhkan kredensial employee/superadmin, link aktivasi email, GPS/camera real device, atau aksi mutasi data.
- Beberapa test `FAILED` karena AI TestSprite memakai route asumsi seperti `/kpi-templates` dan `/work-locations`, sementara route PRD/app sebenarnya ada di dashboard seperti `/dashboard/kpi` dan `/dashboard/locations`.
- Ini bukan bukti app rusak langsung; ini batasan test generation tanpa akun role lengkap dan tanpa izin mutasi data.

### TestSprite Run 2 — Safe Non-Mutating Smoke Plan

Plan dipersempit ke 3 test aman tanpa login dan tanpa mutasi data:

- `TS_SAFE_001` Public landing page loads.
- `TS_SAFE_002` Authentication public pages load.
- `TS_SAFE_003` Protected dashboard redirects unauthenticated user.

Hasil final:

- `TS_SAFE_001`: PASSED.
- `TS_SAFE_002`: PASSED.
- `TS_SAFE_003`: PASSED.
- Total: 3 PASSED, 0 FAILED, 0 BLOCKED.

File hasil:

- `testsprite_tests/tmp/test_results.json`
- `testsprite_tests/tmp/raw_report.md`
- `testsprite_tests/testsprite_frontend_test_plan.json`

### TestSprite Limitation

TestSprite tidak dipakai untuk full mutation test karena akan membuat/mengubah data produksi/staging. Untuk full UAT role-based perlu akun khusus:

- Superadmin test account.
- Admin HR test account.
- Supervisor test account.
- Employee test account.
- Data fixture staging yang boleh dimutasi.
- Izin menjalankan GPS/camera test di perangkat Android asli.

### Final Combined Result

- Playwright local public smoke: PASS, 12/12.
- Playwright local staging smoke: PASS, 12/12 plus 4 skip tanpa credential.
- Vitest unit/integration: PASS, 297/297.
- TypeScript lint: PASS.
- Next.js build: PASS.
- Release check: PASS.
- TestSprite safe smoke: PASS, 3/3.
- Live health `https://myprodusen.online/api/health`: PASS, 200.
- Live PDF route before redeploy: `404`, masih perlu redeploy latest build.

### Current Bug / Risk Remaining

1. Live `POST /api/reports/pdf` masih `404` saat dites, padahal local build sudah menampilkan route `/api/reports/pdf`.
2. Kemungkinan besar Coolify live belum menjalankan latest image/commit.
3. Full TestSprite role-based belum bisa clean tanpa test accounts dan izin mutasi staging.

### Required Next Step

1. Commit dan push latest code.
2. Redeploy Coolify dengan rebuild image.
3. Jalankan ulang:

```bash
E2E_BASE_URL=https://myprodusen.online npm run e2e:public
```

4. Setelah akun role test tersedia, jalankan:

```bash
E2E_BASE_URL=https://myprodusen.online \
E2E_SUPERADMIN_EMAIL=<email> \
E2E_SUPERADMIN_PASSWORD=<password> \
npm run e2e:staging
```

## Sequential Final Run — Playwright → Source Checks → TestSprite

Tanggal update: 2026-05-18 23:08 WIB.

### 1. Playwright Local Smoke

Command:

```bash
npm run e2e:public && npm run e2e:staging
```

Hasil:

- `npm run e2e:public`: PASS, 12/12.
- `npm run e2e:staging`: PASS, 12/12, 4 skipped karena credential Superadmin tidak diset di env lokal.
- Viewport tercakup: 360px, 390px, 768px, 1440px.
- Public pages, healthcheck, dan PDF unauth protection lokal PASS.

### 2. Source Sync + Security + Build Checks

Command:

```bash
npm run lint
npm run test
npm run build
npm run release:migrations
npm run release:check
```

Hasil:

- TypeScript lint: PASS.
- Vitest: PASS, 55 files, 297 tests.
- Next.js build: PASS.
- Route `/api/reports/pdf` muncul di local production build.
- Migration coverage: PASS, 14 migration files on disk.
- Release references: PASS.
- Release check: PASS.

### 3. Modules Covered By Automated Tests

Cakupan automated lokal dari Vitest/source tests dan Playwright:

- Auth public pages and auth API source behavior.
- Inactive login blocking via tests.
- Dashboard stats source behavior.
- RBAC role navigation.
- Sensitive route/source hardening.
- Payroll access and calculation guards.
- PDF report generation/security source tests.
- Attendance realtime selfie form source tests.
- Final UI wiring/source scan.
- Script/env validation.
- Public responsive pages.
- Healthcheck no secret leak.
- Unauthenticated PDF access blocked locally.

### 4. TestSprite Final Safe Smoke

TestSprite dijalankan setelah Playwright dan source checks.

Scope dibatasi aman:

- Tidak login.
- Tidak register user.
- Tidak membuat, mengubah, atau menghapus data.
- Tidak menjalankan GPS/camera mutation.
- Hanya public UI dan unauth dashboard protection.

Hasil final:

- `TS_SAFE_001 — Public landing page loads`: PASSED.
- `TS_SAFE_002 — Authentication public pages load`: PASSED.
- `TS_SAFE_003 — Protected dashboard redirects unauthenticated user`: PASSED.
- Total: 3 PASSED, 0 FAILED, 0 BLOCKED.

### 5. Sync Status

Local source/build status:

- Frontend routes and backend API routes compile together.
- `/api/reports/pdf` exists in local production build.
- Payroll, reports, attendance selfie, KPI, leave, audit, notification, dashboard route groups exist in build output.
- Drizzle migration coverage check passes.
- Public UI responsive smoke passes.

Live status:

- `https://myprodusen.online/api/health`: PASS, 200 in previous live test.
- `https://myprodusen.online/api/reports/pdf`: previously returned `404` before latest redeploy.
- Because local build contains `/api/reports/pdf`, remaining live mismatch likely deployment/image version, not local source missing route.

### 6. Zero-Risk Clarification

Zero risk cannot be honestly claimed for production without:

- Fresh Coolify redeploy from latest commit.
- Dedicated staging database/fixture allowed for mutation tests.
- Dedicated role accounts for Superadmin, Admin HR, Supervisor, Employee.
- Real Android GPS + realtime selfie manual test.
- Email activation/reset test against Resend staging domain.
- Backup/restore drill against staging DB and upload volume.

Current automated result is clean for non-mutating local smoke/source checks.

### 7. Required Production Gate

Before production go-live:

1. Commit latest code.
2. Push to branch used by Coolify.
3. Rebuild/redeploy Coolify image.
4. Re-run live Playwright:

```bash
E2E_BASE_URL=https://myprodusen.online npm run e2e:public
```

5. Re-run live Superadmin smoke after rate limit clears:

```bash
E2E_BASE_URL=https://myprodusen.online \
E2E_SUPERADMIN_EMAIL=<email> \
E2E_SUPERADMIN_PASSWORD=<password> \
npm run e2e:staging
```

6. Run manual UAT for GPS, camera, attendance mutation, payroll mutation, PDF download as Superadmin, audit log, notifications, and backup/restore drill.
