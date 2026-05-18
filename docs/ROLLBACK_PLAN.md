# Rollback Plan — MyProdusen

Rollback adalah tindakan darurat untuk mengembalikan aplikasi ke kondisi aman. Jangan rollback tanpa analisis, approval, dan backup terbaru.

## Kapan Rollback Dibutuhkan

- Login tidak bisa dipakai banyak user setelah deploy.
- Attendance GPS/selfie gagal luas.
- Payroll atau data sensitif bocor ke role tidak berwenang.
- Database migration menyebabkan error besar.
- App tidak bisa start di Coolify.
- `/api/health` tidak sehat dan fix forward tidak aman.
- Error produksi mengganggu operasional karyawan.

## Siapa Yang Approve Rollback

- Owner atau perwakilan manajemen.
- HR lead jika berdampak ke attendance/payroll/karyawan.
- Technical PIC yang memahami deploy dan data.
- Untuk restore database, approval harus tertulis di channel resmi.

## Prinsip Utama

- Jangan rollback membabi buta.
- Ambil backup kondisi saat ini sebelum rollback.
- Jangan restore database produksi tanpa staging drill jika masih ada waktu.
- Jangan hapus data manual.
- Jangan expose backup atau secret.

## Rollback Coolify Deployment

1. Buka Coolify project MyProdusen.
2. Buka deployment history.
3. Pilih deployment terakhir yang diketahui stabil.
4. Jalankan rollback/redeploy versi stabil.
5. Tunggu container sehat.
6. Buka `/api/health`.
7. Login sebagai Superadmin dan Employee untuk smoke test singkat.
8. Cek logs minimal 10–15 menit.

## Restore Database Backup

1. Minta approval rollback database.
2. Stop app atau aktifkan maintenance window.
3. Ambil emergency backup database saat ini.
4. Pilih backup database yang akan direstore.
5. Jika memungkinkan, restore dulu ke staging/test.
6. Restore produksi hanya setelah disetujui.
7. Jalankan `npm run db:deploy` setelah restore jika kode butuh migration terbaru.
8. Cek `/api/health`.

Referensi detail: `docs/BACKUP_RESTORE.md`.

## Restore Uploads Backup

1. Minta approval jika akan overwrite upload produksi.
2. Ambil emergency backup `/app/uploads` saat ini.
3. Pilih archive upload yang sesuai dengan backup database.
4. Restore ke `/app/uploads`.
5. Pastikan ownership/permission benar.
6. Verifikasi attendance selfie lama bisa dibuka melalui protected endpoint.

## Verify Restored App

1. Buka homepage.
2. Login sebagai Superadmin.
3. Login sebagai Employee.
4. Buka attendance history.
5. Buka protected selfie.
6. Cek payroll/report jika terdampak.
7. Cek audit log.
8. Cek `/api/health`.
9. Catat hasil rollback.

## Komunikasi

- Umumkan status insiden ke Owner/HR.
- Beri tahu user jika ada downtime.
- Jelaskan data rollback point jika ada data yang kembali ke waktu backup.
- Catat penyebab, keputusan, waktu restore, dan hasil akhir.
