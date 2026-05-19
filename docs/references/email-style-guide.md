# MyProdusen Email UI — Style, Tone & Theme Guide

> **AI agent role source of truth:** MyProdusen production uses exactly two user-facing account roles: `SUPERADMIN` and `EMPLOYEE`. Legacy `ADMIN_HR` and `SUPERVISOR` references are historical only and must not be used for new UI/UX, docs, tests, or route access.


Dokumen ini adalah panduan resmi untuk menjaga konsistensi desain email MyProdusen saat AI agent / developer membuat template email seperti register, verifikasi email, lupa password, ubah password, notifikasi cuti, payroll, approval, pengumuman, dan email sistem lainnya.

Tujuan utama: semua email terlihat **clean, profesional, ramah, mudah dibaca, dan tetap sesuai brand MyProdusen**.

---

## 1. Brand Identity

**Product:** MyProdusen  
**Company:** Produsen Dimsum Medan  
**Group:** by TBM Group  
**Purpose:** Sistem internal HRIS dan operasional tim, bukan SaaS komersial.

Email harus terasa seperti komunikasi internal perusahaan yang:

- jelas
- aman
- hangat
- profesional
- memotivasi karyawan
- mudah dipahami
- tidak terlalu formal berlebihan
- tidak seperti promosi komersial

Tone utama:

```txt
Ramah, profesional, jelas, singkat, mendukung produktivitas tim.
```

---

## 2. Visual Direction

Desain email mengikuti style UI/UX MyProdusen:

- warna utama kuning MyProdusen
- putih sebagai background utama
- hitam untuk teks utama
- kartu rounded clean
- ikon sederhana dan konsisten
- ilustrasi ayam/chef/dimsum sebagai aksen ringan
- tidak ramai
- tidak terlalu banyak elemen dekoratif
- fokus ke pesan utama dan CTA

Email harus terlihat seperti sistem internal modern, bukan newsletter marketing.

---

## 3. Color Palette

Gunakan warna berikut secara konsisten.

```txt
Primary Yellow: #FFC107
Dark Black:     #111111
White:          #FFFFFF
Soft Cream:     #FFF9E6
Light Gray:     #F5F5F5
Border Gray:    #E5E7EB
Text Gray:      #6B7280
Success Green:  #22C55E
Error Red:      #EF4444
Info Blue:      #3B82F6
Warning Orange: #F59E0B
```

### Usage Rules

```txt
Primary Yellow:
- email header
- main CTA button
- highlight label
- icon background

Dark Black:
- main heading
- body heading
- CTA text when yellow button is used

Text Gray:
- paragraph
- metadata
- footer text

Soft Cream:
- email body background
- notice box
- subtle card background

Success Green:
- verification success
- approved status
- password changed success

Error Red:
- rejected status
- warning destructive action

Info Blue:
- neutral information
- account assigned
- system notice

Warning Orange:
- pending status
- reminder
- token expiry notice
```

---

## 4. Typography

Preferred font:

```txt
Poppins
```

Fallback:

```txt
Arial, Helvetica, sans-serif
```

### Font Scale

```txt
Email Title:        24px / Bold
Section Heading:    18px / Semibold
Body Text:          14px / Regular
Small Text:         12px / Regular
Footer Text:        11px / Regular
Button Text:        14px / Semibold
```

### Typography Rules

- Gunakan heading pendek.
- Jangan pakai paragraf panjang.
- Maksimal 2–3 kalimat per paragraf.
- Gunakan bullet list hanya jika benar-benar membantu.
- Jaga line-height sekitar `1.5` sampai `1.7`.
- Hindari teks terlalu kecil di mobile.

---

## 5. Email Layout Standard

Semua email harus memakai struktur ini:

```txt
1. Outer Background
2. Email Container
3. Header
4. Hero / Main Message
5. Content Card
6. CTA Button
7. Info / Warning Box if needed
8. Footer
```

### Recommended Width

```txt
Desktop email container: max-width 600px
Mobile email container: width 100%
Padding desktop: 32px
Padding mobile: 20px
```

### Border Radius

```txt
Main card: 20px
Small card: 14px
Button: 12px
Badge: 999px
```

### Shadow

Use subtle shadow only:

```css
box-shadow: 0 8px 24px rgba(17, 17, 17, 0.08);
```

Do not use heavy dark shadow.

---

## 6. Header Style

Header harus sederhana dan konsisten.

### Header Content

```txt
Logo MyProdusen
Subtitle kecil: Produsen Dimsum Medan
Optional badge: by TBM Group
```

### Header Design

```txt
Background: #FFC107
Text: #111111
Logo aligned left
Height: compact, not too tall
Rounded top corners if inside card
```

### Header Example Copy

```txt
MyProdusen
Produsen Dimsum Medan
```

Optional small label:

```txt
by TBM Group
```

---

## 7. Footer Style

Footer harus muncul di semua email.

### Footer Content

```txt
MyProdusen
Sistem internal perusahaan by TBM Group
Produsen Dimsum Medan
Medan, Sumatera Utara

Email ini bersifat internal. Mohon tidak membagikan informasi ini kepada pihak lain.
```

### Footer Visual

```txt
Background: #FFF9E6 or #FFFFFF
Text color: #6B7280
Small logo left/top
Small dimsum pattern optional with very low opacity
```

### Footer Rules

- Jangan terlihat seperti email marketing.
- Jangan tampilkan pricing, promo, atau demo komersial.
- Sertakan disclaimer internal.
- Jangan terlalu panjang.

---

## 8. Button / CTA Style

### Primary Button

```txt
Background: #FFC107
Text: #111111
Radius: 12px
Height: 48px minimum
Font: 14px Semibold
```

Example CTA:

```txt
Verifikasi Email
Reset Kata Sandi
Masuk ke Sistem
Buka MyProdusen
Lihat Pengajuan
```

### Secondary Button

```txt
Background: #FFFFFF
Border: 1px solid #E5E7EB
Text: #111111
Radius: 12px
```

### Button Rules

- Gunakan 1 CTA utama per email.
- Jangan terlalu banyak tombol.
- CTA harus jelas dan langsung.
- Tombol harus mobile-friendly.

---

## 9. Icon & Illustration Style

Gunakan ikon sederhana dengan warna brand.

### Allowed Icon Themes

```txt
Email / envelope
Lock / security
Shield / verification
Bell / notification
Check circle / success
Warning triangle / attention
Calendar / attendance
Wallet / payroll
User / account
Clipboard / approval
Chef / production KPI
Dimsum pack / production
```

### Illustration Rules

- Ilustrasi boleh digunakan, tetapi jangan terlalu besar.
- Gunakan ayam MyProdusen atau chef cartoon sebagai aksen.
- Hindari ilustrasi terlalu ramai.
- Jangan pakai foto realistis dalam email template sistem.
- Gunakan gaya flat/vector clean.

---

## 10. Email Types & Tone

### A. Register / Welcome Email

Purpose: menyambut user setelah daftar.

Tone:

```txt
Ramah, menyambut, informatif.
```

Subject examples:

```txt
Selamat Datang di MyProdusen 👋
Akun MyProdusen Anda Berhasil Dibuat
```

Main heading:

```txt
Selamat Datang di MyProdusen! 👋
```

Body direction:

```txt
Halo, {name}.
Terima kasih telah mendaftar di MyProdusen. Akun Anda berhasil dibuat dan sedang menunggu proses verifikasi/penempatan oleh Super Admin.
```

CTA:

```txt
Verifikasi Email
```

Important note:

```txt
Setelah email diverifikasi, Super Admin akan menentukan role, cabang, departemen, dan data karyawan Anda.
```

---

### B. Email Verification

Purpose: user memverifikasi email sendiri.

Tone:

```txt
Jelas, aman, langsung.
```

Subject examples:

```txt
Verifikasi Email MyProdusen Anda
Konfirmasi Email untuk Mengaktifkan Akun
```

Heading:

```txt
Verifikasi Email Anda
```

CTA:

```txt
Verifikasi Email
```

Security note:

```txt
Tombol ini akan kedaluwarsa dalam 24 jam demi keamanan akun Anda.
```

---

### C. Waiting Assignment Email

Purpose: email sudah verified, menunggu Super Admin menempatkan role/cabang/departemen/NIP.

Subject examples:

```txt
Akun Anda Menunggu Penempatan
MyProdusen: Akun Sedang Diproses Admin
```

Heading:

```txt
Akun Anda Sedang Diproses
```

Body:

```txt
Email Anda sudah berhasil diverifikasi. Saat ini akun Anda sedang menunggu penempatan role, cabang, departemen, dan data karyawan oleh Super Admin.
```

CTA:

```txt
Masuk ke Sistem
```

Note:

```txt
Jika data belum lengkap, hubungi HR/Admin internal.
```

---

### D. Account Activated Email

Purpose: Super Admin sudah assign role/cabang/departemen.

Subject examples:

```txt
Akun MyProdusen Anda Sudah Aktif
Role dan Data Karyawan Anda Telah Ditetapkan
```

Heading:

```txt
Akun Anda Sudah Aktif ✅
```

Body:

```txt
Akun Anda telah diaktifkan dan sudah dapat digunakan sesuai role yang ditentukan oleh Super Admin.
```

Show simple info card:

```txt
Role: {role}
Cabang: {branch}
Departemen: {department}
NIP/NIK: {employeeNumber}
```

CTA:

```txt
Masuk ke MyProdusen
```

---

### E. Forgot Password Email

Purpose: reset password.

Subject examples:

```txt
Reset Kata Sandi MyProdusen
Permintaan Lupa Password
```

Heading:

```txt
Reset Kata Sandi
```

Body:

```txt
Kami menerima permintaan untuk mereset kata sandi akun MyProdusen Anda. Klik tombol di bawah ini untuk membuat kata sandi baru.
```

CTA:

```txt
Reset Kata Sandi
```

Security note:

```txt
Link ini akan kedaluwarsa dalam 30 menit. Jika Anda tidak meminta reset password, abaikan email ini.
```

---

### F. Password Changed Email

Purpose: konfirmasi password berhasil diubah.

Subject examples:

```txt
Kata Sandi Berhasil Diubah
Keamanan Akun MyProdusen
```

Heading:

```txt
Kata Sandi Berhasil Diubah ✅
```

Body:

```txt
Kata sandi akun MyProdusen Anda berhasil diubah.
```

Info card:

```txt
Tanggal: {date}
Waktu: {time}
Perangkat: {device}
Lokasi: {location}
```

CTA:

```txt
Masuk ke Sistem
```

Warning note:

```txt
Jika Anda tidak melakukan perubahan ini, segera hubungi Super Admin atau HR.
```

---

### G. General Notification Email

Purpose: pusat notifikasi seperti cuti, payroll, pengumuman, approval.

Subject examples:

```txt
Notifikasi Baru dari MyProdusen
Update Penting untuk Anda
```

Heading:

```txt
Pusat Notifikasi Anda
```

Notification item format:

```txt
Status icon
Title
Short description
Date/time
Action arrow optional
```

Examples:

```txt
Cuti Disetujui
Pengajuan cuti Anda telah disetujui oleh atasan.

Cuti Ditolak
Pengajuan cuti Anda ditolak. Silakan cek alasan penolakan.

Payroll Tersedia
Slip gaji bulan ini sudah tersedia.

Pengumuman Baru
Ada pengumuman baru dari manajemen.

Pengingat Kehadiran
Jangan lupa check-in sebelum jam kerja.
```

CTA:

```txt
Buka MyProdusen
```

---

### H. Leader KPI Production Email

Purpose: notifikasi KPI produksi untuk Leader atau Employee.

Subject examples:

```txt
Update KPI Produksi Hari Ini
Target Produksi Dimsum Anda
```

For Leader:

```txt
Halo, {leaderName}.
Jangan lupa input hasil produksi anggota tim hari ini agar data KPI tetap akurat dan transparan.
```

For Employee:

```txt
Halo, {employeeName}.
Hasil produksi Anda hari ini sudah diperbarui oleh Leader. Silakan cek target dan capaian Anda di MyProdusen.
```

CTA:

```txt
Lihat KPI Produksi
```

---

## 11. Email Component Rules

AI agent harus menggunakan komponen email yang konsisten.

Recommended components:

```txt
EmailLayout
EmailHeader
EmailFooter
EmailButton
EmailInfoBox
EmailWarningBox
EmailSuccessBox
EmailNotificationItem
EmailMetadataRow
EmailDivider
```

### Component Responsibility

```txt
EmailLayout:
- wrapper utama
- background
- container width
- padding

EmailHeader:
- logo
- brand name
- yellow header

EmailFooter:
- internal disclaimer
- company info

EmailButton:
- CTA reusable

EmailInfoBox:
- note, waiting assignment, instruction

EmailWarningBox:
- security warning, expiry notice

EmailSuccessBox:
- success confirmation

EmailNotificationItem:
- notification list item
```

---

## 12. Layout Template Example

Gunakan pola ini untuk semua email.

```html
<body style="margin:0;background:#FFF9E6;font-family:Poppins,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 8px 24px rgba(17,17,17,0.08);">
          <!-- Header -->
          <!-- Content -->
          <!-- Footer -->
        </table>
      </td>
    </tr>
  </table>
</body>
```

Important:

- Gunakan table-based layout untuk kompatibilitas email client.
- Jangan bergantung pada CSS modern yang tidak support di email client.
- Inline style untuk email HTML.
- Jangan gunakan JavaScript.
- Jangan gunakan external font yang wajib agar email tetap aman.

---

## 13. Mobile Responsiveness

Email harus tetap bagus di Gmail mobile, Apple Mail, Outlook mobile.

Rules:

```txt
- Container max-width 600px, width 100%.
- Padding mobile minimal 16px.
- Button full-width di mobile.
- Jangan pakai grid kompleks.
- Gunakan single-column layout.
- Gambar maksimal width 100%.
- Jangan pakai teks kecil di bawah 12px.
```

---

## 14. Accessibility

Wajib:

```txt
- Alt text untuk logo dan ilustrasi.
- Heading jelas.
- CTA jelas.
- Contrast cukup.
- Jangan hanya mengandalkan warna untuk status.
- Link fallback ditampilkan jika CTA tidak bisa diklik.
```

Fallback link example:

```txt
Jika tombol tidak dapat diklik, salin tautan berikut ke browser Anda:
{url}
```

---

## 15. Security Rules

Untuk email terkait auth/security:

```txt
- Jangan tampilkan password.
- Jangan tampilkan token mentah jika tidak perlu.
- Reset token harus expired.
- Verification token harus expired.
- Link harus menggunakan APP_URL production.
- Jangan expose RESEND_API_KEY ke frontend.
- Semua email dikirim dari backend/server only.
```

Security copy examples:

```txt
Jika Anda tidak merasa melakukan tindakan ini, abaikan email ini atau hubungi HR/Admin.
```

```txt
Demi keamanan, tautan ini hanya berlaku untuk waktu terbatas.
```

---

## 16. Resend Implementation Standard

Environment variables:

```env
RESEND_API_KEY=
RESEND_FROM_EMAIL=
APP_URL=
```

Recommended sender format:

```txt
MyProdusen <no-reply@yourdomain.com>
```

Email sending rules:

```txt
- Send only from backend/server action/API route.
- Store email status if email_logs table exists.
- Retry only for safe transactional email.
- Never block critical DB transaction only because email failed, unless email verification requires it.
- Log failure safely.
```

Recommended email log table:

```txt
email_logs
- id
- user_id
- email_to
- subject
- type
- status
- resend_message_id
- error_message
- created_at
```

Email types:

```txt
register_welcome
email_verification
waiting_assignment
account_activated
forgot_password
password_changed
leave_notification
payroll_notification
announcement_notification
kpi_production_notification
```

---

## 17. Status Badge Style

Use clear text + color.

```txt
Disetujui:
Background #DCFCE7
Text #15803D

Ditolak:
Background #FEE2E2
Text #B91C1C

Menunggu:
Background #FEF3C7
Text #B45309

Info:
Background #DBEAFE
Text #1D4ED8

Baru:
Background #EDE9FE
Text #6D28D9
```

---

## 18. Copywriting Rules

Use Bahasa Indonesia.

### Use These Words

```txt
Halo
Terima kasih
Silakan
Akun Anda
Sistem internal
Tim MyProdusen
HR/Admin
Super Admin
Karyawan
Leader
KPI Produksi
Slip Gaji
Cuti
Absensi
```

### Avoid These Words

```txt
Beli sekarang
Harga
Diskon
Upgrade paket
Trial
Coba demo
SaaS komersial
Customer
Client
Marketing blast
```

This is an internal company system, not a public commercial product.

---

## 19. Email Subject Guidelines

Good subject must be:

```txt
- short
- clear
- action-oriented
- not spammy
- not too many emoji
```

Use max 1 emoji if helpful.

Examples:

```txt
Verifikasi Email MyProdusen Anda
Reset Kata Sandi MyProdusen
Akun Anda Sudah Aktif ✅
Notifikasi Baru dari MyProdusen
Slip Gaji Anda Sudah Tersedia
Update KPI Produksi Hari Ini
```

Avoid:

```txt
PROMO!!!
URGENT!!! KLIK SEKARANG!!!
Diskon Akun HRIS
Demo Gratis
```

---

## 20. Template Checklist for AI Agent

Before finalizing any email template, check:

```txt
[ ] Uses MyProdusen header
[ ] Uses correct yellow/black/white theme
[ ] Has clear heading
[ ] Has short body copy
[ ] Has one main CTA
[ ] Has security/internal note if needed
[ ] Has footer with internal disclaimer
[ ] Mobile responsive
[ ] Uses inline style/table layout if HTML email
[ ] No broken image
[ ] No commercial SaaS copy
[ ] No exposed token/secret
[ ] Resend send function runs from backend only
[ ] Email subject is clean
[ ] Text fallback exists if needed
```

---

## 21. Final Design Principle

All MyProdusen emails must follow this principle:

```txt
Satu sistem, banyak manfaat.
Komunikasi internal lebih cepat, aman, jelas, dan terhubung.
```

Every email should help the user understand:

```txt
Apa yang terjadi?
Apa yang harus dilakukan?
Apakah akun/data saya aman?
Ke mana saya harus klik?
Siapa yang harus dihubungi jika ada masalah?
```

---

## 22. Example Email Footer Copy

```txt
MyProdusen
Sistem internal perusahaan by TBM Group
Produsen Dimsum Medan
Medan, Sumatera Utara

Email ini dikirim otomatis oleh sistem MyProdusen.
Mohon tidak membalas email ini secara langsung.
Jika membutuhkan bantuan, hubungi HR/Admin internal.

© 2026 Produsen Dimsum Medan by TBM Group. Internal system. Tidak untuk komersial.
```

---

## 23. Final Instruction for AI Execution

When generating or updating MyProdusen email templates:

```txt
Use this README as the source of truth for style, tone, theme, layout, and copywriting.
Do not create random email styles.
Do not use commercial SaaS language.
Keep every template clean, professional, friendly, and consistent with MyProdusen yellow/black/white brand.
```
