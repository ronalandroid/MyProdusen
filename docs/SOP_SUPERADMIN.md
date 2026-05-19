# SOP Superadmin — MyProdusen

> **AI agent role source of truth:** MyProdusen production uses exactly two user-facing account roles: `SUPERADMIN` and `EMPLOYEE`. Legacy `ADMIN_HR` and `SUPERVISOR` references are historical only and must not be used for new UI/UX, docs, tests, or route access.


Panduan ini untuk pengguna dengan role Superadmin. Superadmin punya akses penuh dan wajib berhati-hati karena semua aksi sensitif tercatat di audit log.

## 1. Login

1. Buka halaman `/login`.
2. Masukkan email/username dan password Superadmin.
3. Klik masuk.
4. Pastikan dashboard terbuka.
5. Jika gagal login, cek status akun dan hubungi tim teknis.

## 2. Dashboard Overview

1. Buka `/dashboard`.
2. Cek ringkasan karyawan aktif.
3. Cek kehadiran hari ini.
4. Cek karyawan terlambat, izin, sakit, dan tidak hadir.
5. Cek notifikasi atau peringatan operasional.

## 3. Manage Users

1. Buka `/dashboard/users`.
2. Cari user berdasarkan nama, email, atau role.
3. Cek status aktif/inactive.
4. Pastikan user yang baru register sudah masuk daftar.

## 4. Activate / Deactivate User

1. Buka detail user.
2. Klik aktifkan untuk user yang sudah valid.
3. Klik nonaktifkan jika user keluar perusahaan atau akses harus dihentikan.
4. Pastikan perubahan status tercatat di audit log.

## 5. Change Role

1. Buka `/dashboard/users`.
2. Pilih user.
3. Ubah role sesuai akses produksi: Superadmin atau Employee.
4. Simpan perubahan.
5. Verifikasi user hanya melihat menu sesuai role.
6. Cek audit log role change.

## 6. Create Employee

1. Buka menu Employees.
2. Klik tambah employee.
3. Isi nama, divisi, posisi, kontak, supervisor, shift, dan work location.
4. Simpan data.
5. Jangan membuat data dummy di produksi.

## 7. Verify NIP

1. Setelah employee dibuat, buka detail employee.
2. Pastikan NIP muncul otomatis.
3. Format default: `MPD-{YEAR}-{DIVISION_CODE}-{SEQUENCE}`.
4. Jika NIP kosong atau duplikat, jangan lanjutkan go-live; hubungi tim teknis.

## 8. Create Work Location

1. Buka menu Locations.
2. Klik tambah lokasi.
3. Isi nama lokasi, alamat, latitude, longitude, radius, dan status aktif.
4. Simpan.
5. Tes lokasi dengan HP di area kerja.

## 9. Create Shift

1. Buka menu Shifts.
2. Klik tambah shift.
3. Isi jam mulai, jam selesai, toleransi terlambat, dan status.
4. Simpan.
5. Pastikan shift aktif sebelum dipakai employee.

## 10. Assign Employee

1. Buka detail employee.
2. Pilih supervisor.
3. Pilih work location.
4. Pilih shift.
5. Simpan.
6. Minta employee login dan cek data di dashboard sendiri.

## 11. Monitor Attendance

1. Buka menu Attendance.
2. Filter tanggal, divisi, atau employee.
3. Cek status hadir, terlambat, pending, atau rejected.
4. Cek data GPS dan status geofence jika ada masalah.

## 12. Review Geo Attendance Exception

1. Buka attendance exception atau daftar attendance bermasalah.
2. Baca alasan dan data lokasi.
3. Approve hanya jika alasan valid.
4. Reject jika tidak sesuai aturan.
5. Pastikan keputusan tercatat di audit log.

## 13. View Audit Log

1. Buka menu Audit.
2. Filter tanggal atau action.
3. Cek aksi sensitif: login, role change, attendance, payroll, report, selfie, leave, KPI.
4. Laporkan aktivitas mencurigakan ke Owner/HR.

## 14. Payroll Overview

1. Buka menu Payroll.
2. Cek payroll summary.
3. Cek payroll periods dan payroll structures.
4. Generate atau review payroll run sesuai periode.
5. Approve dan mark paid hanya setelah data diverifikasi HR.
6. Jangan edit payroll yang sudah approved/paid secara langsung.

## 15. Download PDF Report

1. Buka Reports.
2. Pilih PDF Reports.
3. Pilih jenis laporan.
4. Pilih periode dan filter.
5. Klik download.
6. Pastikan file tidak berisi path/url/binary selfie.
7. Cek audit log `DOWNLOAD_PDF`.

## 16. Export CSV

1. Buka halaman report terkait.
2. Pilih filter.
3. Klik export CSV.
4. Simpan file di tempat aman.
5. Cek audit log export.

## 17. Troubleshoot Common Issues

- User tidak bisa login: cek status aktif dan role.
- Email tidak masuk: cek Resend dan folder spam.
- Attendance gagal: cek GPS, kamera, shift, dan work location.
- Payroll tidak tampil: cek assignment payroll dan permission.
- PDF blocked: pastikan login sebagai Superadmin.
- App lambat: cek Coolify logs, database, dan storage.
