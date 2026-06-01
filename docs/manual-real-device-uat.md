# Manual Real Device UAT

Status: REAL_DEVICE_UAT = BLOCKED / NOT RUN

Reason: no physical Android/iPhone device execution evidence in this automation session. Do not mark production signoff until completed by human tester on real devices.

## Android Checklist
- [ ] Allow camera permission
- [ ] Allow GPS permission
- [ ] Employee Clock In selfie works
- [ ] Employee Clock Out selfie works
- [ ] Leader Clock In selfie works
- [ ] Leader Clock Out selfie works
- [ ] Distance shown
- [ ] Inside 150m accepted
- [ ] Outside 150m rejected
- [ ] Selfie saved as WebP/protected
- [ ] GPS accuracy visible
- [ ] Late deduction appears if late

## iPhone / Safari Checklist
- [ ] Allow camera permission
- [ ] Allow GPS permission
- [ ] Employee Clock In selfie works
- [ ] Employee Clock Out selfie works
- [ ] Leader Clock In selfie works
- [ ] Leader Clock Out selfie works
- [ ] Distance shown
- [ ] Inside 150m accepted
- [ ] Outside 150m rejected
- [ ] Selfie saved as WebP/protected
- [ ] GPS accuracy visible
- [ ] Late deduction appears if late
- [ ] PWA Add to Home Screen behavior checked
- [ ] Camera permission behavior checked
- [ ] Add to Home Screen guide checked

## UAT Hotfix — Attendance/Profile/Contrast
- Direct attendance CTA added for Employee and Leader dashboards: `Absensi Hari Ini`, `Absen Masuk`, `Absen Pulang`, `Absensi Selesai`.
- Attendance page now keeps one selfie+GPS capture flow with `Ambil Selfie`, GPS status, work location, distance, radius, inside/outside status, and submit labels `Kirim Absen Masuk/Pulang`.
- Manual correction remains available via `Ajukan Koreksi Manual`; backend selfie/GPS/geofence validation remains authoritative.
- First-login onboarding now requires `Nama Lengkap` minimum 3 chars plus avatar, phone, and address; self-update forbidden fields remain blocked.
- Profile page avatar click opens `Perbarui Foto Profil` modal with preview, WebP compression at max 512px/0.8 quality, progress copy, and save.
- Superadmin employee list renders protected avatar URLs with alt text, on-focus refetch, and fallback-safe behavior.
- Sidebar brand contrast improved with dark charcoal/brown brand text and readable cream Super Admin badge while preserving yellow/cream MyProdusen style.
- No destructive DB changes.
- Production signoff still requires redeploy, authenticated E2E, real-device GPS+selfie UAT, and protected avatar/selfie live verification.

## Attendance Selfie Real Device UAT
1. Login Employee/Leader on Android Chrome and iPhone Safari.
2. Open dashboard attendance card, tap Clock In then Clock Out when allowed.
3. Confirm camera opens, face guide appears, selfie capture/retake works.
4. Confirm GPS permission, accuracy, distance, radius, and inside/outside status render.
5. Submit and verify dashboard history updates and Superadmin attendance report shows selfie status, GPS distance, inside/outside radius, and correction request if manual.
6. Superadmin must not see normal Clock In / Clock Out.

## Map-First Attendance Real Device UAT
1. Login Employee/Leader, tap Clock In/Clock Out from Beranda.
2. Confirm first screen is `Validasi Lokasi`, not selfie.
3. Confirm map/fallback shows user pin, office pin, radius, distance, accuracy, and `Lanjutkan`.
4. Confirm outside-radius normal continue blocked and `Ajukan Koreksi Manual` appears.
5. Tap `Lanjutkan`, confirm selfie opens, face guide visible, `Ambil Foto`, preview, optional catatan, and submit work.
6. Confirm Superadmin report/history updates with GPS/selfie indicators.
