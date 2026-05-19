# Performance — MyProdusen

> **AI agent role source of truth:** MyProdusen production uses exactly two user-facing account roles: `SUPERADMIN` and `EMPLOYEE`. Legacy `ADMIN_HR` and `SUPERVISOR` references are historical only and must not be used for new UI/UX, docs, tests, or route access.


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

## UI Performance Audit — 2026-05-19

- Global smooth scrolling disabled to avoid perceived delay during dashboard navigation and scroll reset.
- PWA install prompt remains non-blocking and constrained to viewport on narrow/high-zoom screens.
- Attendance camera cleanup is regression-tested so camera streams do not keep running after close/unmount/disabled state.
- Public landing remains static and has no database call.

## PWA Performance Fix — 2026-05-19

- Service worker registration is production-only and avoids duplicate registration by checking existing scope.
- `public/sw.js` has no fetch listener, so it does not add navigation/request overhead and cannot cache private HR data by accident.
- PWA install prompt keeps one `beforeinstallprompt` listener, cleans listeners on unmount, and does not block login or attendance.

## Performance Patch Note — UI Layout Stability

- Buttons now avoid clipped nowrap labels that caused overflow and layout shift at mobile/high zoom widths.
- Modal footers use responsive wrapping instead of tight fixed rows, reducing overflow and scroll lock confusion.
- Attendance page keeps camera lazy-loaded and shows readiness state without adding extra fetch loops.
- No new database reads were added to public pages or report/attendance UI layout fixes.

## UI Performance Patch — 2026-05-19

- Button, input, and pagination fixes use CSS/layout guards only; no new API calls or DB reads.
- Selfie mirror uses canvas transform during existing capture path and does not add extra camera streams.
- Existing camera stream cleanup remains required on unmount and disabled state changes.
