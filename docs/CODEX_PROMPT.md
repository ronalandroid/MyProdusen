# Codex Prompt — MyProdusen Final 10/10 Production Fix

> Copy-paste prompt ini ke Codex untuk menjalankan semua fix sampai 0 error, 0 bug, fully wired, dan siap deploy.

---

## PROMPT

```
Kamu adalah senior fullstack engineer yang bertanggung jawab membawa project MyProdusen HRIS ke status PRODUCTION-READY 10/10. Project ini sudah di skor 8.5/10. Tugasmu adalah menyelesaikan semua remaining issues sampai `npm run release:check` pass 100% tanpa flaky test, semua fitur wired end-to-end, dan siap deploy ke Coolify/VPS.

## KONTEKS PROJECT

- Next.js App Router + TypeScript + Tailwind CSS + Drizzle ORM + PostgreSQL
- 2 production roles: SUPERADMIN dan EMPLOYEE
- Docker deployment ke VPS via Coolify
- Semua docs ada di /docs/

## CURRENT STATUS

- `npm run lint` ✅ pass
- `npm run build` ✅ pass  
- `npm run test` — 331 tests, 1 FLAKY timeout di `tests/api/auth.test.ts` ("should register new user as SUPERADMIN" — timeout 5000ms saat parallel run, pass saat solo)
- `npm run release:migrations` ✅ pass
- `npm run release:references` ✅ pass

## TASKS — SELESAIKAN SEMUA INI

### 1. FIX FLAKY TEST TIMEOUT

File: `tests/api/auth.test.ts`
Test: "should register new user as SUPERADMIN"
Problem: Timeout 5000ms saat dijalankan bersama 63 file test lain (DB connection contention)
Fix options:
- Tambah `{ timeout: 15000 }` pada test tersebut, ATAU
- Tambah `testTimeout: 15000` di `vitest.config.ts` untuk test yang melibatkan DB, ATAU
- Gunakan connection pooling yang lebih baik di test setup

Requirement: `npm run test` harus pass 100% (0 failed) secara konsisten.

### 2. VERIFY ALL API ROUTES WIRED END-TO-END

Pastikan setiap route di `/app/api/` memiliki:
- `requireAuth()` call (kecuali public routes: login, register, public-register, activate, forgot-password, reset-password, health, version)
- Permission check via `hasPermission()` atau explicit role check
- Proper error response format: `{ success: false, error: { code, message } }`
- Audit log untuk sensitive actions

Scan semua route files dan fix jika ada yang:
- Missing auth check
- Missing permission check
- Returning raw error instead of safe Indonesian message
- Missing audit log untuk sensitive action

### 3. VERIFY FRONTEND-BACKEND SYNC

Setiap halaman dashboard harus:
- Fetch data dari API yang benar
- Handle loading state
- Handle error state  
- Handle empty state
- Show success feedback setelah mutation
- Tidak ada dead button (button tanpa action)
- Tidak ada form yang kehilangan data setelah validation error

Check these pages specifically:
- `/dashboard` (superadmin + employee views)
- `/dashboard/attendance` (check-in/out flow)
- `/dashboard/leave` (create + approve/reject)
- `/dashboard/kpi` (view + template + assign + score)
- `/dashboard/employees` (CRUD + NIP generation)
- `/dashboard/users` (list + activate + role change)
- `/dashboard/payroll` (superadmin manage + employee /me view)
- `/dashboard/reports` (filter + export CSV)
- `/dashboard/audit` (list + filter)
- `/dashboard/notifications` (list + mark read)
- `/dashboard/locations` (CRUD)
- `/dashboard/shifts` (CRUD)

### 4. SECURITY HARDENING FINAL CHECK

- [ ] Semua protected API responses untuk selfie/payroll/audit menggunakan `Cache-Control: no-store, private`
- [ ] `/api/health` tidak leak secrets, DB URL, upload paths
- [ ] `/api/version` hanya expose: app name, status, version, git SHA, build time, node env
- [ ] Test-support routes (`/api/test-support/*`) return 404 di production (NODE_ENV=production && TESTSPRITE_COMPAT_RESPONSE !== 'true')
- [ ] GPS accuracy validation menggunakan `GPS_MAX_ACCURACY_METERS` env (bukan hardcode)
- [ ] Login rate limit aktif (5 attempts / 15 min per IP+username)
- [ ] CSRF origin guard aktif untuk cookie-authenticated mutations
- [ ] Inactive users blocked di `requireAuth()` layer

### 5. DATABASE & MIGRATION INTEGRITY

- [ ] `drizzle/schema.ts` matches semua 20 migration files
- [ ] Tidak ada destructive migration (DROP TABLE, DROP COLUMN tanpa approval)
- [ ] Semua indexes yang dibutuhkan untuk dashboard/report queries sudah ada
- [ ] `npm run db:deploy` (scripts/run-migrations.mjs) bisa run semua migrations termasuk yang manually-authored

### 6. DEPLOYMENT READINESS

- [ ] `Dockerfile` builds successfully
- [ ] `docker-entrypoint.sh` sequence: validate env → wait DB → run migrations → bootstrap superadmin → start server
- [ ] `scripts/check-production-env.mjs` validates semua required env vars
- [ ] Production env blocks: TESTSPRITE_DISABLE_RATE_LIMITS, E2E_DISABLE_RATE_LIMITS, TESTSPRITE_DISABLE_CSRF_ORIGIN, E2E_DISABLE_CSRF_ORIGIN, TESTSPRITE_DISABLE_SECURE_COOKIES, TESTSPRITE_COMPAT_RESPONSE
- [ ] `/app/uploads` volume writable check di entrypoint
- [ ] Healthcheck configured di Dockerfile

### 7. RUN FINAL VERIFICATION

Setelah semua fix selesai, jalankan:

```bash
npm run lint
npm run test
npm run build
npm run release:check
```

SEMUA harus pass dengan 0 errors, 0 failures.

## RULES

1. Baca AGENTS.md dan /docs/prd/README.md sebelum membuat perubahan
2. Jangan ubah product direction, brand, atau scope
3. Jangan tambah dependency baru kecuali benar-benar diperlukan
4. Jangan hapus fitur yang sudah working
5. Fix root cause, bukan symptom
6. Setiap perubahan harus pass lint + test + build
7. Update docs jika ada perubahan behavior
8. Gunakan Bahasa Indonesia untuk user-facing messages
9. Jangan expose secrets, stack traces, atau raw errors ke user
10. Jangan hard-delete data historis

## OUTPUT FORMAT

Setelah selesai, berikan:
1. Summary of all fixes applied
2. Files changed
3. Commands run and results
4. Any remaining items that need manual/operational action (Coolify env, backup setup, stakeholder signoff)
5. Final `npm run release:check` output showing 0 failures
```

---

## CATATAN UNTUK OPERATOR

Setelah Codex selesai dan `release:check` pass 100%:

1. **Push ke branch** → trigger Coolify build
2. **Set env vars di Coolify** (ikuti `.env.example`)
3. **Verify** `/api/health` dan `/api/version`
4. **Run** `npm run release:env` di Coolify shell
5. **Test manual**: login → dashboard → attendance → leave → report
6. **Setup backup cron** (lihat `/docs/operations/README.md`)
7. **Dapatkan signoff** dari Owner/HR/Technical PIC
8. **Update** `/docs/final-checklist/README.md` — centang semua item
9. **Set status**: Release is READY ✅
