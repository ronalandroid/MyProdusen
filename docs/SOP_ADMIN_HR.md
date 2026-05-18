# SOP Admin HR — MyProdusen

Panduan ini untuk Admin HR. Admin HR mengelola operasional HR harian sesuai permission yang diberikan. Akses Superadmin-only tetap tidak boleh dibuka oleh Admin HR.

## 1. Login

1. Buka `/login`.
2. Masukkan email/username dan password.
3. Klik masuk.
4. Pastikan dashboard HR terbuka.

## 2. Manage Employees

1. Buka menu Employees.
2. Cari employee berdasarkan nama, NIP, divisi, atau posisi.
3. Buka detail employee untuk cek data.
4. Jangan hard delete employee yang punya histori.
5. Gunakan deactivate jika employee sudah tidak aktif.

## 3. Create / Update Employee

1. Klik tambah employee atau buka employee existing.
2. Isi data identitas, divisi, posisi, supervisor, shift, dan lokasi kerja.
3. Simpan.
4. Pastikan NIP otomatis muncul untuk employee baru.
5. Cek perubahan di detail employee.

## 4. Manage Work Locations

1. Buka Locations.
2. Tambah atau update lokasi kerja.
3. Isi latitude, longitude, radius, alamat, dan status.
4. Simpan.
5. Perubahan lokasi harus dikomunikasikan ke employee terkait.

## 5. Manage Shifts

1. Buka Shifts.
2. Buat shift baru atau update shift existing.
3. Isi jam kerja, toleransi terlambat, dan status.
4. Simpan.
5. Pastikan employee sudah assigned ke shift benar.

## 6. Review Attendance

1. Buka Attendance.
2. Filter tanggal, divisi, posisi, lokasi, atau employee.
3. Cek status hadir, terlambat, izin, sakit, pending, atau rejected.
4. Cek data GPS dan selfie hanya jika diperlukan.
5. Semua akses sensitif dapat tercatat di audit log.

## 7. Manual Attendance Adjustment

1. Buka attendance yang perlu diperbaiki.
2. Klik adjustment jika permission tersedia.
3. Isi alasan minimal jelas dan profesional.
4. Simpan perubahan.
5. Pastikan audit log tercatat.
6. Jangan membuat adjustment tanpa bukti operasional.

## 8. Manage Leave / Sick / Permission

1. Buka menu Leave.
2. Cek request pending.
3. Approve jika data valid.
4. Reject jika tidak valid dan isi alasan.
5. Pastikan employee menerima notification.
6. Cek audit log jika diperlukan.

## 9. Manage KPI Jika Diizinkan

1. Buka KPI.
2. Buat atau update template jika permission tersedia.
3. Assign KPI ke employee.
4. Review hasil KPI.
5. Approve sesuai aturan perusahaan.
6. Jangan ubah KPI approved tanpa alasan dan izin.

## 10. Payroll Operational View Jika Diizinkan

1. Buka Payroll.
2. Cek periode dan summary sesuai permission.
3. Cek assignment employee.
4. Export hanya jika permission tersedia.
5. Approve atau mark paid hanya jika role policy mengizinkan.
6. Laporkan data payroll tidak sesuai ke Superadmin.

## 11. Export Reports Jika Diizinkan

1. Buka Reports.
2. Pilih jenis report.
3. Pilih filter yang diperlukan.
4. Export CSV.
5. Simpan file di tempat aman.
6. Jangan membagikan data payroll/attendance ke pihak tanpa izin.

## 12. Common HR Workflow

1. Buat user/employee baru.
2. Pastikan employee aktif dan NIP ada.
3. Assign supervisor, shift, dan lokasi.
4. Minta employee aktivasi akun.
5. Tes login employee.
6. Tes check-in/check-out jika employee mulai kerja.
7. Pantau attendance harian.
8. Review leave/KPI/payroll sesuai jadwal.
