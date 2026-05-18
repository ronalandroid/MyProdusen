# Staging UAT Result — MyProdusen

Dokumen ini dipakai untuk mencatat hasil UAT staging sebelum keputusan go-live produksi. Isi semua bagian dengan bukti singkat, PIC, tanggal, dan hasil.

## Informasi UAT

| Item | Isi |
| --- | --- |
| Tanggal UAT |  |
| Staging URL |  |
| Release / Commit |  |
| Tester Owner |  |
| Tester HR |  |
| Tester Teknis |  |
| Android Device |  |
| Browser Desktop |  |
| Database Staging |  |
| Backup ID |  |
| Hasil Akhir | PASS / FAIL |

## 1. Coolify Deploy

- [ ] Build Docker berhasil.
- [ ] Container running.
- [ ] Tidak ada error fatal di Coolify runtime logs.
- [ ] Domain staging HTTPS aktif.
- [ ] App memakai production start, bukan dev server.

Catatan:

```txt

```

## 2. Environment Validation

- [ ] `NODE_ENV=production`.
- [ ] `DATABASE_URL` staging valid.
- [ ] `JWT_SECRET` dan `NEXTAUTH_SECRET` ≥ 32 karakter.
- [ ] `APP_URL` dan `NEXT_PUBLIC_APP_URL` pakai HTTPS staging.
- [ ] `UPLOAD_DIR=/app/uploads`.
- [ ] `ATTENDANCE_SELFIE_DIR=attendance-selfies`.
- [ ] `RESEND_API_KEY` dan `RESEND_FROM_EMAIL` aktif.
- [ ] `PAYROLL_MODULE_ENABLED=true`.
- [ ] `PAYROLL_MUTATION_ENABLED=true`.
- [ ] `PDF_REPORT_MAX_ROWS=1000`.
- [ ] `PDF_REPORT_MAX_DATE_RANGE_MONTHS=12`.

Command/bukti:

```bash
npm run release:env
```

Hasil:

```txt

```

## 3. Healthcheck

- [ ] `GET /api/health` HTTP 200.
- [ ] Response `status` adalah `ok`.
- [ ] Response tidak menampilkan secret, password, token, atau connection string.

Bukti:

```bash
curl -fsS https://staging.myprodusen.online/api/health
```

Hasil:

```txt

```

## 4. Database Migration

- [ ] `npm run db:deploy` berhasil.
- [ ] `npm run release:migrations` berhasil.
- [ ] Tidak ada destructive migration.
- [ ] Data staging tidak hilang.

Hasil:

```txt

```

## 5. Persistent Upload Volume

- [ ] `/app/uploads` mounted.
- [ ] Runtime user bisa write ke `/app/uploads`.
- [ ] Selfie tersimpan di `/app/uploads/attendance-selfies`.
- [ ] Upload folder tidak public.

Hasil:

```txt

```

## 6. Auth + Resend Email

- [ ] Register user baru berhasil.
- [ ] Activation email terkirim.
- [ ] Link `/activate-account?token=...` berhasil aktivasi akun.
- [ ] Login akun aktif berhasil.
- [ ] Inactive user diblokir.
- [ ] Forgot password email terkirim.
- [ ] Reset password berhasil.

Hasil:

```txt

```

## 7. Android GPS + Realtime Selfie

- [ ] Test memakai HP Android asli.
- [ ] Browser meminta izin kamera.
- [ ] Browser meminta izin lokasi.
- [ ] Check-in dengan GPS + realtime selfie berhasil.
- [ ] Tidak ada upload manual/gallery picker.
- [ ] Backend memvalidasi geofence.
- [ ] Check-out dengan GPS + realtime selfie berhasil.
- [ ] Double check-in diblokir.
- [ ] Check-out sebelum check-in diblokir.
- [ ] Double check-out diblokir.

Hasil:

```txt

```

## 8. Protected Selfie Access

- [ ] Employee bisa melihat selfie sendiri.
- [ ] Employee tidak bisa melihat selfie employee lain.
- [ ] Supervisor hanya bisa melihat selfie tim jika permitted.
- [ ] Admin HR/Superadmin bisa melihat sesuai permission.
- [ ] Public direct upload URL gagal.
- [ ] Privileged selfie view tercatat di audit log.

Hasil:

```txt

```

## 9. Leave, KPI, Payroll, Reports

- [ ] Employee submit leave/sick/permission.
- [ ] Approval leave berhasil.
- [ ] Rejection leave wajib alasan.
- [ ] KPI template/assignment/result/approval berhasil.
- [ ] Employee melihat KPI sendiri saja.
- [ ] Payroll employee view menampilkan data sendiri saja.
- [ ] Superadmin payroll summary berhasil.
- [ ] Payroll approve/mark paid sesuai permission.
- [ ] CSV export berhasil sesuai role scope.
- [ ] Superadmin PDF report berhasil.
- [ ] Non-Superadmin PDF diblokir.
- [ ] PDF tidak berisi selfie path/url/binary.

Hasil:

```txt

```

## 10. Audit Logs + Notifications

- [ ] Audit login/role/user tercatat.
- [ ] Audit attendance/selfie tercatat.
- [ ] Audit leave/KPI/payroll/report tercatat.
- [ ] Notification leave muncul.
- [ ] Notification KPI muncul.
- [ ] Notification attendance pending/rejected muncul jika scenario dibuat.
- [ ] Mark notification as read berhasil.

Hasil:

```txt

```

## 11. Backup / Restore Drill

- [ ] Database backup dibuat.
- [ ] Upload backup dibuat.
- [ ] `pg_restore --list` berhasil membaca dump.
- [ ] `tar -tzf` berhasil membaca upload archive.
- [ ] Restore ke staging/test berhasil.
- [ ] Restored app bisa login.
- [ ] Restored attendance history bisa dibuka.
- [ ] Restored protected selfie bisa dibuka authorized role.

Hasil:

```txt

```

## 12. Visual Responsive Check

- [ ] Mobile 360px tidak overflow.
- [ ] Mobile 390px tidak overflow.
- [ ] Tablet 768px layout rapi.
- [ ] Desktop 1440px layout rapi.
- [ ] Bottom nav mobile terlihat dan bisa ditap.
- [ ] Sidebar desktop terlihat dan tidak broken.
- [ ] Semua tombol utama terlihat dan tappable.
- [ ] Loading/empty/error/success state terlihat saat diuji.

Hasil:

```txt

```

## Final UAT Decision

- [ ] PASS — lanjut produksi.
- [ ] PASS WITH NOTES — boleh lanjut jika risiko diterima Owner/HR/Teknis.
- [ ] FAIL — jangan lanjut produksi.

Catatan akhir:

```txt

```

## One-Shot Live Automation Update — 2026-05-19

- Local release checks: PASS.
- Live `/api/health`: PASS 200.
- Live `/api/reports/pdf` unauthenticated: PASS 401.
- Live public Playwright: PASS 12 passed.
- TestSprite: skipped because local CLI/MCP/API key unavailable.
- Remaining UAT: Android GPS/selfie, Resend email, credential role smoke, backup/restore drill.
