# Staging Deploy Steps — MyProdusen

Panduan ini dipakai untuk deploy staging di Coolify. Jangan gunakan database produksi. Jangan commit `.env` atau secret.

## 1. Sebelum Deploy

- [ ] Pastikan branch/release yang akan dideploy sudah dipilih.
- [ ] Pastikan `npm run release:check` pass secara lokal/CI.
- [ ] Pastikan tidak ada secret di git diff.
- [ ] Pastikan staging PostgreSQL service tersedia.
- [ ] Pastikan domain staging sudah disiapkan.
- [ ] Pastikan volume `/app/uploads` tersedia.

## 2. Setup Coolify App

1. Buat app baru di Coolify atau gunakan app staging existing.
2. Pilih deploy mode `Dockerfile`.
3. Set exposed port `3000`.
4. Set domain staging, contoh `https://staging.myprodusen.online`.
5. Attach PostgreSQL staging service.
6. Jangan pakai database produksi.

## 3. Set Environment Variables

Set di Coolify, bukan di git:

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
HOSTNAME=0.0.0.0
NEXT_TELEMETRY_DISABLED=1

APP_URL=https://staging.myprodusen.online
NEXT_PUBLIC_APP_URL=https://staging.myprodusen.online
NEXTAUTH_URL=https://staging.myprodusen.online
CORS_ORIGIN=https://staging.myprodusen.online

DATABASE_URL=postgresql://<user>:<password>@<staging-postgres-host>:5432/<staging_db>
JWT_SECRET=<32+ random chars>
NEXTAUTH_SECRET=<32+ random chars>

STORAGE_DRIVER=local
UPLOAD_DIR=/app/uploads
ATTENDANCE_SELFIE_DIR=attendance-selfies
MAX_UPLOAD_SIZE=5242880
MAX_SELFIE_SIZE_MB=1

NEXT_PUBLIC_SELFIE_MAX_WIDTH=720
NEXT_PUBLIC_SELFIE_MAX_HEIGHT=720
NEXT_PUBLIC_SELFIE_IMAGE_QUALITY=0.75
NEXT_PUBLIC_SELFIE_TARGET_SIZE_KB=300

GPS_MAX_ACCURACY_METERS=100
DEFAULT_GEOFENCE_RADIUS_METERS=100
REJECT_OUTSIDE_GEOFENCE=true
GPS_TIMESTAMP_MAX_AGE_SECONDS=120

ATTENDANCE_EXPORT_MAX_ROWS=5000
PDF_REPORT_MAX_ROWS=1000
PDF_REPORT_MAX_DATE_RANGE_MONTHS=12

PAYROLL_MODULE_ENABLED=true
PAYROLL_MUTATION_ENABLED=true

RESEND_API_KEY=<resend key>
RESEND_FROM_EMAIL=MyProdusen <noreply@your-domain>

SUPERADMIN_EMAIL=<staging superadmin email>
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=<strong temporary password>
```

## 4. Persistent Volume

- [ ] Mount persistent volume ke container path `/app/uploads`.
- [ ] Pastikan volume private.
- [ ] Jangan expose `/app/uploads` sebagai static/public path.
- [ ] Selfie harus berada di `/app/uploads/attendance-selfies`.

## 5. Deploy

1. Klik Deploy di Coolify.
2. Pantau build log.
3. Pantau runtime log.
4. Pastikan entrypoint menjalankan env validation.
5. Pastikan container menunggu PostgreSQL.
6. Pastikan migration runner jalan.
7. Pastikan server Next.js standalone start di `0.0.0.0:3000`.

## 6. Post-Deploy Commands

Jalankan dari shell staging jika tersedia:

```bash
npm run release:env
npm run db:deploy
npm run release:migrations
npm run release:references
curl -fsS https://staging.myprodusen.online/api/health
```

Jika runtime image tidak punya dev dependency, minimal jalankan:

```bash
node scripts/check-production-env.mjs
node scripts/run-migrations.mjs
curl -fsS https://staging.myprodusen.online/api/health
```

## 7. Setelah Deploy

- [ ] Login Superadmin.
- [ ] Ganti password bootstrap jika dipakai.
- [ ] Remove/rotate `SUPERADMIN_PASSWORD` setelah bootstrap.
- [ ] Jalankan UAT dari `STAGING_UAT_RESULT.md`.
- [ ] Catat hasil di `STAGING_GO_NO_GO.md`.

## Route Verification After Coolify Deploy

Tambahkan tahap ini setelah deploy staging/live:

1. Confirm commit terbaru sudah ter-push ke branch Coolify.
2. Redeploy aplikasi di Coolify dengan rebuild image/no cache.
3. Confirm env metadata:
   - `APP_VERSION`
   - `NEXT_PUBLIC_APP_VERSION`
   - `GIT_COMMIT_SHA`
   - `BUILD_TIME`
4. Confirm health:

```bash
curl -sS https://myprodusen.online/api/health
```

5. Confirm protected PDF route tidak `404`:

```bash
BASE_URL=https://myprodusen.online npm run verify:live-routes
```

6. Run public smoke:

```bash
E2E_BASE_URL=https://myprodusen.online npm run e2e:public
```

7. Jika login Superadmin terkena rate limit, tunggu 15 menit. Jangan matikan rate limit produksi.
