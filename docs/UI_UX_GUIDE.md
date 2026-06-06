# UI/UX Guide — MyProdusen Frontend v4

## Status

v4 UI/UX is implemented across frontend through global tokens, shared classes, and key screen polish.

## Principles

1. Metric-first: important numbers must be large, mono, and scannable.
2. Mobile-first: employee flow optimized for phone use and thumb reach.
3. Admin clarity: dense data still uses clean white cards and compact tables.
4. Yellow as action: `#FFC107` means primary action or active state.
5. Gray bands separate sections; white cards hold content.
6. Radius discipline: default radius is 8px.

## Gamification UI/UX Standard

- MyProdusen remains professional HRIS first and fun motivation second.
- Minimum tap target: 44px.
- Streak calendar must fit 320px mobile width.
- Always respect `prefers-reduced-motion: reduce`.
- Show score, streak, badge, and projection as work-motivation signals, not game clutter.

## Screen rules

### Login

- White form panel.
- Yellow brand accent.
- Poppins headings.
- Large primary submit button.
- Keep links subtle but accessible.

### Employee Beranda

- Greeting first.
- Stat strip near top: Hadir, Streak, Skor.
- Attendance CTA must be dominant.
- GPS/radius feedback must be visible before clock action.
- Use status colors only for true state: success, warning, danger, info.

### Admin Dashboard

- Use sidebar and top content grid.
- Metric cards should use mono numbers.
- Tables: uppercase muted headers, hairline row borders, light hover.
- Alerts/approvals use tinted cards.

### Forms

- Labels bold and compact.
- Inputs 8px radius with yellow focus border.
- Primary submit full-width on mobile.
- Error states use red tint, not layout shift.

### Tables

- Keep headers small uppercase.
- Use badges for status.
- Avoid heavy shadows.
- Keep actions compact.

## Component mapping

Use existing shared classes:

```html
<button class="btn btn-primary">Simpan</button>
<input class="input" />
<section class="card">...</section>
<span class="badge badge-success">Aktif</span>
<table class="table">...</table>
```

Use v4 helpers:

```html
<div class="v4-stats-row">
  <div class="v4-stat">
    <span class="v4-stat-label">Hadir</span>
    <span class="v4-stat-value">18</span>
  </div>
</div>
```

## Do / Don’t

Do:
- Use yellow only for primary action and active nav.
- Use JetBrains Mono for scores, counts, currency, and times.
- Use 8px radius unless avatar/pill needs full radius.
- Keep cards flat.

Don’t:
- Add new random colors.
- Use large gradients on admin tables.
- Use heavy shadows on every card.
- Use multiple competing CTAs in one card.
