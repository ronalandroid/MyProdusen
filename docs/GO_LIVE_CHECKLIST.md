# Go-Live Checklist — MyProdusen

> **AI agent role source of truth:** MyProdusen production uses exactly two user-facing account roles: `SUPERADMIN` and `EMPLOYEE`. Legacy `ADMIN_HR` and `SUPERVISOR` references are historical only and must not be used for new UI/UX, docs, tests, or route access.


Checklist ini dipakai sebelum MyProdusen dipakai resmi oleh karyawan. Semua poin harus dicek oleh Owner, HR, dan tim teknis sebelum tanggal go-live.

## A. Pre Go-Live

- [ ] Production env lengkap di Coolify.
- [ ] `DATABASE_URL` terhubung ke PostgreSQL produksi.
- [ ] Migrations sudah deployed dengan `npm run db:deploy`.
- [ ] Superadmin sudah dibuat dan password awal sudah diganti.
- [ ] Resend email sudah dites untuk aktivasi dan lupa password.
- [ ] Domain HTTPS aktif tanpa warning browser.
- [ ] `/api/health` status sehat.
- [ ] Persistent upload volume `/app/uploads` sudah terpasang.
- [ ] Backup database sudah dites dan file bisa diverifikasi.
- [ ] Backup upload sudah dites dan archive bisa dibuka.
- [ ] Restore drill ke staging/test sudah berhasil.
- [ ] `npm run release:check` passed sebelum deploy.
- [ ] Production smoke test passed.

## B. Account Setup

- [ ] Akun Superadmin aktif.
- [ ] Akun Employee aktif.
- [ ] Akses role Superadmin diverifikasi.
- [ ] Akses role Superadmin diverifikasi.
- [ ] Akses role Employee diverifikasi.
- [ ] Akses role Employee diverifikasi.
- [ ] User inactive tidak bisa login.

## C. Master Data Setup

- [ ] Data divisi sudah lengkap.
- [ ] Data posisi sudah lengkap.
- [ ] Work location sudah dibuat dengan latitude, longitude, dan radius benar.
- [ ] Shift kerja sudah dibuat.
- [ ] Employee records sudah dibuat.
- [ ] NIP karyawan auto-generated dan unik.
- [ ] Work location assignment sudah benar.
- [ ] Shift assignment sudah benar.

## D. Attendance Setup

- [ ] `GPS_MAX_ACCURACY_METERS` sudah sesuai kebijakan perusahaan.
- [ ] Radius geofence setiap lokasi sudah dicek.
- [ ] `REJECT_OUTSIDE_GEOFENCE` sudah sesuai kebijakan operasional.
- [ ] Selfie storage mengarah ke `/app/uploads/attendance-selfies`.
- [ ] Tes check-in di HP Android asli berhasil.
- [ ] Tes check-out di HP Android asli berhasil.
- [ ] Protected selfie endpoint berhasil untuk role berwenang.
- [ ] Public upload URL tidak bisa membuka file selfie.

## E. Payroll Setup

- [ ] Payroll periods sudah dibuat.
- [ ] Payroll structures sudah dibuat.
- [ ] Employee payroll assignment sudah benar.
- [ ] Payroll summary bisa dibuka Superadmin.
- [ ] Employee payroll view hanya menampilkan data sendiri.
- [ ] Audit log payroll approve/export/paid/payslip sudah dites.

## F. KPI Setup

- [ ] KPI templates sudah dibuat.
- [ ] KPI assignments sudah dibuat.
- [ ] KPI scoring sudah dites.
- [ ] KPI approval sudah dites.
- [ ] Employee hanya melihat KPI sendiri.

## G. Report Setup

- [ ] CSV export berhasil dan sesuai permission.
- [ ] Superadmin PDF report berhasil.
- [ ] Non-Superadmin diblokir dari PDF report.
- [ ] Audit log report export/download tercatat.

## H. Final Approval

- [ ] Owner approval diberikan.
- [ ] HR approval diberikan.
- [ ] Technical approval diberikan.
- [ ] Backup terakhir dikonfirmasi.
- [ ] Rollback plan dikonfirmasi.
- [ ] PIC go-live dan PIC emergency sudah ditentukan.
- [ ] Waktu go-live sudah dikomunikasikan ke karyawan.

## Catatan Go-Live

| Item | Isi |
| --- | --- |
| Tanggal go-live |  |
| PIC Owner |  |
| PIC HR |  |
| PIC Teknis |  |
| Domain produksi |  |
| Backup ID terakhir |  |
| Hasil akhir | Go / No-Go |
| Catatan |  |
