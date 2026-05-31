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
