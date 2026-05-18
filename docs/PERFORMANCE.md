# Performance — MyProdusen

Dokumen ini menjadi checklist performa produksi untuk MyProdusen. Ikuti PRD dan jangan mengorbankan keamanan/RBAC demi cache atau optimasi.

## Prinsip

- Landing page harus cepat dan tidak melakukan query database.
- Data privat tidak boleh di-cache publik.
- Export/report harus punya batas baris.
- Selfie hanya dimuat saat user membuka protected viewer.
- Search/filter besar harus debounce dan/atau pagination.
- Query dashboard/report harus memakai index yang sudah tersedia.

## Frontend

- Gunakan mobile-first layout untuk 360px, 390px, 768px, 1024px, dan 1440px.
- Hindari horizontal overflow.
- Gunakan loading, empty, error, dan success state.
- Lazy load fitur berat seperti selfie viewer, charts, dan PDF preview jika ditambahkan.
- Kompres selfie di client maksimal 720x720, WebP, quality 0.75, target sekitar 300KB.
- Tetap validasi ukuran/MIME di backend; kompresi client hanya bantuan UX.

## Backend

- Semua API privat wajib auth dan RBAC server-side.
- Gunakan pagination untuk daftar besar.
- Gunakan row caps:
  - `ATTENDANCE_EXPORT_MAX_ROWS=5000`
  - `PDF_REPORT_MAX_ROWS=1000`
  - `PDF_REPORT_MAX_DATE_RANGE_MONTHS=12`
- Gunakan `Cache-Control: no-store` untuk PDF, payroll, selfie, health, dan response sensitif.
- Jangan menyertakan selfie path/url/binary dalam report/PDF/export.

## Database

Index penting wajib tersedia untuk user, employee, attendance, KPI, payroll, audit log, dan report filters. Tambahkan hanya migration aman/aditif. Jangan reset database produksi.

## Monitoring Manual

- Cek `/api/health` setelah deploy.
- Cek halaman landing, login, dashboard, attendance, payroll, reports.
- Cek Coolify logs untuk error berulang.
- Cek PostgreSQL logs untuk koneksi/query lambat.
- Jalankan `npm run perf:explain` di staging jika tersedia dan database sudah berisi data representatif.

## Release Gate

- `npm run release:check` harus pass.
- Smoke test real device wajib untuk GPS + selfie.
- Backup/restore drill staging wajib sebelum go-live besar.

## Production Navigation Performance Update — 2026-05-19

- Dashboard layout should not refetch profile on every internal route change; reuse current session profile unless the session fails.
- Heavy mobile-only features such as realtime selfie camera should be lazy-loaded client-side.
- Main dashboard content should avoid nested scroll containers on mobile/webview; let the document scroll and keep bottom nav fixed.
- PWA service worker is install-only and intentionally avoids caching private HRIS data.
- Route-level loading skeletons should be lightweight and avoid heavy charts/camera/PDF work during navigation.
