# GO-LIVE CHECKLIST — MyProdusen

**Status kode:** ✅ FASE A selesai · `release:check` hijau (lint 0 / 696 test / build / migrasi 0000–0034) · 0 blocker kode.
**Sisa ke produksi:** 5 tindakan operasional di bawah (perlu perangkat fisik / data produksi / tanda tangan). Estimasi total **~2–3 hari**.

Tiap baris: centang saat selesai, ikuti langkah persis, catat siapa yang eksekusi.

---

### ☐ C1 — UAT Real-Device (Android + iPhone) · ~1 hari · _Eksekutor: QA/Owner_
Panduan: [`docs/ANDROID_REAL_DEVICE_TEST.md`](ANDROID_REAL_DEVICE_TEST.md) · [`docs/manual-real-device-uat.md`](manual-real-device-uat.md)
1. Buka app di HP Android **dan** iPhone (browser + APK Capacitor).
2. Login sebagai employee → check-in: izinkan GPS, ambil selfie realtime, pastikan liveness lolos.
3. Check-out, lalu cek riwayat absensi muncul benar.
4. Paraf hasil per device di kolom checklist dokumen.
- **Lulus jika:** GPS+geofence akurat, selfie liveness jalan, record tersimpan, tanpa error.

### ☐ C2 — Backup/Restore Drill (staging) · ~1 jam · _Eksekutor: DevOps_
Script: [`scripts/backup-restore-drill.sh`](../scripts/backup-restore-drill.sh) (aman: menolak target produksi; dry-run default)
```bash
# 1. Dry-run (hanya dump, tidak restore):
DATABASE_URL="<prod-url>" STAGING_RESTORE_DATABASE_URL="<staging-url>" npm run backup:drill
# 2. Restore betulan ke STAGING (bukan prod):
DATABASE_URL="<prod-url>" STAGING_RESTORE_DATABASE_URL="<staging-url>" \
  DRILL_CONFIRM=RESTORE_TO_STAGING npm run backup:drill
# 3. Verifikasi: bandingkan jumlah baris tabel kunci (Employee, Attendance, PayrollItem) sumber vs hasil restore.
```
- **Lulus jika:** dump terbentuk, restore ke staging sukses, row count cocok.

### ☐ C3 — Payroll Sign-off Packet · ~1 hari · _Eksekutor: Owner_
Artefak (sudah dibuat): [`docs/payroll-signoff/`](payroll-signoff/) → `sample-slip-A/B/C.html` + [`FORMULA-SUMMARY.md`](payroll-signoff/FORMULA-SUMMARY.md)
1. Regenerate bila perlu: `npx tsx scripts/generate-sample-payslips.ts`
2. Buka tiap `sample-slip-*.html` di browser → **Print → Save as PDF**.
3. Owner review FORMULA-SUMMARY.md + 3 slip, tanda tangan.
4. Putuskan 2 gap: **late penalty** & **prorate resign** (lihat §5 FORMULA-SUMMARY) — pakai apa adanya atau minta fitur baru.
- **Lulus jika:** owner tanda tangan rumus + 3 slip; keputusan 2 gap tercatat.

### ☐ C4 — Staging Authenticated E2E · ~1 jam · _Eksekutor: QA/DevOps_
Spec: [`tests/e2e/staging-smoke.spec.ts`](../tests/e2e/staging-smoke.spec.ts) (+ leader/employee staging)
```bash
# Env wajib (JANGAN hardcode — set di shell/CI):
export BASE_URL="https://staging.myprodusen..."   # URL staging
export E2E_SUPERADMIN_EMAIL="<akun-staging>"
export E2E_SUPERADMIN_PASSWORD="<password-staging>"
npm run e2e:staging
```
- **Lulus jika:** smoke + leader + employee staging specs hijau terhadap staging hidup.

### ☐ C5 — Env Produksi · ~15 menit · _Eksekutor: DevOps_
Script: [`scripts/check-production-env.mjs`](../scripts/check-production-env.mjs)
```bash
# Jalankan DENGAN env produksi termuat (mis. di server / Coolify shell):
node scripts/check-production-env.mjs   # harus 0 error
```
7 env wajib: `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`.
Isi yang kosong di **Coolify → Environment Variables** (per catatan deploy, ini sudah terisi di prod live).
- **Lulus jika:** `check-production-env` keluar tanpa error di lingkungan produksi.

---

> Setelah 5 baris ✅: deploy via `npm run db:deploy` (migrasi) lalu rilis. **Baru** saat itu status "siap produksi penuh" boleh diklaim.
