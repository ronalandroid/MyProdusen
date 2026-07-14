# Panduan Daftar & Penggunaan MyProdusen

Deck tutorial untuk karyawan Produsen Dimsum Medan — 23 halaman, semua gambar
adalah tangkapan layar asli dari aplikasi yang berjalan.

| | |
|---|---|
| **PDF siap bagikan** | `MyProdusen-Panduan-Penggunaan.pdf` |
| **Canva (bisa diedit)** | [edit](https://www.canva.com/d/P-s80oyHgNia9_L) · [lihat](https://www.canva.com/d/hWBCSNRq9rIGTwi) |
| **Sumber** | `deck-src/` (HTML + CSS, di-render Playwright) |

## Isi

| Bagian | Halaman | Isi |
|---|---|---|
| 1 · Daftar Akun | 3–7 | Buka aplikasi, isi formulir, akun langsung aktif, masuk |
| 2 · Absensi | 8–12 | Beranda beranotasi, absen 2 langkah, koreksi manual, riwayat |
| 3 · Cuti, KPI & Gaji | 13–17 | Ajukan cuti, saldo & hari libur, KPI, slip gaji, aduan gaji |
| 4 · Akun & Bantuan | 18–23 | Notifikasi, aktivitas akun, profil, verifikasi Superadmin, tanya-jawab, referensi cepat |

## Membangun ulang PDF-nya

Dari root repo:

```bash
node docs/tutorial-assets/deck-src/prep-fonts.mjs   # sekali saja — unduh Poppins + JetBrains Mono
node docs/tutorial-assets/deck-src/build.mjs        # tulis ulang PDF-nya
```

Ubah isinya di `deck-src/slides-a.html` (halaman 1–10) dan `deck-src/slides-b.html`
(halaman 11–23); gaya visual ada di `deck-src/style.css`.

## Mengganti tangkapan layar

Simpan PNG baru di folder ini dengan nama yang sama, lalu jalankan `build.mjs`
lagi (skrip menyalin sendiri `*.png` ke `deck-src/shots/`).

Saat memotret ulang dari aplikasi:

- **HP:** viewport 390×844 @2x → hasilnya 780×1688. Rasio ini pas untuk bingkai
  HP di deck. **Jangan pakai `fullPage`** — halaman panjang jadi terlalu kecil
  untuk dibaca; gulir ke bagian yang ingin ditonjolkan lalu potret viewport-nya.
- **Konsol admin:** viewport 1440×900 @2x → bingkai laptop.
- **Peta geofence & selfie** hanya ter-render kalau kamera dan GPS dipalsukan:
  jalankan Chromium dengan `--use-fake-device-for-media-stream` dan
  `--use-fake-ui-for-media-stream`, lalu beri context `permissions: ['geolocation',
  'camera']` + `geolocation` di dalam radius lokasi kerja.
- Sembunyikan badge dev Next.js sebelum memotret:
  `nextjs-portal, [data-nextjs-dev-tools-button], [data-next-badge] { display: none }`.

## Mengimpor ulang ke Canva

Impor lewat URL raw GitHub yang **dipatok ke commit SHA** (bukan nama branch —
raw.githubusercontent men-cache 300 detik dan Canva mengabaikan query param):

```
https://raw.githubusercontent.com/<owner>/<repo>/<commit-sha>/docs/tutorial-assets/MyProdusen-Panduan-Penggunaan.pdf
```

Catatan: **jangan pakai CSS gradient** di deck — Canva mengonversinya jadi kotak
hitam saat impor. Warna solid saja.
