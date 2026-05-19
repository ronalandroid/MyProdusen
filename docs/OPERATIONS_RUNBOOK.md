# Operations Runbook — MyProdusen

> **AI agent role source of truth:** MyProdusen production uses exactly two user-facing account roles: `SUPERADMIN` and `EMPLOYEE`. Legacy `ADMIN_HR` and `SUPERVISOR` references are historical only and must not be used for new UI/UX, docs, tests, or route access.


Runbook ini dipakai untuk operasional harian, mingguan, dan bulanan setelah MyProdusen live.

## Daily Checks

- [ ] Buka `/api/health` dan pastikan sehat.
- [ ] Cek Coolify app status.
- [ ] Cek PostgreSQL service status.
- [ ] Cek error besar di application logs.
- [ ] Cek attendance hari ini.
- [ ] Cek pending geo attendance exception.
- [ ] Cek notifikasi penting.
- [ ] Pastikan backup harian berjalan.

## Weekly Checks

- [ ] Review audit log untuk aksi sensitif.
- [ ] Review user baru dan user inactive.
- [ ] Review attendance exception yang belum selesai.
- [ ] Review storage usage `/app/uploads`.
- [ ] Review database size.
- [ ] Review report export activity.
- [ ] Pastikan tidak ada upload folder public.

## Monthly Checks

- [ ] Review payroll period bulan berjalan.
- [ ] Review payroll structure jika ada perubahan kebijakan.
- [ ] Review KPI assignment dan approval.
- [ ] Review data employee aktif/nonaktif.
- [ ] Review backup retention.
- [ ] Jalankan restore drill jika masuk jadwal kuartalan.
- [ ] Review akses role produksi Superadmin dan Employee.

## Backup Check

1. Pastikan file database dump harian ada.
2. Pastikan archive upload harian ada.
3. Jalankan `pg_restore --list` untuk sample backup.
4. Jalankan `tar -tzf` untuk sample upload archive.
5. Pastikan backup disalin off-host.
6. Catat backup ID penting sebelum payroll closing atau release besar.

## Audit Log Review

- Cek login gagal berulang.
- Cek role change.
- Cek user activate/deactivate.
- Cek attendance adjustment.
- Cek payroll approve/export/paid.
- Cek PDF report download.
- Cek privileged selfie view.
- Laporkan aktivitas mencurigakan ke Owner/HR.

## Storage Usage Check

1. Cek disk VPS.
2. Cek ukuran `/app/uploads`.
3. Cek ukuran `attendance-selfies`.
4. Pastikan backup lama mengikuti retention.
5. Jangan hapus file upload manual tanpa koordinasi karena database menyimpan metadata/path.

## Database Health

- Pastikan PostgreSQL running.
- Pastikan koneksi app stabil.
- Cek query lambat jika dashboard/report terasa lambat.
- Pastikan migration baru hanya melalui `npm run db:deploy`.
- Jangan reset database produksi.

## Payroll Period Routine

1. Buat payroll period sesuai bulan/periode.
2. Pastikan employee payroll assignment lengkap.
3. Generate payroll run.
4. Review komponen gross/deduction/net.
5. Approve setelah HR dan Owner setuju.
6. Mark paid setelah pembayaran dilakukan.
7. Export atau download payslip sesuai permission.
8. Cek audit log.

## Attendance Exception Routine

1. Buka attendance exception.
2. Review alasan, GPS, dan data employee.
3. Approve jika sesuai kebijakan.
4. Reject dengan alasan jika tidak valid.
5. Pastikan employee menerima notification.
6. Review pola exception berulang.

## KPI Review Routine

1. Cek KPI template aktif.
2. Cek KPI assignment per employee/tim.
3. Pastikan supervisor input hasil sesuai jadwal.
4. Review dan approve KPI.
5. Pastikan employee bisa melihat KPI sendiri.
6. Cek audit log perubahan KPI.

## Report Routine

1. Export attendance report sesuai kebutuhan HR.
2. Export leave/KPI/payroll report sesuai permission.
3. Download PDF report hanya oleh Superadmin.
4. Simpan file report di tempat aman.
5. Jangan bagikan payroll/report sensitif tanpa approval.
6. Cek audit log report export.

## Escalation

- Masalah user biasa: Superadmin.
- Masalah role/access: Superadmin.
- Masalah attendance/payroll sensitif: HR lead + Superadmin.
- Masalah deploy/database/storage: Technical PIC.
- Masalah data besar atau rollback: Owner + HR lead + Technical PIC.
