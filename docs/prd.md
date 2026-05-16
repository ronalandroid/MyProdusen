# PRD.md — Web App Management KPI & Kehadiran Karyawan

**Project:** Dimsum Medan Employee Performance Management System  
**Client:** Produsen Dimsum Medan  
**Document Type:** PRD + SRS/SRC + TDD dalam satu dokumen  
**Version:** 1.0  
**Status:** Draft untuk Development  

---

## 1. Executive Summary

Produsen Dimsum Medan membutuhkan web app internal untuk mengelola kehadiran karyawan, KPI/performa kerja, izin/cuti/sakit, laporan, dan dashboard monitoring untuk Superadmin/Owner.

Sistem ini akan menggantikan proses manual seperti absensi kertas, rekap Excel, dan penilaian KPI yang tidak terpusat. Web app harus aman, mudah digunakan, scalable, dan memiliki kontrol akses berdasarkan role.

Fitur absensi wajib menggunakan:

- GPS location
- Geo-tagging
- Geo-fencing
- Selfie check-in
- Selfie check-out
- Selfie wajib diambil realtime dari kamera perangkat, tanpa upload manual/gallery picker
- Validasi radius lokasi kerja

---

## 2. Product Goals

### 2.1 Business Goals

- Memudahkan perusahaan memantau kedisiplinan karyawan.
- Mempercepat rekap absensi dan KPI.
- Mengurangi manipulasi absensi.
- Membantu manajemen mengambil keputusan berbasis data.
- Mengurangi human error dari rekap manual.
- Membuat sistem kerja internal lebih profesional.

### 2.2 User Goals

- Karyawan dapat absensi datang dan pulang dengan mudah menggunakan GPS + selfie.
- Supervisor dapat memantau tim dan menginput/menilai KPI.
- HR/Admin dapat mengelola data karyawan, shift, absensi, izin, cuti, dan laporan.
- Superadmin/Owner dapat memantau seluruh perusahaan melalui dashboard utama.

---

## 3. Target Users

### 3.1 Superadmin / Owner / Management

Role tertinggi. Memiliki akses penuh ke seluruh sistem.

### 3.2 Admin HR

Mengelola data karyawan, shift, absensi, izin/cuti/sakit, lokasi kerja, dan laporan.

### 3.3 Supervisor / Manager Divisi

Memantau tim, melihat absensi tim, memvalidasi pengajuan, dan mengisi KPI karyawan bawahannya.

### 3.4 Karyawan

Melakukan absensi, melihat jadwal, mengajukan izin/cuti/sakit, dan melihat KPI pribadi.

---

## 4. User Roles & Permission Summary

| Role | Akses Utama |
|---|---|
| Superadmin | Full access, dashboard global, user management, KPI config, report export, audit log, system setting |
| Admin HR | Kelola karyawan, absensi, shift, lokasi kerja, izin/cuti, laporan HR |
| Supervisor | Lihat data tim, validasi absensi tim, approve izin/cuti tim, input KPI tim |
| Karyawan | Absensi GPS + selfie, lihat KPI pribadi, ajukan izin/cuti/sakit, lihat jadwal |

---

## 5. MVP Scope

### 5.1 Fitur Wajib MVP

1. Authentication & RBAC.
2. User management.
3. Employee management.
4. Work location management untuk geo-fencing.
5. Attendance check-in dengan GPS + selfie.
6. Attendance check-out dengan GPS + selfie.
7. Shift management.
8. Leave/permission/sick request.
9. KPI template.
10. KPI assignment.
11. KPI input & scoring.
12. Dashboard Superadmin.
13. Dashboard Karyawan.
14. Report basic.
15. Export CSV/Excel.
16. Audit log.
17. Notification basic.

### 5.2 Phase 2 / Enhancement

1. QR code attendance.
2. Face matching selfie dengan foto profil.
3. Liveness detection.
4. Anti-fake GPS detection.
5. WhatsApp notification.
6. Payroll integration.
7. Production/inventory integration.
8. AI performance insight.
9. Native mobile app.

---

## 6. Feature Requirements

---

# 6A. Authentication & RBAC

## Description

Sistem login aman dengan role-based access control agar setiap user hanya dapat mengakses fitur sesuai hak aksesnya.

## Features

- Login email/username + password.
- Logout.
- Forgot password.
- Reset password.
- Change password.
- Role-based dashboard.
- Permission-based route guard.
- Optional 2FA untuk Superadmin.
- Session/token management.

## Acceptance Criteria

- User tidak bisa mengakses halaman yang bukan haknya.
- User inactive tidak bisa login.
- Password harus di-hash.
- Backend wajib melakukan authorization check, bukan hanya frontend.
- Session expired otomatis sesuai konfigurasi.

---

# 6B. Employee Management

## Description

Modul untuk mengelola data karyawan perusahaan.

## Features

- Tambah karyawan.
- Edit karyawan.
- Nonaktifkan karyawan.
- Lihat detail karyawan.
- Upload foto profil.
- Assign divisi.
- Assign jabatan.
- Assign supervisor.
- Assign shift default.
- Assign lokasi kerja.
- Riwayat perubahan data.

## Data Karyawan

- Employee code/NIK internal.
- Nama lengkap.
- Email.
- Nomor HP.
- Alamat.
- Tanggal masuk.
- Divisi.
- Jabatan.
- Atasan langsung.
- Status kerja.
- Shift default.
- Lokasi kerja default.
- Foto profil.
- Kontak darurat.

## Acceptance Criteria

- Admin HR dan Superadmin dapat mengelola karyawan.
- Supervisor hanya melihat karyawan dalam timnya.
- Karyawan hanya melihat datanya sendiri.
- Data historis tidak dihapus, hanya dinonaktifkan/soft delete.

---

# 6C. Work Location & Geo-fencing Management

## Description

Modul untuk menentukan lokasi kerja valid yang digunakan saat absensi berbasis GPS.

## Features

- Buat lokasi kerja.
- Edit lokasi kerja.
- Nonaktifkan lokasi kerja.
- Assign lokasi kerja ke karyawan/divisi/cabang.
- Set latitude dan longitude.
- Set radius absensi.
- Validasi absensi berdasarkan jarak user ke lokasi kerja.

## Data Lokasi Kerja

- Nama lokasi.
- Alamat.
- Latitude.
- Longitude.
- Radius dalam meter.
- Status aktif/nonaktif.

## Recommended Default

- Radius default: 100 meter.
- GPS accuracy maksimal: 50-100 meter.
- Jika di luar radius: absensi ditolak.
- Kasus khusus: Admin HR dapat manual adjustment dengan alasan wajib.

## Acceptance Criteria

- Superadmin/Admin HR dapat mengelola lokasi kerja.
- Karyawan hanya dapat absensi jika berada dalam radius lokasi kerja yang valid.
- Validasi geo-fencing wajib dilakukan di backend.
- Perubahan lokasi kerja tidak merusak data absensi historis.

---

# 6D. Attendance Management — GPS, Geo-tagging, Geo-fencing, Selfie

## Description

Modul absensi datang dan pulang berbasis GPS, geo-tagging, geo-fencing, dan selfie.

## Required Features

- Check-in menggunakan GPS.
- Check-out menggunakan GPS.
- Selfie saat check-in.
- Selfie saat check-out.
- Validasi radius lokasi kerja.
- Simpan latitude dan longitude.
- Simpan GPS accuracy jika tersedia.
- Simpan foto selfie check-in.
- Simpan foto selfie check-out.
- Simpan timestamp.
- Simpan device info/user agent/IP.
- Deteksi double check-in.
- Deteksi check-out tanpa check-in.
- Hitung telat otomatis.
- Hitung pulang cepat otomatis.
- Hitung total jam kerja.
- Manual adjustment oleh Admin HR dengan alasan wajib.

## Attendance Status

- Hadir.
- Terlambat.
- Izin.
- Sakit.
- Cuti.
- Alpha.
- Lembur.
- Pulang cepat.
- Pending approval.
- Rejected/out of radius.

## Business Rules

1. Satu karyawan hanya boleh memiliki satu record absensi per tanggal.
2. Check-out tidak boleh dilakukan sebelum check-in.
3. Check-in wajib GPS aktif.
4. Check-out wajib GPS aktif.
5. Check-in wajib selfie.
6. Check-out wajib selfie.
7. Absensi hanya valid jika lokasi berada dalam radius lokasi kerja.
8. Jika GPS mati, permission ditolak, atau lokasi tidak tersedia, absensi ditolak.
9. Jika lokasi di luar radius, absensi ditolak atau masuk pending approval sesuai konfigurasi.
10. Foto selfie wajib tersimpan sebagai bukti.
11. Latitude, longitude, accuracy, timestamp, dan device info harus tersimpan untuk audit.
12. Jika check-in melewati toleransi shift, status menjadi terlambat.
13. Jika tidak ada check-in dan tidak ada izin/cuti approved, status menjadi alpha.
14. Admin HR boleh koreksi absensi, tetapi wajib memberi alasan.
15. Koreksi tidak boleh menghapus data historis.

## Acceptance Criteria

- Karyawan tidak bisa check-in jika GPS tidak aktif.
- Karyawan tidak bisa check-in jika tidak upload selfie.
- Karyawan tidak bisa check-in jika berada di luar radius lokasi kerja.
- Karyawan tidak bisa check-out jika belum check-in.
- Karyawan tidak bisa check-out jika GPS tidak aktif.
- Karyawan tidak bisa check-out jika tidak upload selfie.
- Karyawan tidak bisa check-out jika berada di luar radius lokasi kerja.
- Sistem menghitung keterlambatan otomatis berdasarkan shift.
- Sistem menyimpan bukti lokasi dan selfie untuk audit.

---

# 6E. Shift & Schedule Management

## Description

Modul untuk mengatur jam kerja karyawan.

## Features

- Buat shift kerja.
- Edit shift kerja.
- Assign shift ke karyawan.
- Assign shift ke divisi.
- Kalender jadwal kerja.
- Hari libur manual.
- Toleransi keterlambatan.
- Rolling shift jika diperlukan.

## Data Shift

- Nama shift.
- Jam masuk.
- Jam pulang.
- Toleransi telat.
- Maksimum check-in sebelum jam masuk.
- Maksimum check-out setelah jam pulang.
- Status.

## Acceptance Criteria

- Admin HR dapat membuat dan mengubah shift.
- Absensi otomatis membaca shift aktif karyawan.
- Perubahan shift tidak merusak data absensi historis.

---

# 6F. Leave, Permission & Sick Request

## Description

Karyawan dapat mengajukan izin, cuti, atau sakit melalui sistem.

## Features

- Form pengajuan izin.
- Form pengajuan cuti.
- Form pengajuan sakit.
- Upload bukti/surat dokter jika diperlukan.
- Approval oleh Supervisor/Admin HR.
- Status pending/approved/rejected/cancelled.
- Riwayat pengajuan.
- Kuota cuti jika diperlukan.

## Business Rules

1. Pengajuan default status pending.
2. Status absensi berubah setelah pengajuan approved.
3. Rejection wajib memiliki alasan.
4. Pengajuan tidak boleh overlap dengan pengajuan aktif lain pada tanggal yang sama.

## Acceptance Criteria

- Karyawan dapat membuat pengajuan.
- Supervisor/Admin dapat approve/reject.
- Karyawan mendapat notifikasi setelah status berubah.
- Pengajuan tidak langsung mengubah absensi sebelum approved.

---

# 6G. KPI Management

## Description

Modul untuk mengatur indikator performa karyawan berdasarkan role, divisi, dan target kerja.

## Contoh KPI per Divisi

### Produksi

- Jumlah produksi harian.
- Tingkat produk reject/cacat.
- Ketepatan waktu produksi.
- Kebersihan area kerja.
- Kepatuhan SOP.
- Efisiensi bahan baku.

### Packing

- Jumlah packing selesai.
- Akurasi label/varian.
- Produk rusak saat packing.
- Kecepatan kerja.
- Kebersihan packaging.

### Gudang

- Akurasi stok.
- Kecepatan input barang masuk/keluar.
- Selisih stok.
- Kerapian gudang.

### Sales/Marketing

- Jumlah order.
- Revenue penjualan.
- Follow-up pelanggan.
- Retensi pelanggan.
- Target outlet/reseller.

### Admin/Finance

- Ketepatan input data.
- Ketepatan laporan.
- Akurasi transaksi.
- Penyelesaian tugas administratif.

## Features

- Buat template KPI.
- Assign KPI ke karyawan.
- Input nilai KPI harian/mingguan/bulanan.
- Bobot KPI.
- Target KPI.
- Realisasi KPI.
- Skor otomatis.
- Komentar supervisor.
- Approval KPI.
- Riwayat KPI.
- Ranking performa.

## KPI Formula

```text
Score KPI Item = (Actual / Target) x Weight
Total KPI Score = Sum of all KPI item scores
Final Performance Score = KPI Score + Attendance Score + Discipline Score
```

## KPI Scoring Logic

```text
For each KPI item:
  if scoring_method = higher_is_better:
    item_score = min((actual / target) * weight, weight)

  if scoring_method = lower_is_better:
    item_score = min((target / actual) * weight, weight)

  if scoring_method = boolean:
    item_score = actual == target ? weight : 0

Total Score = sum(item_score)
```

## Score Grade

| Score | Grade | Meaning |
|---:|---|---|
| 90-100 | A | Excellent |
| 80-89 | B | Good |
| 70-79 | C | Fair |
| 60-69 | D | Poor |
| <60 | E | Critical |

## Business Rules

1. KPI dibuat berdasarkan periode harian, mingguan, atau bulanan.
2. Setiap item KPI memiliki bobot.
3. Total bobot template KPI idealnya 100%.
4. Karyawan hanya bisa melihat KPI miliknya.
5. Supervisor hanya bisa menilai bawahan/timnya.
6. KPI yang sudah final/approved tidak boleh diedit kecuali oleh Superadmin/Admin dengan alasan.

## Acceptance Criteria

- Admin/Superadmin dapat membuat template KPI.
- Supervisor dapat input/validasi KPI tim.
- Karyawan dapat melihat KPI pribadi.
- Sistem dapat menghitung skor otomatis.
- Superadmin dapat melihat ranking performa seluruh karyawan.

---

# 6H. Dashboard Superadmin

## Description

Dashboard utama untuk memantau seluruh operasional karyawan.

## Widgets

- Total karyawan aktif.
- Kehadiran hari ini.
- Karyawan terlambat hari ini.
- Karyawan izin/cuti/sakit.
- Karyawan alpha.
- KPI rata-rata perusahaan.
- Top performer.
- Low performer.
- Grafik absensi bulanan.
- Grafik KPI per divisi.
- Trend keterlambatan.
- Alert karyawan bermasalah.
- Absensi di luar radius/pending approval.
- Export laporan.

## Filters

- Tanggal.
- Periode.
- Divisi.
- Jabatan.
- Lokasi kerja.
- Status absensi.
- Status KPI.

## Acceptance Criteria

- Superadmin dapat melihat seluruh data perusahaan.
- Dashboard mendukung filter.
- Data dashboard real-time atau near real-time.
- Dashboard memiliki empty state jika data belum ada.

---

# 6I. Dashboard Karyawan

## Features

- Status absensi hari ini.
- Tombol check-in.
- Tombol check-out.
- Kamera selfie absensi.
- Validasi GPS sebelum absensi.
- Jadwal kerja hari ini.
- Lokasi kerja aktif.
- Riwayat absensi.
- KPI bulan berjalan.
- Pengajuan izin/cuti/sakit.
- Notifikasi approval/rejection.

## Acceptance Criteria

- Karyawan hanya melihat datanya sendiri.
- Tombol absensi mengikuti aturan shift, lokasi, dan status hari itu.
- Sistem menampilkan pesan jelas jika GPS mati atau lokasi di luar radius.

---

# 6J. Reports & Export

## Features

- Laporan absensi harian.
- Laporan absensi mingguan.
- Laporan absensi bulanan.
- Laporan keterlambatan.
- Laporan absensi luar radius/pending.
- Laporan KPI individu.
- Laporan KPI divisi.
- Laporan performa perusahaan.
- Export CSV.
- Export Excel.
- Optional export PDF.

## Acceptance Criteria

- Report dapat difilter berdasarkan tanggal, divisi, karyawan, lokasi, dan status.
- Export harus sesuai filter yang dipilih.
- Data report tidak boleh berbeda dengan data dashboard.

---

# 6K. Notification System

## Features

- Notifikasi telat.
- Notifikasi belum check-out.
- Notifikasi pengajuan izin/cuti/sakit.
- Notifikasi approval/rejection.
- Notifikasi KPI belum diisi.
- Notifikasi absensi di luar radius.
- Optional WhatsApp/email notification.

## Acceptance Criteria

- User menerima notifikasi sesuai role.
- Notifikasi tersimpan di database.
- Notifikasi bisa dibaca/ditandai selesai.

---

# 6L. Audit Log

## Description

Mencatat aktivitas penting untuk keamanan dan transparansi.

## Event yang Dicatat

- Login/logout.
- Create/edit/delete/nonaktif user.
- Perubahan role.
- Perubahan data karyawan.
- Check-in.
- Check-out.
- Absensi ditolak karena luar radius.
- Absensi gagal karena GPS tidak aktif.
- Manual adjustment absensi.
- Approval/rejection izin.
- Perubahan nilai KPI.
- Approval KPI.
- Export laporan.
- Perubahan lokasi kerja.

## Acceptance Criteria

- Superadmin dapat melihat audit log.
- Audit log tidak bisa dihapus user biasa.
- Audit log memiliki timestamp, actor, action, target, IP/device, dan metadata.

---

# 6M. UI/UX Design System

## Description

Aplikasi menggunakan pendekatan Mobile-First Responsive Design. Desain mengadopsi tema terang (Light Mode) yang modern dan bersih (clean), berfokus pada kemudahan akses (accessibility) bagi seluruh pengguna, dari karyawan lapangan hingga jajaran manajemen.

## Brand Identity
- **Warna Utama (Primary):** `#FFC107` (Kuning Produsen Dimsum)
- **Warna Background:** `#F5F5F5` (Abu-abu terang untuk kontras card)
- **Warna Card/Content:** `#FFFFFF` (Putih)
- **Warna Teks Utama:** `#111111` (Hitam pekat)
- **Warna Teks Sekunder:** `#666666` (Abu-abu)
- **Warna Sukses:** `#22C55E` (Hijau terang untuk Check-In / Approved)
- **Warna Bahaya/Error:** `#E53935` (Merah untuk Check-Out / Rejected)

## Typography
- **Primary Font:** `Poppins`
- **Heading 1:** 24px, Bold (700)
- **Heading 2:** 18px, Semi-Bold (600)
- **Body Text:** 14px, Regular (400)
- **Caption:** 12px, Medium (500)

## Layout & Responsive Behavior

1. **Mobile (Max-width < 768px):**
   - Menggunakan `Bottom Navigation Bar` dengan 5 ikon utama (Beranda, Kehadiran, Karyawan, Cuti, Akun).
   - Tampilan menggunakan lebar penuh perangkat (100% width).
   - Elemen interaktif seperti tombol dan input dioptimalkan untuk sentuhan (touch-friendly).
   - Floating Action Button (FAB) ditempatkan melayang di pojok kanan bawah.

2. **Tablet & Desktop (Min-width >= 768px):**
   - Mengadopsi **Split Pane Layout**.
   - `Bottom Navigation Bar` bertransisi otomatis menjadi **Sidebar Navigasi Kiri**.
   - Lebar konten di sebelah kanan disesuaikan maksimal 1200px agar tetap nyaman dibaca (tidak terlalu lebar).
   - Elemen antarmuka seperti tabel, grid card, dan statistik otomatis beradaptasi (mengisi ruang yang tersedia).
   - Logo "MyProdusen" muncul di bagian atas Sidebar.

## Komponen UI Utama
- **Button:** Berbentuk kapsul penuh (rounded full). Tombol utama (primary) berwarna latar kuning dan teks hitam.
- **Card:** Berbentuk persegi dengan sudut melengkung halus (rounded-lg) dan sedikit bayangan lembut (soft drop shadow).
- **Badge/Status:** Latar belakang dengan opasitas 10% dari warna utama dengan teks sesuai warna (contoh: hijau muda dengan teks hijau tua untuk "Aktif" atau "Disetujui").

---

# 7. Software Requirements Specification / SRC

## 7.1 Functional Requirements

### FR-001 Authentication

Sistem harus menyediakan login aman untuk user berdasarkan username/email dan password.

Requirements:

- User dapat login.
- User dapat logout.
- Password harus di-hash.
- Session/token harus aman.
- Role user dibaca setelah login.
- User nonaktif tidak bisa login.

### FR-002 Role-Based Access Control

Sistem harus membatasi akses berdasarkan role dan permission.

Requirements:

- Superadmin memiliki semua akses.
- Admin HR tidak boleh mengubah konfigurasi superadmin kecuali diberi permission.
- Supervisor hanya dapat melihat timnya.
- Karyawan hanya dapat melihat datanya sendiri.
- Authorization wajib dilakukan di backend.

### FR-003 Employee CRUD

Sistem harus mendukung create, read, update, deactivate data karyawan.

Requirements:

- Admin HR dan Superadmin dapat membuat data karyawan.
- Data karyawan memiliki ID unik.
- Karyawan dapat dinonaktifkan tanpa menghapus data historis.

### FR-004 Work Location Management

Sistem harus mendukung pengelolaan lokasi kerja untuk geo-fencing.

Requirements:

- Superadmin/Admin HR dapat membuat lokasi kerja.
- Lokasi kerja memiliki latitude, longitude, dan radius.
- Lokasi kerja dapat di-assign ke karyawan.
- Lokasi kerja aktif digunakan untuk validasi absensi.

### FR-005 Attendance Check-In

Sistem harus mencatat kehadiran masuk karyawan menggunakan GPS, geo-fencing, dan selfie.

Requirements:

- Karyawan dapat check-in pada hari kerja.
- Sistem mencatat timestamp.
- Sistem menentukan status on time/telat.
- Sistem mencegah double check-in.
- Sistem wajib meminta akses GPS/location permission.
- Sistem wajib mengambil latitude dan longitude saat check-in.
- Sistem wajib memvalidasi lokasi berdasarkan radius lokasi kerja.
- Sistem wajib meminta selfie saat check-in.
- Sistem menyimpan foto selfie check-in.
- Sistem menyimpan metadata lokasi seperti latitude, longitude, GPS accuracy, dan device info jika tersedia.
- Jika GPS tidak aktif atau permission ditolak, check-in harus gagal.
- Jika lokasi di luar radius, sistem menolak check-in atau menandai pending approval sesuai konfigurasi perusahaan.

### FR-006 Attendance Check-Out

Sistem harus mencatat jam pulang karyawan menggunakan GPS, geo-fencing, dan selfie.

Requirements:

- Karyawan hanya dapat check-out setelah check-in.
- Sistem menghitung total jam kerja.
- Sistem menentukan pulang normal/pulang cepat.
- Sistem wajib meminta akses GPS/location permission.
- Sistem wajib mengambil latitude dan longitude saat check-out.
- Sistem wajib memvalidasi lokasi berdasarkan radius lokasi kerja.
- Sistem wajib meminta selfie saat check-out.
- Sistem menyimpan foto selfie check-out.
- Jika GPS tidak aktif atau permission ditolak, check-out harus gagal.
- Jika lokasi di luar radius, sistem menolak check-out atau menandai pending approval sesuai konfigurasi perusahaan.

### FR-007 Manual Attendance Adjustment

Admin HR dapat melakukan koreksi absensi dengan alasan yang wajib diisi.

Requirements:

- Semua koreksi masuk audit log.
- Data asli tidak hilang.
- Old value dan new value disimpan.

### FR-008 Shift Management

Admin HR dapat membuat dan mengatur shift.

Requirements:

- Shift memiliki jam masuk, jam pulang, dan toleransi telat.
- Shift dapat di-assign ke karyawan.
- Absensi membaca shift yang berlaku.

### FR-009 Leave/Permission Request

Karyawan dapat mengajukan izin/cuti/sakit.

Requirements:

- Pengajuan memiliki tanggal mulai dan selesai.
- Pengajuan memiliki alasan.
- Pengajuan memiliki status.
- Supervisor/Admin dapat approve/reject.

### FR-010 KPI Template Management

Superadmin/Admin dapat membuat template KPI.

Requirements:

- Template KPI memiliki nama, divisi, jabatan, periode, item KPI, target, dan bobot.
- Total bobot idealnya 100%.
- Template dapat diaktifkan/nonaktifkan.

### FR-011 KPI Input & Evaluation

Supervisor/Admin dapat mengisi nilai KPI karyawan.

Requirements:

- KPI memiliki target dan actual.
- Sistem menghitung skor otomatis.
- KPI bisa diberi catatan.
- KPI bisa di-approve.

### FR-012 Dashboard Superadmin

Sistem harus menyediakan dashboard global.

Requirements:

- Menampilkan ringkasan karyawan.
- Menampilkan ringkasan absensi.
- Menampilkan ringkasan KPI.
- Menampilkan data absensi luar radius/pending.
- Menampilkan grafik dan filter.

### FR-013 Dashboard Karyawan

Sistem harus menyediakan dashboard personal karyawan.

Requirements:

- Menampilkan status absensi hari ini.
- Menampilkan tombol check-in/check-out.
- Menampilkan validasi GPS dan lokasi.
- Menampilkan KPI pribadi.
- Menampilkan riwayat absensi.
- Menampilkan pengajuan izin/cuti.

### FR-014 Reports

Sistem harus menyediakan laporan.

Requirements:

- Filter tanggal.
- Filter divisi.
- Filter karyawan.
- Filter lokasi kerja.
- Export Excel/CSV.
- Optional export PDF.

### FR-015 Notification

Sistem harus mengirim notifikasi internal.

Requirements:

- Notifikasi tersimpan di database.
- User dapat melihat daftar notifikasi.
- User dapat menandai notifikasi sebagai dibaca.

### FR-016 Audit Log

Sistem harus menyimpan log aktivitas penting.

Requirements:

- Log mencatat actor, action, target, timestamp, IP/device jika tersedia.
- Log hanya dapat dilihat Superadmin.

---

## 7.2 Non-Functional Requirements

### NFR-001 Security

- Password wajib di-hash dengan bcrypt/argon2.
- Gunakan HTTPS di production.
- Validasi input di frontend dan backend.
- Proteksi dari SQL injection.
- Proteksi dari XSS.
- Proteksi dari CSRF jika menggunakan cookie session.
- Rate limiting untuk login.
- Audit log untuk aksi sensitif.
- Authorization check wajib di backend.

### NFR-002 GPS & Selfie Security

- Validasi lokasi dilakukan di backend.
- Frontend hanya mengirim latitude, longitude, accuracy, timestamp, dan selfie.
- Backend tetap menghitung jarak ke lokasi kerja.
- Gunakan batas maksimal GPS accuracy.
- Simpan device info/user agent/IP untuk audit.
- Selfie upload wajib divalidasi mime type dan ukuran file.
- File selfie disimpan dengan nama aman, bukan nama asli user.
- Data selfie hanya dapat diakses role berwenang.
- Absensi di luar radius harus tercatat sebagai rejected/pending agar bisa diaudit.

### NFR-003 Performance

- Dashboard utama load kurang dari 3 detik untuk data normal.
- Query laporan harus menggunakan pagination/filter.
- Index database wajib untuk kolom pencarian utama.
- Hindari N+1 query.

### NFR-004 Scalability

- Struktur database mendukung penambahan cabang/divisi/lokasi kerja.
- Sistem role dan permission harus modular.
- KPI template harus fleksibel untuk berbagai jabatan.

### NFR-005 Reliability

- Data absensi tidak boleh hilang.
- Gunakan backup database berkala.
- Error harus ditangani dengan pesan jelas.
- Critical action harus idempotent jika memungkinkan.

### NFR-006 Usability

- UI sederhana untuk karyawan non-teknis.
- Dashboard mudah dibaca.
- Form memiliki validasi dan helper text.
- Empty state informatif.
- Pesan error GPS/lokasi harus jelas.

### NFR-007 Maintainability

- Struktur folder rapi.
- Pisahkan business logic dari UI.
- Gunakan reusable components.
- Dokumentasi API dan database wajib tersedia.

### NFR-008 Privacy

- Data karyawan hanya boleh diakses role berwenang.
- Data selfie absensi tidak boleh public.
- Perubahan data sensitif wajib tercatat.
- Export laporan hanya untuk user berhak.

---

# 8. Data Model Draft

## users

- id
- employee_id
- name
- email
- username
- password_hash
- role_id
- status
- last_login_at
- created_at
- updated_at

## roles

- id
- name
- description
- created_at
- updated_at

## permissions

- id
- key
- name
- description

## role_permissions

- id
- role_id
- permission_id

## employees

- id
- employee_code
- full_name
- phone
- email
- address
- join_date
- division_id
- position_id
- supervisor_id
- employment_status
- default_shift_id
- default_work_location_id
- profile_photo_url
- emergency_contact_name
- emergency_contact_phone
- created_at
- updated_at
- deleted_at

## divisions

- id
- name
- description
- status

## positions

- id
- division_id
- name
- description

## work_locations

- id
- name
- address
- latitude
- longitude
- radius_meters
- status
- created_at
- updated_at

## employee_work_locations

- id
- employee_id
- work_location_id
- effective_date
- end_date
- created_at
- updated_at

## shifts

- id
- name
- start_time
- end_time
- late_tolerance_minutes
- checkin_open_minutes_before
- checkout_close_minutes_after
- status

## employee_shifts

- id
- employee_id
- shift_id
- effective_date
- end_date

## attendances

- id
- employee_id
- attendance_date
- shift_id
- work_location_id
- check_in_at
- check_out_at
- status
- late_minutes
- early_leave_minutes
- total_work_minutes
- check_in_method
- check_out_method
- check_in_latitude
- check_in_longitude
- check_in_accuracy
- check_in_distance_meters
- check_in_photo_url
- check_out_latitude
- check_out_longitude
- check_out_accuracy
- check_out_distance_meters
- check_out_photo_url
- device_info
- ip_address
- user_agent
- notes
- created_at
- updated_at

## attendance_adjustments

- id
- attendance_id
- adjusted_by
- old_value_json
- new_value_json
- reason
- created_at

## leave_requests

- id
- employee_id
- type
- start_date
- end_date
- reason
- attachment_url
- status
- approved_by
- approved_at
- rejection_reason
- created_at
- updated_at

## kpi_templates

- id
- name
- division_id
- position_id
- period_type
- status
- created_by
- created_at
- updated_at

## kpi_template_items

- id
- kpi_template_id
- name
- description
- target_value
- unit
- weight
- scoring_method
- order_index

## kpi_assignments

- id
- employee_id
- kpi_template_id
- period_start
- period_end
- status
- assigned_by
- created_at

## kpi_results

- id
- kpi_assignment_id
- employee_id
- total_score
- status
- reviewed_by
- reviewed_at
- notes
- created_at
- updated_at

## kpi_result_items

- id
- kpi_result_id
- kpi_template_item_id
- target_value
- actual_value
- weight
- score
- notes

## notifications

- id
- user_id
- title
- message
- type
- read_at
- created_at

## audit_logs

- id
- actor_user_id
- action
- target_type
- target_id
- old_value_json
- new_value_json
- ip_address
- user_agent
- created_at

---

# 9. API Endpoint Draft

## Auth

- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- GET /api/auth/me

## Users & Roles

- GET /api/users
- POST /api/users
- GET /api/users/:id
- PATCH /api/users/:id
- PATCH /api/users/:id/status
- GET /api/roles
- POST /api/roles
- PATCH /api/roles/:id

## Employees

- GET /api/employees
- POST /api/employees
- GET /api/employees/:id
- PATCH /api/employees/:id
- DELETE /api/employees/:id

## Work Locations / Geo-fencing

- GET /api/work-locations
- POST /api/work-locations
- GET /api/work-locations/:id
- PATCH /api/work-locations/:id
- DELETE /api/work-locations/:id
- POST /api/work-locations/assign-employee

## Attendance

- GET /api/attendances
- POST /api/attendances/check-in
- POST /api/attendances/check-out
- GET /api/attendances/me
- PATCH /api/attendances/:id/adjust
- GET /api/attendances/summary

## Shifts

- GET /api/shifts
- POST /api/shifts
- PATCH /api/shifts/:id
- DELETE /api/shifts/:id
- POST /api/employee-shifts

## Leave Requests

- GET /api/leave-requests
- POST /api/leave-requests
- GET /api/leave-requests/:id
- PATCH /api/leave-requests/:id/approve
- PATCH /api/leave-requests/:id/reject
- PATCH /api/leave-requests/:id/cancel

## KPI

- GET /api/kpi/templates
- POST /api/kpi/templates
- GET /api/kpi/templates/:id
- PATCH /api/kpi/templates/:id
- DELETE /api/kpi/templates/:id
- POST /api/kpi/assignments
- GET /api/kpi/assignments
- GET /api/kpi/results
- POST /api/kpi/results
- PATCH /api/kpi/results/:id
- PATCH /api/kpi/results/:id/approve

## Dashboard

- GET /api/dashboard/superadmin
- GET /api/dashboard/hr
- GET /api/dashboard/supervisor
- GET /api/dashboard/employee

## Reports

- GET /api/reports/attendance
- GET /api/reports/attendance/export
- GET /api/reports/kpi
- GET /api/reports/kpi/export

## Notifications

- GET /api/notifications
- PATCH /api/notifications/:id/read
- PATCH /api/notifications/read-all

## Audit Logs

- GET /api/audit-logs

---

# 10. Technical Design Document / TDD

## 10.1 Recommended Tech Stack

### Frontend

- Next.js / React.
- TypeScript.
- Tailwind CSS.
- Shadcn UI atau komponen internal.
- React Hook Form + Zod.
- TanStack Query.
- Zustand/Context jika diperlukan.

### Backend

Pilihan recommended fullstack:

- Next.js App Router.
- API Routes / Server Actions.
- Prisma ORM.
- PostgreSQL.

Pilihan backend terpisah:

- Node.js + NestJS/Express.
- Prisma ORM.
- PostgreSQL.
- Redis untuk cache/rate limit/job queue jika diperlukan.

### Database

- PostgreSQL untuk production.
- SQLite hanya untuk development/testing lokal.

### Storage

- S3-compatible storage untuk foto profil, bukti sakit, dan selfie absensi.
- Local storage hanya untuk development.

### Deployment

- VPS + Docker.
- Coolify.
- Railway/Render.
- Vercel + managed PostgreSQL jika menggunakan Next.js.

---

## 10.2 Architecture Overview

```text
Client Browser / Mobile Browser
    ↓
Frontend Web App
    ↓
API Layer / Server Actions
    ↓
Service Layer / Business Logic
    ↓
Repository / ORM
    ↓
PostgreSQL Database
    ↓
Object Storage for Images
```

---

## 10.3 Recommended Folder Structure

```text
/src
  /app
    /(auth)
    /(dashboard)
    /api
  /components
    /ui
    /forms
    /tables
    /dashboard
  /features
    /auth
    /employees
    /attendance
    /work-locations
    /kpi
    /leave
    /reports
    /notifications
    /audit
  /lib
    auth.ts
    db.ts
    permissions.ts
    validations.ts
    logger.ts
    geo.ts
    upload.ts
  /server
    /services
    /repositories
    /middlewares
  /types
  /utils
/prisma
  schema.prisma
  migrations
/docs
  PRD.md
  API.md
  DATABASE.md
  RBAC.md
/tests
  /unit
  /integration
  /e2e
```

---

## 10.4 Core Modules Design

### Auth Module

Responsibilities:

- Login/logout.
- Session/token validation.
- Password hashing.
- Current user context.
- RBAC guard.

Key Services:

- AuthService.login().
- AuthService.logout().
- AuthService.getCurrentUser().
- PermissionService.canAccess().

### Employee Module

Responsibilities:

- CRUD karyawan.
- Relasi divisi, jabatan, atasan.
- Status karyawan.
- Assign shift dan lokasi kerja.

Key Services:

- EmployeeService.createEmployee().
- EmployeeService.updateEmployee().
- EmployeeService.deactivateEmployee().
- EmployeeService.getEmployeeProfile().

### Work Location Module

Responsibilities:

- CRUD lokasi kerja.
- Assign lokasi ke karyawan.
- Validasi lokasi aktif.
- Menyediakan data geo-fence untuk attendance.

Key Services:

- WorkLocationService.createLocation().
- WorkLocationService.updateLocation().
- WorkLocationService.assignEmployee().
- WorkLocationService.getActiveLocationForEmployee().

### Attendance Module

Responsibilities:

- Check-in/check-out.
- Validasi GPS.
- Validasi geo-fencing.
- Upload selfie.
- Perhitungan telat, pulang cepat, total jam kerja.
- Koreksi manual.
- Rekap absensi.

Key Services:

- AttendanceService.checkIn().
- AttendanceService.checkOut().
- AttendanceService.calculateAttendanceStatus().
- AttendanceService.adjustAttendance().
- AttendanceService.getSummary().

### Geo Service

Responsibilities:

- Hitung jarak user ke lokasi kerja.
- Validasi radius.
- Validasi GPS accuracy.

Formula:

```text
Distance = Haversine(user_lat, user_lng, work_location_lat, work_location_lng)
Valid = Distance <= radius_meters
```

Key Services:

- GeoService.calculateDistanceMeters().
- GeoService.isInsideFence().
- GeoService.validateAccuracy().

### KPI Module

Responsibilities:

- Template KPI.
- Assignment KPI.
- Input actual KPI.
- Hitung skor.
- Approval KPI.

Key Services:

- KpiTemplateService.createTemplate().
- KpiAssignmentService.assignToEmployee().
- KpiScoringService.calculateScore().
- KpiResultService.submitResult().
- KpiResultService.approveResult().

### Leave Module

Responsibilities:

- Pengajuan izin/cuti/sakit.
- Approval workflow.
- Update status absensi jika approved.

Key Services:

- LeaveService.createRequest().
- LeaveService.approveRequest().
- LeaveService.rejectRequest().
- LeaveService.cancelRequest().

### Report Module

Responsibilities:

- Query laporan.
- Export CSV/Excel/PDF.
- Filter dan pagination.

---

# 11. RBAC Permission Matrix

| Permission Key | Superadmin | Admin HR | Supervisor | Karyawan |
|---|---:|---:|---:|---:|
| dashboard.global.view | ✅ | ❌ | ❌ | ❌ |
| dashboard.hr.view | ✅ | ✅ | ❌ | ❌ |
| dashboard.team.view | ✅ | ✅ | ✅ | ❌ |
| dashboard.self.view | ✅ | ✅ | ✅ | ✅ |
| employee.create | ✅ | ✅ | ❌ | ❌ |
| employee.update | ✅ | ✅ | ❌ | ❌ |
| employee.deactivate | ✅ | ✅ | ❌ | ❌ |
| work_location.manage | ✅ | ✅ | ❌ | ❌ |
| attendance.self.checkin | ✅ | ✅ | ✅ | ✅ |
| attendance.self.checkout | ✅ | ✅ | ✅ | ✅ |
| attendance.all.view | ✅ | ✅ | ❌ | ❌ |
| attendance.team.view | ✅ | ✅ | ✅ | ❌ |
| attendance.adjust | ✅ | ✅ | ❌ | ❌ |
| leave.self.create | ✅ | ✅ | ✅ | ✅ |
| leave.team.approve | ✅ | ✅ | ✅ | ❌ |
| kpi.template.manage | ✅ | ✅ | ❌ | ❌ |
| kpi.team.input | ✅ | ✅ | ✅ | ❌ |
| kpi.self.view | ✅ | ✅ | ✅ | ✅ |
| report.export | ✅ | ✅ | ❌ | ❌ |
| audit.view | ✅ | ❌ | ❌ | ❌ |
| system.settings.manage | ✅ | ❌ | ❌ | ❌ |

---

# 12. Attendance Technical Flow

## 12.1 Check-In Flow

```text
1. User klik Check In.
2. Frontend meminta permission GPS/location.
3. Frontend mengambil latitude, longitude, dan accuracy dari device.
4. Frontend meminta user mengambil selfie check-in.
5. Frontend mengirim payload ke backend.
6. Backend validasi user aktif.
7. Backend validasi employee aktif.
8. Backend cek attendance_date hari ini.
9. Jika sudah check-in, return error.
10. Backend ambil shift aktif.
11. Backend ambil work location aktif karyawan.
12. Backend hitung jarak user ke titik lokasi kerja.
13. Jika GPS tidak ada atau accuracy buruk, return error/pending.
14. Jika jarak melebihi radius, return error/pending sesuai konfigurasi.
15. Backend upload/simpan foto selfie.
16. Backend bandingkan current time dengan shift start + tolerance.
17. Tentukan status: hadir/terlambat.
18. Simpan attendance beserta latitude, longitude, accuracy, selfie URL, device info, dan method.
19. Buat audit log.
20. Return success.
```

## 12.2 Check-Out Flow

```text
1. User klik Check Out.
2. Frontend meminta permission GPS/location.
3. Frontend mengambil latitude, longitude, dan accuracy dari device.
4. Frontend meminta user mengambil selfie check-out.
5. Frontend mengirim payload ke backend.
6. Backend cari attendance hari ini.
7. Jika tidak ada check-in, return error.
8. Jika sudah check-out, return error.
9. Backend ambil work location aktif karyawan.
10. Backend hitung jarak user ke titik lokasi kerja.
11. Jika GPS tidak ada atau accuracy buruk, return error/pending.
12. Jika jarak melebihi radius, return error/pending sesuai konfigurasi.
13. Backend upload/simpan foto selfie check-out.
14. Hitung total work minutes.
15. Bandingkan checkout dengan shift end.
16. Tentukan early leave jika perlu.
17. Update attendance beserta checkout latitude, longitude, accuracy, selfie URL, dan device info.
18. Buat audit log.
19. Return success.
```

---

# 13. Security Design

## 13.1 Required Security Controls

1. Password hashing dengan bcrypt/argon2.
2. Rate limit login.
3. Validate all request payloads dengan Zod/class-validator.
4. Authorization check di backend.
5. Audit log untuk aksi penting.
6. File upload validation.
7. Prevent path traversal upload.
8. Secure cookies jika menggunakan cookie session.
9. CSRF protection jika pakai cookie auth.
10. Sanitasi output untuk mencegah XSS.
11. Database query via ORM/prepared statement.
12. Environment variable untuk secret.
13. Jangan commit .env ke repository.

## 13.2 GPS & Selfie Controls

1. Validasi geo-fence wajib di backend.
2. Jangan percaya validasi radius dari frontend.
3. Simpan latitude, longitude, accuracy, dan distance_meters.
4. Batasi GPS accuracy maksimal sesuai konfigurasi.
5. Simpan IP, user agent, dan device info.
6. Upload selfie harus validasi file type.
7. Maksimum ukuran selfie harus dibatasi.
8. Selfie URL tidak boleh public tanpa authorization.
9. Optional: face matching.
10. Optional: liveness detection.
11. Optional: anti-fake GPS detection.

## 13.3 Sensitive Actions

- Change role.
- Deactivate user.
- Manual attendance adjustment.
- KPI final approval/edit after approval.
- Export report.
- Delete/deactivate employee.
- Update work location.
- Override attendance outside radius.

Semua sensitive actions wajib masuk audit log.

---

# 14. Testing Plan

## 14.1 Unit Tests

- Attendance calculation.
- Geo distance calculation.
- Geo-fencing validation.
- GPS accuracy validation.
- KPI scoring.
- Permission check.
- Leave overlap validation.
- Shift time calculation.

## 14.2 Integration Tests

- Login flow.
- Check-in API with valid GPS + selfie.
- Check-in rejected outside radius.
- Check-in rejected without selfie.
- Check-out API with valid GPS + selfie.
- Employee CRUD.
- Work location CRUD.
- Leave approval flow.
- KPI submission flow.
- Report filter flow.

## 14.3 E2E Tests

- Karyawan login → check-in dengan GPS + selfie → check-out dengan GPS + selfie.
- Karyawan di luar radius → check-in ditolak.
- Karyawan ajukan izin → supervisor approve.
- Admin buat lokasi kerja → assign ke karyawan.
- Admin buat KPI template → assign → supervisor input nilai → karyawan lihat hasil.
- Superadmin buka dashboard dan export report.

## 14.4 Security Tests

- Karyawan mencoba akses dashboard superadmin harus ditolak.
- Supervisor mencoba melihat data divisi lain harus ditolak.
- User inactive tidak bisa login.
- Double check-in harus ditolak.
- Check-in tanpa GPS harus ditolak.
- Check-in tanpa selfie harus ditolak.
- Check-in di luar radius harus ditolak.
- Edit KPI approved tanpa permission harus ditolak.

---

# 15. Error Handling Standard

## 15.1 Response Format

```json
{
  "success": false,
  "error": {
    "code": "ATTENDANCE_OUTSIDE_RADIUS",
    "message": "Lokasi Anda berada di luar radius absensi yang diizinkan."
  }
}
```

## 15.2 Common Error Codes

- AUTH_INVALID_CREDENTIALS
- AUTH_USER_INACTIVE
- AUTH_FORBIDDEN
- EMPLOYEE_NOT_FOUND
- WORK_LOCATION_NOT_FOUND
- WORK_LOCATION_NOT_ASSIGNED
- GPS_PERMISSION_DENIED
- GPS_LOCATION_UNAVAILABLE
- GPS_ACCURACY_TOO_LOW
- ATTENDANCE_OUTSIDE_RADIUS
- ATTENDANCE_SELFIE_REQUIRED
- ATTENDANCE_ALREADY_CHECKED_IN
- ATTENDANCE_NOT_CHECKED_IN
- ATTENDANCE_ALREADY_CHECKED_OUT
- LEAVE_OVERLAP
- KPI_TEMPLATE_INVALID_WEIGHT
- KPI_RESULT_ALREADY_APPROVED
- REPORT_EXPORT_FAILED

---

# 16. Development Roadmap

## Phase 1 — Foundation

- Setup project.
- Setup database schema.
- Setup authentication.
- Setup RBAC.
- Setup dashboard layout.
- Employee CRUD.

## Phase 2 — Location & Attendance Core

- Work location CRUD.
- Assign location to employee.
- Shift management.
- GPS permission frontend.
- Selfie capture frontend.
- Check-in with geo-fencing.
- Check-out with geo-fencing.
- Attendance summary.
- Manual adjustment.

## Phase 3 — Leave Management

- Leave request.
- Approval workflow.
- Notification basic.
- Leave report.

## Phase 4 — KPI Core

- KPI template.
- KPI assignment.
- KPI input.
- KPI scoring.
- KPI dashboard.

## Phase 5 — Superadmin Dashboard & Reports

- Global dashboard.
- Charts.
- Filters.
- Export CSV/Excel/PDF.
- Audit log.

## Phase 6 — Hardening & Production

- Testing.
- Security audit.
- Performance optimization.
- Backup strategy.
- Deployment.
- Documentation final.

---

# 17. MVP Definition of Done

Project MVP dianggap selesai jika:

- Superadmin bisa login dan melihat dashboard global.
- Admin HR bisa mengelola karyawan.
- Admin HR bisa mengelola lokasi kerja untuk geo-fencing.
- Admin HR bisa mengelola shift.
- Karyawan bisa check-in dengan GPS + selfie.
- Karyawan bisa check-out dengan GPS + selfie.
- Sistem menolak absensi jika lokasi di luar radius.
- Sistem menolak absensi jika GPS tidak aktif.
- Sistem menolak absensi jika selfie tidak ada.
- Sistem menghitung telat dan jam kerja otomatis.
- Karyawan bisa mengajukan izin/cuti/sakit.
- Supervisor/Admin bisa approve/reject pengajuan.
- Admin bisa membuat template KPI.
- Supervisor bisa input KPI karyawan.
- Karyawan bisa melihat KPI pribadi.
- Superadmin bisa melihat laporan absensi dan KPI.
- Sistem memiliki audit log untuk aksi penting.
- Semua route penting memiliki role/permission guard.
- Data bisa diexport minimal CSV/Excel.
- Testing dasar untuk attendance, geo-fencing, KPI, dan RBAC sudah ada.

---

# 18. Prompt untuk AI Agent / Developer

Gunakan prompt ini agar AI agent/developer membangun project sesuai dokumen dan tidak keluar scope.

```text
You are a senior fullstack engineer. Build a secure, scalable web app for Produsen Dimsum Medan to manage employee attendance, KPI, leave requests, reports, and superadmin dashboard.

Source of truth:
- Follow PRD.md strictly.
- Do not change the core product scope without approval.
- MVP must include auth, RBAC, employee management, work location geo-fencing, GPS + selfie attendance, shift, leave request, KPI, dashboard, reports, and audit log.

Important attendance rules:
1. Check-in requires GPS location and selfie.
2. Check-out requires GPS location and selfie.
3. Attendance must validate user location against assigned work location radius.
4. Geo-fencing validation must happen in backend, not only frontend.
5. Store latitude, longitude, GPS accuracy, distance from work location, selfie URL, timestamp, device info, IP, and user agent.
6. Reject attendance if GPS is disabled, permission denied, selfie missing, or outside radius unless system config says pending approval.
7. All attendance override/manual adjustment must require reason and create audit log.

Engineering rules:
1. Use TypeScript.
2. Use strict validation.
3. Use clean architecture: UI, service, repository/db layer separated.
4. Backend authorization is mandatory for every protected action.
5. Do not delete historical employee, attendance, KPI, or leave data. Use soft delete/deactivate.
6. All sensitive actions must create audit logs.
7. Use safe database migration. Never reset production data.
8. Add tests for attendance logic, geo-fencing, KPI scoring, RBAC, and leave approval.
9. Keep UI simple, professional, responsive, and easy for non-technical staff.
10. Avoid unnecessary features before MVP is stable.

Before coding a module:
- Read related PRD.md section.
- Confirm data model impact.
- Implement backend first.
- Add validation.
- Add UI.
- Add tests.
- Update documentation.

Every implementation output must include:
- Changed files.
- What was added.
- How to test.
- Any migration needed.
- Any risk or limitation.
```

---

# 19. Open Questions for Finalization

1. Berapa jumlah karyawan saat ini?
2. Apakah lokasi kerja hanya satu atau ada beberapa cabang/lokasi produksi?
3. Berapa radius absensi yang diinginkan? Default rekomendasi: 100 meter.
4. Apakah absensi di luar radius langsung ditolak atau boleh pending approval?
5. Apakah karyawan menggunakan HP masing-masing?
6. Apakah semua karyawan memiliki akun login sendiri?
7. Apakah ada beberapa shift kerja?
8. Divisi apa saja yang ada di perusahaan?
9. KPI ingin dinilai harian, mingguan, atau bulanan?
10. Apakah laporan perlu PDF atau cukup Excel/CSV?
11. Apakah perlu notifikasi WhatsApp?
12. Apakah nanti perlu integrasi payroll/gaji?

---

# 20. Final Notes

Dokumen ini menjadi panduan utama untuk membangun web app management KPI dan kehadiran karyawan Produsen Dimsum Medan.

Semua perubahan scope wajib diperbarui di PRD.md terlebih dahulu sebelum implementasi agar project tidak ambigu dan tidak keluar arah.
