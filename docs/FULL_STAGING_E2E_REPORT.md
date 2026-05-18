# Full Staging E2E Report — MyProdusen

Tanggal: 2026-05-19
Domain live yang dites: `https://myprodusen.online`
Tool: Playwright
File test: `tests/e2e/full-staging.spec.ts`
Script: `npm run e2e:full-staging`

## Ringkasan

Full staging E2E package sudah dibuat dan dijalankan. Test default dibuat aman untuk production/live karena tidak melakukan mutasi data. Test role yang membutuhkan credential akan skip otomatis jika env belum tersedia. Mutation flow dikunci dengan `E2E_ALLOW_MUTATION=true` agar tidak merusak data production.

## Cakupan Test Otomatis

### Public dan Auth Pages

Routes:

- `/`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/activate-account`

Validasi:

- Page load.
- Title mengandung MyProdusen/Produsen/HRIS.
- Body visible.
- Tidak ada horizontal overflow.

### Health dan Sensitive API

Routes:

- `GET /api/health`
- `POST /api/reports/pdf`
- `POST /api/attendance/check-in`
- `POST /api/attendance/check-out`

Validasi:

- Health `200` dan `status: ok`.
- Health tidak leak `DATABASE_URL`, `JWT_SECRET`, `NEXTAUTH_SECRET`, atau PostgreSQL URL.
- Sensitive API unauthenticated harus reject dengan `401`, `403`, atau validasi `422`.
- Response tidak leak selfie path, upload path, atau secret.

### Protected Dashboard Pages

Routes:

- `/dashboard`
- `/dashboard/users`
- `/dashboard/payroll`
- `/dashboard/reports/pdf`
- `/dashboard/audit`

Validasi:

- Unauthenticated user tidak boleh melihat data dashboard sensitif.
- Protected content seperti audit log, user management, payroll, PDF report tidak tampil public.

### Superadmin Role Smoke

Butuh env:

```env
E2E_SUPERADMIN_EMAIL=
E2E_SUPERADMIN_PASSWORD=
```

Validasi:

- Login via API untuk menghindari UI hydration flake dan rate-limit berulang.
- Buka `/dashboard/users`.
- Buka `/dashboard/reports/pdf`.
- Buka `/dashboard/audit`.
- Buka `/dashboard/payroll`.

### Admin HR, Supervisor, Employee Role Smoke

Butuh env:

```env
E2E_ADMIN_HR_EMAIL=
E2E_ADMIN_HR_PASSWORD=
E2E_SUPERVISOR_EMAIL=
E2E_SUPERVISOR_PASSWORD=
E2E_EMPLOYEE_EMAIL=
E2E_EMPLOYEE_PASSWORD=
```

Jika env belum ada, test skip otomatis.

### Mutation Gate

Mutation flow tidak berjalan kecuali:

```env
E2E_ALLOW_MUTATION=true
```

Mutation hanya boleh di staging database disposable, bukan production.

## Hasil Test Local

Command:

```bash
npm run e2e:full-staging
npm run lint
```

Hasil:

- `npm run e2e:full-staging`: PASS.
- 12 passed.
- 16 skipped karena role credentials dan mutation flag tidak tersedia lokal.
- `npm run lint`: PASS.

## Hasil Test Live

Command:

```bash
E2E_BASE_URL=https://myprodusen.online \
E2E_SUPERADMIN_EMAIL=<set> \
E2E_SUPERADMIN_PASSWORD=<set> \
npm run e2e:full-staging
```

Hasil:

- PASS.
- 13 passed.
- 15 skipped.
- Superadmin critical dashboard pages berhasil dibuka.
- Admin HR/Supervisor/Employee skipped karena credential belum tersedia.
- Mutation skipped karena `E2E_ALLOW_MUTATION` tidak diset.

## Fix Yang Diterapkan

1. Menambahkan `tests/e2e/full-staging.spec.ts`.
2. Menambahkan npm script `e2e:full-staging`.
3. Login role smoke memakai API login untuk session setup yang stabil.
4. Test login role hanya berjalan pada `desktop-1440` untuk menghindari rate-limit paralel.
5. Sensitive API check memakai retry kecil untuk transient proxy `5xx`, tetapi tetap gagal jika final status tidak sesuai.
6. Mutation flow digate supaya production data aman.
7. Dokumentasi hasil ditambahkan ke `docs/testplayweight.md`.

## Command Untuk Menjalankan Lagi

Safe live read-only:

```bash
E2E_BASE_URL=https://myprodusen.online npm run e2e:full-staging
```

Live dengan Superadmin:

```bash
E2E_BASE_URL=https://myprodusen.online \
E2E_SUPERADMIN_EMAIL=<email> \
E2E_SUPERADMIN_PASSWORD=<password> \
npm run e2e:full-staging
```

Staging penuh role lengkap:

```bash
E2E_BASE_URL=https://staging.myprodusen.online \
E2E_SUPERADMIN_EMAIL=<email> \
E2E_SUPERADMIN_PASSWORD=<password> \
E2E_ADMIN_HR_EMAIL=<email> \
E2E_ADMIN_HR_PASSWORD=<password> \
E2E_SUPERVISOR_EMAIL=<email> \
E2E_SUPERVISOR_PASSWORD=<password> \
E2E_EMPLOYEE_EMAIL=<email> \
E2E_EMPLOYEE_PASSWORD=<password> \
npm run e2e:full-staging
```

Mutation staging disposable only:

```bash
E2E_ALLOW_MUTATION=true npm run e2e:full-staging
```

## Remaining Gap

Belum otomatis penuh untuk:

- Android GPS + realtime selfie karena perlu device/camera/location real.
- Email activation/reset end-to-end karena perlu mailbox test.
- Admin HR/Supervisor/Employee role smoke karena credential belum diberikan.
- Payroll approve/mark paid mutation karena butuh staging DB disposable dan izin mutasi.
- Backup/restore drill karena harus dijalankan manual/ops controlled.

## Status

READY untuk safe automated regression.

NOT READY untuk full destructive/mutation automation sampai tersedia staging DB disposable, akun role lengkap, mailbox test, dan device GPS/camera.

## Live Re-run With Superadmin — 2026-05-19

Command used with `E2E_BASE_URL=https://myprodusen.online` and Superadmin credential env set.

Result:

- PASS.
- 13 passed.
- 15 skipped.
- Superadmin role smoke passed on `desktop-1440`.
- Mobile/tablet Superadmin login tests skipped intentionally to avoid rate limit.
- Admin HR/Supervisor/Employee tests skipped because credentials were not provided.
- Mutation gate skipped because `E2E_ALLOW_MUTATION` was not enabled.

## Live Parallel Run Update — 2026-05-19

Target: `https://myprodusen.online`

### Result

- `verify:live-routes`: PASS.
- `e2e:public`: PASS, 12 passed.
- `e2e:full-staging`: PASS, 12 passed, 16 skipped.
- TestSprite CLI: not available locally; requires external MCP/API configuration.

### Fix Applied

- `tests/e2e/full-staging.spec.ts` now treats live login rate limit `429` as explicit credential-smoke skip.
- Production rate limit remains unchanged.
- Credentials are still required for role smoke after cooldown.

### Next Retry

Run after login cooldown clears:

```bash
E2E_BASE_URL=https://myprodusen.online npm run e2e:full-staging
```

## Release Gate Update — 2026-05-19 00:30 WIB

- `npm run build`: PASS.
- `npm run release:check`: PASS.
- `E2E_BASE_URL=https://myprodusen.online npm run e2e:full-staging`: PASS, 12 passed, 16 skipped.
- Credential role smoke remains skipped while live login rate-limit cooldown is active.
- TestSprite still requires external MCP/CLI setup; no local CLI exists in this repo.

## Live Retest Update — 2026-05-19 00:40 WIB

- `E2E_BASE_URL=https://myprodusen.online npm run e2e:full-staging`: PASS, 12 passed, 16 skipped.
- Credential smoke remains skipped during login rate-limit cooldown.
