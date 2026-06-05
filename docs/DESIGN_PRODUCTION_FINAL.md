# DESIGN.md — MyProdusen HRIS · Production Final
## PT Tcipta Buana Mandiri · Full Visual Specification

**Version:** FINAL 5.0.0 · 2026-06-04
**Benchmark:** Mekari Talenta UX patterns · GreatDay HR mobile-first
**Scope:** All screens · All 3 roles · All components · Tokens · Motion

---

## 1. Design Philosophy

```
BRAND SOUL:
  "Lebih baik dari Talenta untuk produsen dimsum Indonesia"
  Warm · Professional · Fast · Trustworthy · Factory-operational

AGAINST TALENTA'S WEAKNESS:
  ✅ Clock In/Out = ABOVE FOLD (Talenta buries it)
  ✅ Skeleton screens, not blank loads (Talenta has blank states)
  ✅ Skor visible immediately on Beranda (Talenta hides performance)
  ✅ Offline-first (Talenta errors during maintenance)
  ✅ Gamification = factory worker motivation (Talenta has none)

VISUAL LANGUAGE:
  Warm yellow/gold = TBM brand identity
  Red CTA = urgent factory action (Clock In = NOW)
  Clean cards = professional, not cluttered
  Big numbers = easy to read at a glance from distance
  Indonesian language = comfort, familiarity
```

---

## 2. Complete Color System

```css
@import "tailwindcss";

@theme {
  /* ═══ PRIMARY BRAND ═══ */
  --color-brand-400: #FFD166;
  --color-brand-500: #F5A623;
  --color-brand-600: #E6920A;
  --color-brand-700: #C67A00;
  --color-brand-900: #7B4D00;
  --color-brand-50:  #FFFBF0;

  /* ═══ ACTION (Clock In) ═══ */
  --color-action:        #C62828;
  --color-action-hover:  #B71C1C;
  --color-action-pressed:#A31515;
  --color-action-light:  #FFEBEE;

  /* ═══ SHIFT CARD ═══ */
  --shift-gradient: linear-gradient(135deg, #F5A623 0%, #FFD166 100%);

  /* ═══ SCORE TIERS ═══ */
  --score-100-ring:  #4CAF50; --score-100-bg: #E8F5E9; --score-100-text: #1B5E20;
  --score-90-ring:   #43A047; --score-90-bg:  #E8F5E9; --score-90-text: #2E7D32;
  --score-75-ring:   #2196F3; --score-75-bg:  #E3F2FD; --score-75-text: #1565C0;
  --score-50-ring:   #FF9800; --score-50-bg:  #FFF3E0; --score-50-text: #E65100;
  --score-low-ring:  #F44336; --score-low-bg: #FFEBEE; --score-low-text: #B71C1C;

  /* ═══ ATTENDANCE STATUS ═══ */
  --att-ontime:  bg #E8F5E9 text #2E7D32;
  --att-late:    bg #FFF3E0 text #E65100;
  --att-absent:  bg #FFEBEE text #C62828;
  --att-leave:   bg #E8EAF6 text #3949AB;
  --att-sick:    bg #FFF8E1 text #F57C00;
  --att-holiday: bg #FFF3C4 text #C67A00;
  --att-pending: bg #F5F5F5 text #9E9E9E;

  /* ═══ KPI PERFORMANCE ═══ */
  --kpi-above:  #2E7D32;
  --kpi-on:     #1565C0;
  --kpi-below:  #C62828;
  --kpi-star:   #F5A623;
  --kpi-empty:  #E5E5E5;

  /* ═══ LIVENESS ═══ */
  --liveness-searching: rgba(255,255,255,0.6);
  --liveness-detected:  rgba(76,175,80,0.8);
  --liveness-passed:    #4CAF50;
  --liveness-failed:    #F44336;

  /* ═══ SURFACE ═══ */
  --color-page:     #FAFAF7;
  --color-card:     #FFFFFF;
  --color-input:    #F8F8F6;
  --color-border:   #E5E5E5;
  --color-divider:  #F0F0EC;
  --color-overlay:  rgba(0,0,0,0.38);
  --color-offline:  #FF9800;

  /* ═══ TEXT ═══ */
  --color-text-1: #1A1A1A;
  --color-text-2: #6B6B6B;
  --color-text-3: #9E9E9E;

  /* ═══ SEMANTIC ═══ */
  --color-success: #2E7D32;
  --color-warning: #F57C00;
  --color-error:   #C62828;
  --color-info:    #1565C0;
  --color-online:  #43A047;

  /* ═══ ADMIN SIDEBAR ═══ */
  --sidebar-bg:      #1A1A1A;
  --sidebar-text:    #E0E0E0;
  --sidebar-active:  #F5A623;
  --sidebar-hover:   rgba(255,255,255,0.08);

  /* ═══ FONTS ═══ */
  --font-display: "Plus Jakarta Sans", sans-serif;
  --font-body:    "Inter", sans-serif;
  --font-mono:    "JetBrains Mono", monospace;

  /* ═══ RADII ═══ */
  --r-xs:   0.25rem;  --r-sm:  0.5rem;  --r-md:  0.75rem;
  --r-lg:   1rem;     --r-xl:  1.25rem; --r-2xl: 1.5rem;
  --r-full: 9999px;

  /* ═══ SHADOWS ═══ */
  --shadow-card:   0 2px 12px rgba(0,0,0,0.08);
  --shadow-modal:  0 8px 32px rgba(0,0,0,0.16);
  --shadow-bottom: 0 -2px 12px rgba(0,0,0,0.06);
  --shadow-fab:    0 4px 16px rgba(0,0,0,0.18);
  --shadow-score:  0 4px 24px rgba(0,0,0,0.12);
}
```

---

## 3. Typography

```
FONTS:
  Plus Jakarta Sans — headings, labels, badges, CTA
  Inter            — body, data, form, tables
  JetBrains Mono   — clock, score, KPI numbers, codes

TYPE SCALE:
  xs:    11px / 1.4  — badge label, char counter
  sm:    12px / 1.5  — caption, meta, footer
  base:  14px / 1.6  — body text
  md:    16px / 1.5  — subheading
  lg:    18px / 1.4  — card title
  xl:    20px / 1.3  — section title
  2xl:   24px / 1.2  — dashboard metric
  3xl:   32px / 1.0  — score on beranda mini card
  score: 64px / 1.0  — score page main gauge
  clock: 48px / 1.0  — realtime clock

NAMED STYLES:
  greeting:       PJS 16px 700 #1A1A1A
  shift-name:     PJS 22px 700 #1A1A1A
  shift-time:     JB Mono 13px 500 #5C3C00
  score-number:   JB Mono 64px 700 (tier color)
  score-tier:     PJS 16px 700 (tier color)
  raise-pct:      JB Mono 24px 700 #2E7D32
  clock-time:     JB Mono 48px 700 #1A1A1A
  step-sub:       PJS 12px 700 #F5A623
  kpi-value:      JB Mono 14px 600 #1A1A1A
  table-header:   PJS 11px 700 uppercase letter-spacing 0.05em
  event-delta+:   JB Mono 13px 700 #2E7D32
  event-delta-:   JB Mono 13px 700 #C62828
  badge:          PJS 11px 700 padding 3px 8px radius-full
  disclaimer:     Inter 10px 400 italic #9E9E9E
```

---

## 4. Spacing & Grid

```
BASE: 4px grid

--sp-1:4px --sp-2:8px --sp-3:12px --sp-4:16px --sp-5:20px
--sp-6:24px --sp-8:32px --sp-10:40px --sp-12:48px

PAGE MOBILE (390px):
  padding-x:      16px
  content-width:  358px
  bottom-padding: 68px (60px tab + 8px)

PAGE ADMIN DESKTOP:
  sidebar:        240px fixed
  content:        max-width 1200px
  content-padding: 32px
  grid:           4 col metrics · 2 col charts
```

---

## 5. Complete Component Library

### 5.1 Button Variants

```
PRIMARY:   bg #C62828 · text white 700 15px · h:52px · r:12px
           hover: #B71C1C + translateY(-1px) · active: scale(0.98)
           disabled: opacity 0.4

OUTLINE:   border 1.5px #C62828 · text #C62828 · bg transparent
           hover: rgba(198,40,40,0.05)

BRAND:     bg #F5A623 · text white · h:52px (for secondary actions)

TEXT LINK: color #C62828 · weight 600 · min-h:44px
           Used for: "Kembali", "Lihat Semua", navigation links

ICON BUTTONS:
  Shift card calendar:  36px circle rgba(255,255,255,0.28) icon white
  FAB re-center:        40px circle bg white shadow-fab icon #6B6B6B
  Flash off/on:         40px circle bg rgba(0,0,0,0.30) icon white/yellow
  Capture selfie:       56px circle bg white shadow-fab icon #374151
  Retake:               pill outline white rgba(255,255,255,0.6)

LOADING STATE (primary):
  Inline spinner 16px white + "Mengirim..." / "Memuat..."
  Width stays the same (no layout shift)
```

### 5.2 Shift Card

```
background: var(--shift-gradient)
border-radius: 20px · padding: 20px · margin: 0 16px

TOP ROW:
  Badge "Shift Aktif": rgba(0,0,0,0.12) bg · #7B4D00 text · 11px 700
  Calendar button: 36px circle rgba(255,255,255,0.28)

CONTENT:
  Name: 22px 700 #1A1A1A · mt:6px
  Date: 13px 500 #5C3C00 · mt:4px (DD MMM YYYY (Hari))
  Time: JBMono 13px #5C3C00 · "⏰ HH:MM - HH:MM"

BUTTONS (mt:16px, gap:6px):
  Clock In:  flex:1 · bg #C62828 · white · h:44px · r:12px · LogIn icon
  Clock Out: flex:1 · bg white · border rgba(0,0,0,0.12) · h:44px

CAROUSEL DOTS: 8px active #F5A623 · 6px inactive rgba(0,0,0,0.15)
               centered below card · gap 6px · mt:8px

STATES:
  No CI: CI enabled · CO disabled(0.4)
  CI done: CI disabled(0.4) · CO enabled
  Both done: text "Absensi selesai ✓" · buttons hidden
  No shift: empty state + mascot (120px)
```

### 5.3 Score Mini Card (NEW — Beranda)

```
Position: Below shift card · margin-top: 12px
bg white · shadow-card · r:16px · padding:16px
display: flex · justify-between · align-items: center

LEFT:
  "Skor Bulan Ini" — 12px 500 #6B6B6B
  [87] — JBMono 32px 700 tier-color
  "Proyeksi: 8.7% kenaikan" — 11px 400 #9E9E9E

CENTER:
  Mini SVG arc 60px · tier-color stroke

RIGHT:
  Tier badge: "Baik" (score badge style)
  "Detail →" link: 12px 600 #C62828
```

### 5.4 KPI Highlight Card (NEW — Beranda)

```
bg #FAFAF7 · border 1px #E5E5E5 · r:12px · padding:12px
Header: "🎯 KPI Minggu Ini" — 13px 700
Progress: "Cetakan: 980 / 1000 pcs" + bar (amber fill, height:6px)
Behavior: "Perilaku: 4.2 / 5.0 ★" + mini stars
Footer: "Input oleh [Leader]" — 11px #9E9E9E
```

### 5.5 Liveness Overlay (NEW)

```
Positioned ON TOP of oval camera overlay:

FACE SEARCHING STATE:
  Oval border: dashed rgba(255,255,255,0.6) 2px
  Text: "Pastikan wajah terlihat jelas..."
  Color: white/60

FACE DETECTED STATE:
  Oval border: solid rgba(76,175,80,0.8) 2px
  Pulse ring: rgba(76,175,80,0.3) animate
  Text: "Wajah terdeteksi. Kedipkan mata sekali." 12px center
  Text color: #A5D6A7

LIVENESS PASSED:
  Large ✓ icon (32px) animates in (spring 300ms)
  Text: "✅ Verifikasi berhasil!"
  Color: #4CAF50

LIVENESS FAILED:
  Large ✕ icon animates in
  Text: "❌ Gagal. Coba lagi."
  Color: #F44336
  Retry: "Ambil Ulang" button appears
```

### 5.6 Score Gauge (Full Page)

```
SVG circular progress (160px default, 200px on tablet)
Track: rgba(0,0,0,0.08) stroke-width:12px
Fill: tier-ring-color stroke-width:12px stroke-linecap:round
Animation: stroke-dashoffset count-up 1000ms ease-out

CENTER:
  Number: JBMono 64px 700 tier-text-color
  Tier label: PJS 14px 600 tier-text-color (Excellent/Baik/dll)

ENTRY ANIMATION:
  Number: count up from 0 to current (1000ms)
  Ring: draws from 0 to current angle (1000ms)
```

### 5.7 Achievement Badge

```
EARNED (card):
  bg white · shadow-card · r:12px · padding:12px · h:120px
  emoji: 40px centered
  label: 12px 600 #1A1A1A · text-center · max 2 lines
  date: 10px #9E9E9E · "Diraih DD MMM"
  border: 1px tier-ring-color

LOCKED:
  filter: grayscale(100%) · opacity:0.5
  🔒 icon: 16px · position absolute · top:8px right:8px
  No shadow

BADGES:
  🔥 Streak 7     — hadir 7 hari berturut tanpa terlambat
  💫 Streak 30    — 30 hari
  🎯 KPI Sempurna — semua KPI 100% dalam 1 bulan
  ⏰ Tepat Waktu  — 14 CI tepat waktu berturut
  🏆 Top Performer— skor tertinggi divisi bulan ini
  ✨ Zero Absen   — bulan tanpa absen tanpa keterangan
```

### 5.8 Offline Banner (NEW)

```
Position: Below page header (sticky-top, z:30)
bg #FFF3E0 · border-bottom 1px #FFB74D · padding: 10px 16px
display flex · align-items center · gap:8px

Left: 📱 emoji + "1 absensi menunggu sinkronisasi"
      Inter 13px 500 #E65100

Right: spinner (if syncing) OR "Sinkron Sekarang" link

Colors when syncing: spinner #F57C00 · text "Menyinkronkan..."
Colors when synced: green check · "Tersinkronisasi ✓" fades after 3s
```

---

## 6. Screen Specs — Employee & Leader (All Screens)

### Beranda `/dashboard`

```
STATUS BAR (system, dark icons)
OFFLINE BANNER (conditional, sticky)
HEADER (56px): avatar + greeting + bell
SHIFT CARD (20px padding, gradient)
SCORE MINI CARD (NEW)
KPI HIGHLIGHT CARD (NEW)
STATUS GRID (3 cells, white cards)
PENGUMUMAN (max 2, chevron right)
[LEADER ONLY]:
  TEAM ALERT BANNER (if >0 not CI)
  KPI INPUT REMINDER (if pending)
BOTTOM TAB BAR (60px + safe area)
```

### Detail Absensi `/dashboard/absensi/detail`

```
HEADER: ← Absen
CLOCK BLOCK: 48px mono realtime + Online/Offline pill + date
DIVIDER
JADWAL: shift item + chevron + location link + info banner
DIVIDER
ACTION BUTTONS: CI | CO (side by side)
DIVIDER
LOG TIMELINE: nodes + time + type + badge
[BOTTOM TAB BAR]
```

### Clock — L3 GPS `/dashboard/attendance/clock`

```
HEADER: ← "Clock In" + "Langkah 1 dari 2" (amber)
SHIFT BAR (50px)
MAP (45vh, Leaflet):
  OSM · Geofence circle (150m) · Red pin (TBM) · Blue dot pulse
  Accuracy ring if accuracy > 20m
  GPS accuracy indicator (green/yellow/red)
  FAB re-center
STATUS CARDS: valid/invalid/acquiring with distance info
CTA: Lanjutkan (disabled logic)
[BOTTOM TAB BAR]
```

### Clock — L4 Selfie `/dashboard/attendance/selfie`

```
HEADER: ← "Clock In" + "Langkah 2 dari 2" (amber)
SHIFT BAR (50px)
CAMERA (aspect 3/4):
  Video mirrored
  Oval overlay (dashed white + box-shadow darken)
  LIVENESS OVERLAY (layered on top of oval)
  Flash toggle (40px, bottom-left)
  Capture button (56px, bottom-right)
  Post-capture: static preview + Ambil Ulang
NOTE: textarea + counter
INSTRUCTION ROW: shield icon + text
KIRIM BUTTON (disabled before capture + liveness pass)
[BOTTOM TAB BAR]
```

### Clock — L5 Berhasil `/dashboard/attendance/success`

```
HEADER: ← Absensi Berhasil
SUCCESS ICON: 64px green circle + ✓ bold (spring anim)
TITLE + SUBTITLE (green + grey)
DETAIL TABLE (5 rows + liveness ✅ row)
LOG TIMELINE (2 items)
SCORE TOAST (auto 3s delay, slides up from bottom)
ACTIONS: Lihat Detail (outline) + Kembali (text link)
[BOTTOM TAB BAR]
```

### Skor Page `/dashboard/skor`

```
HEADER: ← Skor & Performa

SCORE GAUGE (center, 160px SVG)
RAISE PROJECTION CARD (yellow tint bg, disclaimer)
DIVIDER
BREAKDOWN BARS (3 bars: Kehadiran/KPI/Perilaku)
DIVIDER
STREAK CALENDAR (monthly mini)
DIVIDER
ACHIEVEMENT BADGES (grid 2 col)
DIVIDER
MOTIVATIONAL COPY
DIVIDER
SCORE EVENT LIST (riwayat + delta)
```

### KPI Page `/dashboard/kpi`

```
EMPLOYEE VIEW:
  Period selector
  KPI summary metric cards
  Weekly breakdown table (cetakan + ratings)
  Catatan dari Leader (if any)
  Achievement chart (line, 8 weeks)

LEADER VIEW (same + input tab):
  Tab: [View] [Input]
  Input tab → roster selector → KPI input form per karyawan
  Bulk input toggle (for same-rating weeks)
```

### Kalender `/dashboard/kalender`

```
Month/year navigator (arrows)
EMOJI CALENDAR GRID:
  🟢 Hadir tepat waktu
  🟡 Terlambat
  ❌ Absen tanpa izin
  🌴 Cuti
  😷 Sakit
  📝 Izin
  🎉 Hari libur
  ⭕ Hari ini
  ○ Mendatang

Tap hari → Bottom Sheet:
  CI time · CO time · Status · Shift · Catatan
  Tombol "Ajukan Koreksi" jika ada masalah

SUMMARY STRIP:
  "✅ 20 Hadir · ⚠️ 2 Telat · ❌ 1 Absen · 🌴 2 Cuti"
```

### Lembur `/dashboard/lembur`

```
LIST: riwayat lembur + status badge per item
FAB: + Ajukan Lembur (bottom right, 56px brand gold)

FORM (bottom sheet):
  Tanggal · Jam Mulai · Jam Selesai · Alasan
  Preview: "Estimasi: 2 jam × 1.5× = Rp XX.XXX"
  Submit button
```

### Akun & Profil `/dashboard/akun`

```
PROFILE CARD:
  Foto profil (100px) · nama · NIK · divisi · posisi
  Completeness bar: "Profil 80% lengkap"

TABS: Profil · Dokumen · Pengaturan

Profil tab: form edit data diri (read-only fields = greyed)
Dokumen tab: upload/view KTP, KK, BPJS, foto, sertifikat
Pengaturan tab: notifikasi preferences · PIN login toggle

LOGOUT button (merah, bottom)
```

---

## 7. Screen Specs — Super Admin (All Screens)

### Admin Layout

```
SIDEBAR (240px, bg #1A1A1A):
  Logo 40px + "TBM Group" 12px grey
  NAV ITEMS (padding 12px 16px, gap 4px):
    Active: bg rgba(245,166,35,0.15) · text #F5A623 · weight 600
    Hover:  bg rgba(255,255,255,0.08)
    Icon:   20px · margin-right 12px
  SECTION DIVIDERS: rgba(255,255,255,0.10)
  BOTTOM: avatar + name + logout button

HEADER BAR (64px, bg white, shadow-card):
  Left: breadcrumb (14px 500 #1A1A1A)
  Right: 🔔 bell + "Superadmin" + avatar dropdown
```

### Admin Dashboard `/admin/dashboard`

```
METRIC CARDS ROW (4 col, gap 16px):
  Each: 20px padding · shadow-card · r:16px
  Icon: 40px circle (brand-bg) + icon inside
  Value: JBMono 28px 700 · Label: 13px 500 grey
  Change: "+3.2% vs bulan lalu" (green/red)

ROW 2: Charts (2/3 + 1/3):
  Left:  Line chart "Kehadiran 30 Hari" (recharts, 280px)
  Right: Donut "Skor Distribusi" (recharts, 200px)

ROW 3 (full width):
  LIVE ATTENDANCE: "● Live" + feed cards (SSE realtime)

ROW 4 (2 col):
  Left:  AT-RISK TABLE (skor < 60)
  Right: PENDING APPROVALS (cuti + lembur + koreksi)
```

### Admin Reports `/admin/reports` (PDF Center)

```
QUICK DOWNLOAD (2 big cards, side by side):
  Weekly card: "Laporan Mingguan" + period + status + DL button
  Monthly card: "Laporan Bulanan" + period + status + DL button

CUSTOM GENERATOR (form row):
  Type dropdown · Period picker · Generate button
  Progress modal (5-step) during generation

SAVED REPORTS (table):
  Columns: name · type · period · created · size · actions
  Actions: Download · Regenerate · Delete
  Pagination 20/page
```

### Admin Settings `/admin/settings`

```
TABS: Geofence · Shift · KPI Templates · Gamifikasi
      Hari Libur · Payroll Rules · Notifikasi · Liveness
      PDF Reports · Backup & Restore

KPI TEMPLATE BUILDER:
  Card per template + drag handle (reorder)
  Edit modal: semua field template
  Weight total indicator: "Total: 100%" (real-time)
  Warning if total ≠ 100%

GAMIFIKASI RULES TABLE:
  Event type | Delta | Description | Active toggle | Edit
  Sortable rows
  Total impact preview calculator

GEOFENCE MAP PREVIEW:
  Mini Leaflet map showing current office pin + 150m circle
  Edit lat/lng + radius → live preview updates map
```

---

## 8. Motion & Animation

```
TIMING:
  --ease-spring:  cubic-bezier(0.175, 0.885, 0.32, 1.275)
  --ease-out:     cubic-bezier(0.0, 0.0, 0.2, 1)
  --ease-snappy:  cubic-bezier(0.4, 0.0, 0.6, 1)

CATALOG:

Score gauge entry:        ring draws 1000ms + number count-up simultaneous
Success icon (L5):        scale 0.3→1, opacity 0→1, 300ms ease-spring
Score toast:              translateY 80px→0, 250ms ease-out, hold 4s
Badge earned:             scale 0.5→1.1→1, 400ms ease-spring
Liveness passed:          ✓ scale 0→1, 300ms ease-spring, oval border green flash
User dot map pulse:       ring scale 1→1.8, opacity 0.5→0, 2s infinite
Button tap:               scale 1→0.98, 100ms ease-snappy
Capture button:           scale 1→0.88, 100ms ease-snappy
Page forward:             translateX 100%→0, 220ms ease-out
Page back:                translateX 0→100%, 180ms ease-snappy
Skeleton shimmer:         gradient sweep left→right, 1.5s infinite
Offline banner entry:     translateY -100%→0, 200ms ease-out
Offline banner exit:      translateY 0→-100%, 150ms ease-snappy
Skor change (realtime):   number morphs (odometer effect), 400ms
Tab switch indicator:     slide + width animate, 200ms ease-out

REDUCED MOTION:
  @media (prefers-reduced-motion: reduce):
    All: duration 0.01ms (instant)
    Exception: skeleton stays (expectation-managed)
```

---

## 9. Bottom Tab Bar (6 tabs)

```
HEIGHT: 60px + env(safe-area-inset-bottom)
BG: white · shadow-bottom · padding 0 8px

TABS:
  🏠 Beranda     /dashboard
  📋 Absensi     /dashboard/absensi
  🏆 Skor        /dashboard/skor
  📅 Kalender    /dashboard/kalender
  📬 Inbox       /dashboard/inbox (badge: unread count)
  👤 Akun        /dashboard/akun

PER TAB:
  flex:1 · flex-col · align-items:center · gap:3px
  min-height: 44px (touch target)
  Icon: 22px
  Label: 10px / 600 active, 500 inactive
  Active: #C62828 icon + label
  Inactive: #9E9E9E icon + label

BADGE (Inbox):
  min 16px circle · bg #C62828 · white 9px 700
  absolute: top:4px right(50%-16px)

SCORE BADGE (dot only, no number):
  8px circle · bg #C62828
  Shown: when score dropped today
  Pulse animation: 2s infinite (subtle)
```

---

## 10. Shared Patterns

### Empty States

```
Mascot 120px centered
Title: PJS 16px 600 #1A1A1A · text-center · mt:16px
Sub: Inter 14px 400 #9E9E9E · mt:6px
CTA: OUTLINE button mt:16px (if applicable)

Context copies:
  No CI today:     "Belum ada absensi. Mulai Clock In!"
  No KPI:          "Belum ada data KPI minggu ini."
  No announcements:"Tidak ada pengumuman saat ini."
  No notifications:"Semua notifikasi sudah dibaca. Tetap semangat! 💪"
  No overtime:     "Belum ada pengajuan lembur."
  No handover:     "Tidak ada catatan serah terima shift."
```

### Toast System

```
Position: bottom-center above tab bar (calc(60px+8px))
Max-width: calc(100%-32px)
radius:10px · shadow-modal · padding:12px 16px

VARIANTS:
  ✅ Success:  bg #2E7D32 · white
  ❌ Error:    bg #C62828 · white
  📊 Score+:  bg #1565C0 · white · "+N skor" prefix
  📉 Score-:  bg #E65100 · white · "-N skor" prefix
  ℹ️ Info:    bg #1A1A1A · white
  📱 Offline: bg #E65100 · white · offline specific

SCORE TOAST FORMAT:
  "🎯 Skor kamu: 98 (+1 hadir tepat waktu!)"
  "⚠️ Skor kamu: 95 (-2 terlambat 18 menit)"
```

### PWA Install Banner

```
Position: bottom (above tab bar) OR top (non-obtrusive)
Show: after 2nd login + first successful CI
bg white · shadow-modal · padding 16px · r:12px 12px 0 0

Content:
  "📱 Tambahkan MyProdusen ke layar utama"
  "Akses 1 tap, bekerja offline, terima notifikasi"
  [Tambahkan Sekarang] PRIMARY btn
  [Nanti] text link (dismiss + don't show 7 days)

iOS specific:
  Show Safari share instructions:
  "Tap 🔗 → Tambahkan ke Layar Utama"
```

---

## 11. Admin Sidebar — Full Spec

```
WIDTH: 240px fixed (desktop) / drawer 280px (mobile ≤ 768px)
BG: #1A1A1A
PADDING: 20px 12px

LOGO SECTION (60px):
  Logo MyProdusen (28px) + "TBM Group" (11px #9E9E9E)

NAV SECTIONS (with label):

  UTAMA:
    📊 Dashboard
    👥 Karyawan

  OPERASIONAL:
    📍 Absensi
    🎯 KPI
    ⏰ Lembur
    🌴 Cuti & Izin

  FINANSIAL:
    💰 Penggajian

  PERFORMA:
    🏆 Gamifikasi
    📢 Pengumuman

  LAPORAN:
    📄 Laporan PDF

  SISTEM:
    ⚙️ Pengaturan
    🔍 Audit Log

BOTTOM USER CARD:
  Avatar 32px · Nama · "Superadmin"
  Logout button (icon + text)

ACTIVE ITEM:
  bg rgba(245,166,35,0.15) · text #F5A623 · border-left 3px #F5A623

HOVER:
  bg rgba(255,255,255,0.08) · transition 150ms
```

---

## 12. Responsive Behavior

```
MOBILE (375–430px): Primary target — all specs above
TABLET (768–1024px):
  Employee: max-width 428px centered + side bg #FAFAF7
  Score gauge: 200px
  KPI table: horizontal scroll
  Badge grid: 3 columns
  Admin: sidebar appears as overlay

DESKTOP (≥ 1280px):
  Employee flow: max-width 480px · white card · bg #F0EFEB
  Bottom tab → converts to left sidebar (240px)
  Admin: full sidebar + multi-column content

ORIENTATION:
  Portrait: primary (all screens designed for portrait)
  Landscape on attendance screens: "Putar ke mode potret" overlay
```

---

## 13. Accessibility (WCAG 2.1 AA Complete)

```
TOUCH:
  ✅ All interactive: min 44×44px
  ✅ CTA primary: min 52px height
  ✅ Tab bar: min 56px height

COLOR:
  ✅ All text contrast ≥ 4.5:1 (verified per pair)
  ✅ Score badges: text + color (not color only)
  ✅ Liveness states: text description + color
  ✅ Offline state: text + color + icon

SEMANTIC:
  ✅ Heading hierarchy (h1→h2→h3)
  ✅ nav aria-label="Navigasi utama"
  ✅ main landmark per page
  ✅ admin tables: scope on headers

DYNAMIC:
  ✅ Clock: aria-live="polite" aria-atomic="true"
  ✅ Score change: aria-live="assertive"
  ✅ Liveness state: aria-live="assertive"
  ✅ Toast: role="alert" errors · role="status" info
  ✅ Loading: aria-busy="true" aria-label="Memuat..."

FORMS:
  ✅ All fields: visible label (not placeholder-only)
  ✅ Error: aria-describedby to field
  ✅ Focus ring: 2px solid #F5A623
  ✅ Star rating: aria-label "Nilai X dari 5 bintang"

MEDIA:
  ✅ Camera: aria-label="Kamera selfie verifikasi absensi"
  ✅ Map: aria-label="Peta validasi lokasi TBM"
  ✅ Map skip: "Lewati peta" skip link
  ✅ Selfie thumb: alt="Foto selfie Clock In HH:MM"
  ✅ Decorative: aria-hidden="true"
  ✅ Badge emojis: aria-label="[badge name]"

MOTION:
  ✅ prefers-reduced-motion respected for all
  ✅ Score count-up: instant if reduced-motion
  ✅ Page transitions: instant if reduced-motion
  ✅ Map pulse: disabled if reduced-motion
```

---

## 14. Z-Index Stack

```
10  — Oval camera overlay guide
20  — Camera controls (flash, capture)
25  — Liveness overlay
30  — Offline banner
35  — Sticky page header
40  — Toast notifications
50  — Bottom tab bar
55  — PWA install banner
60  — Modals / bottom sheets
70  — Full-screen overlays
400 — Map FAB (Leaflet namespace)
```

---

## 15. Color Quick Reference

```
BRAND GOLD:        #F5A623
BRAND LIGHT:       #FFD166
ACTION RED:        #C62828
SUCCESS:           #2E7D32
WARNING:           #F57C00
ERROR:             #C62828
INFO:              #1565C0
ONLINE:            #43A047
OFFLINE:           #FF9800

SCORE TIERS:
  Excellent 90-100: ring #4CAF50 bg #E8F5E9 text #1B5E20
  Baik 75-89:       ring #2196F3 bg #E3F2FD text #1565C0
  Perhatian 50-74:  ring #FF9800 bg #FFF3E0 text #E65100
  Kritis <50:       ring #F44336 bg #FFEBEE text #B71C1C

PAGE:  #FAFAF7  CARD: #FFFFFF  INPUT: #F8F8F6
BORDER:#E5E5E5  DIV:  #F0F0EC
TEXT1: #1A1A1A  TEXT2:#6B6B6B  TEXT3:#9E9E9E

ADMIN SIDEBAR: #1A1A1A (active #F5A623)
```

---

*DESIGN.md PRODUCTION FINAL v5.0.0*
*MyProdusen HRIS — PT Tcipta Buana Mandiri*
*2026-06-04*
