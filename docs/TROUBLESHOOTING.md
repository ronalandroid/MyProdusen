# Troubleshooting — MyProdusen

> **AI agent role source of truth:** MyProdusen production uses exactly two user-facing account roles: `SUPERADMIN` and `EMPLOYEE`. Legacy `ADMIN_HR` and `SUPERVISOR` references are historical only and must not be used for new UI/UX, docs, tests, or route access.


Panduan ini membantu pengguna dan Superadmin menangani masalah umum. Jika masalah menyangkut data sensitif, payroll, selfie, atau akses role, jangan kirim data pribadi ke grup umum.

## Tidak Bisa Login

1. Pastikan email/username benar.
2. Pastikan password benar.
3. Cek apakah akun sudah aktif.
4. Jika akun inactive, hubungi Superadmin.
5. Jika lupa password, gunakan `/forgot-password`.

## Activation Email Tidak Diterima

1. Cek folder spam atau promotions.
2. Pastikan email yang dipakai saat register benar.
3. Klik resend activation jika tersedia.
4. Jika tetap tidak masuk, Superadmin cek Resend dan status user.

## Forgot Password Email Tidak Diterima

1. Pastikan email terdaftar.
2. Cek folder spam.
3. Tunggu beberapa menit.
4. Minta link ulang dari `/forgot-password`.
5. Jika tetap gagal, hubungi Superadmin.

## GPS Denied

1. Buka pengaturan browser.
2. Cari permission untuk lokasi.
3. Izinkan lokasi untuk domain MyProdusen.
4. Refresh halaman attendance.
5. Coba check-in/check-out lagi.

## GPS Inaccurate

1. Pindah ke area yang lebih terbuka.
2. Aktifkan high accuracy location di HP.
3. Matikan mode hemat baterai jika mengganggu GPS.
4. Tunggu beberapa detik sampai akurasi membaik.
5. Jika tetap gagal, hubungi HR.

## Camera Denied

1. Buka pengaturan browser.
2. Izinkan kamera untuk domain MyProdusen.
3. Pastikan kamera tidak dipakai aplikasi lain.
4. Refresh halaman attendance.
5. Coba ambil selfie lagi.

## Selfie Failed

1. Pastikan kamera aktif.
2. Pastikan wajah terlihat jelas.
3. Pastikan koneksi internet stabil.
4. Refresh halaman.
5. Jika error tetap muncul, kirim screenshot error ke HR.

## Outside Geofence

1. Pastikan berada di lokasi kerja yang benar.
2. Pastikan GPS akurat.
3. Coba ulang setelah lokasi stabil.
4. Jika sedang tugas luar, ikuti aturan perusahaan dan ajukan ke HR.
5. Superadmin review exception sesuai kebijakan.

## Check-In Already Exists

1. Karyawan hanya bisa check-in sekali per hari.
2. Buka attendance history untuk melihat check-in hari ini.
3. Jika data salah, ajukan koreksi ke Superadmin dengan alasan.

## Cannot Checkout

1. Pastikan sudah check-in hari itu.
2. Pastikan belum check-out sebelumnya.
3. Pastikan GPS dan kamera aktif.
4. Jika tetap gagal, hubungi Superadmin.

## Payroll Tidak Terlihat

1. Pastikan login sebagai employee yang benar.
2. Pastikan periode payroll sudah dibuat.
3. Pastikan employee sudah punya payroll assignment.
4. Hubungi HR jika data payroll belum tersedia.

## Report Tidak Bisa Download

1. Pastikan role punya permission export.
2. Cek filter tanggal.
3. Coba rentang tanggal lebih kecil.
4. Jika tetap gagal, hubungi Superadmin.

## PDF Blocked

1. PDF report hanya untuk Superadmin.
2. Login ulang sebagai Superadmin jika memang berwenang.
3. Jika Superadmin butuh data, gunakan CSV report yang diizinkan atau minta Superadmin.

## Permission Denied

1. Pastikan login dengan akun yang benar.
2. Cek role user.
3. Pastikan akses sesuai tugas.
4. Jangan meminjam akun role lain.
5. Hubungi Superadmin untuk review role.

## App Slow

1. Cek koneksi internet.
2. Refresh halaman.
3. Coba browser lain.
4. Admin teknis cek Coolify logs, database health, dan storage usage.
5. Jika terjadi luas, informasikan jadwal perbaikan ke user.

## Upload Storage Issue

1. Admin teknis cek volume `/app/uploads` di Coolify.
2. Pastikan volume writable oleh container.
3. Pastikan disk VPS tidak penuh.
4. Pastikan upload folder tidak dipublish public.
5. Jalankan backup sebelum perubahan besar.

## Coolify Deployment Issue

1. Cek status deployment di Coolify.
2. Cek build log.
3. Cek runtime log.
4. Pastikan env vars lengkap.
5. Pastikan PostgreSQL service aktif.
6. Pastikan healthcheck `/api/health` bisa diakses.
7. Jika deploy baru bermasalah, gunakan rollback plan.
