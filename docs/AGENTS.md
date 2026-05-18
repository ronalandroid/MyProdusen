# Agents Notes

Working rules for any agent or contributor. The highest source of truth is
[`prd.md`](./prd.md). This file lists the non-negotiable guardrails that
every code change must respect.

## Stack

Next.js (App Router) · TypeScript · Drizzle ORM · PostgreSQL · Tailwind CSS
· Docker · VPS + Coolify.

Do not migrate the stack. Do not add Prisma, Eloquent, Laravel, or jQuery.
Do not adopt Bootstrap or Tabler UI kits.

## Reference-first rule (UI changes)

Before touching any UI:

1. Open `docs/references/screens/<screen>.png` for the screen you are
   changing (Employee app shell, Super Admin shell, or Emailing system).
2. Open `docs/references/design-checklist.md` and find the matching
   section. The checklist is the authoritative contract.
3. If something looks ambiguous, **stop and ask the operator**. Do not
   improvise visuals, copy, or interactions that are not in the references.
4. Cite the checklist line in your commit message, e.g.
   `feat(ui): add greeting card per design-checklist.md §Beranda-Employee`.
5. After the change, run `npm run release:check` and visually verify at
   320 / 375 / 768 / 1024 / 1440 px.

When the operator approves a new design board:

- Drop the new image into `docs/references/screens/` with the existing
  filename so refs stay stable.
- Update the matching section in `docs/references/design-checklist.md`.
- Use a `design/<short-desc>` branch so reviewers know to check the
  screenshot diff.

## Selfie attendance rules

Selfie proof is captured directly from the realtime device camera.Forbidden in the attendance flow:

- `<input type="file">`
- gallery picker
- manual upload fallback
- `accept="image/*"` attendance picker

Required flow:

1. Open device camera with `navigator.mediaDevices.getUserMedia()`.
2. Show live video preview.
3. Capture frame through canvas.
4. Resize / compress in the browser (≤ 720×720, ~0.75 quality, target ≤ 300
   KB; prefer WebP, fall back to JPEG).
5. Submit selfie as `FormData` blob — never base64 in JSON.
6. Backend validates MIME, size, and signature; writes to persistent storage
   with a server-generated filename under
   `attendance-selfies/<year>/<month>/<employeeId>/<attendanceId>-{checkin|checkout}.<ext>`.
7. Selfie proof is served only through authenticated API routes:
   - `GET /api/attendances/:id/selfie/check-in`
   - `GET /api/attendances/:id/selfie/check-out`
8. PostgreSQL stores only path + size + MIME + uploaded_at. Never the binary,
   never base64.

## Brand colors:

```txt
Primary Yellow: #FFC107
Accent Red:    #E53935
Black:         #111111
Soft Gray:     #F5F5F5
Success Green: #22C55E
```
- No design-system swap, no colour rebrand, no logo change.
- UI is clean, minimal, and not "AI-looking". Indonesian copy in user-facing
  strings; English copy in docs.

## Security

- Production aborts on missing or short `JWT_SECRET`. Use the strict
  `getProductionJwtSecret()` helper for any new signing flow.
- All sensitive actions write an audit row (see `SECURITY.md` for the list).
- Frontend hiding is UX, not security. Backend always rechecks.
- Never log or commit secrets. Production credentials live only in Coolify.

## Documentation

- New product / architecture docs go in `/docs/`.
- The only Markdown allowed at the repo root is `README.md` and this file.
- Do not create dated "PHASE_X_COMPLETE" memorial docs at the top level.
  Update `IMPLEMENTATION_PLAN.md` inline; archive historical docs in
  `docs/_archive/`.
- When you change behaviour, update the matching doc in the same commit.

## Reference repo research

When evaluating ideas from external repositories (e.g.
`ikhsan3adi/absensi-karyawan-gps-barcode`, `josephines1/o-present`), follow
[`REFERENCE_REPO_ANALYSIS.md`](./REFERENCE_REPO_ANALYSIS.md):

- Treat reference repos as functional spec only.
- Do not copy PHP / Blade / jQuery code.
- Do not adopt their UI kit.
- Re-implement chosen ideas with our existing modules (`lib/upload.ts`,
  `lib/reports/attendance-history.ts`, `app/api/attendance/exceptions/*`,
  `Notification` writer).
- Any verbatim snippet must include a file-header comment:
  `Source: <url>, MIT License`.

## Verification gate

Before merging code:

```bash
npm run lint    # tsc --noEmit
npm run test    # vitest run
npm run build   # next build
```

If any of those fail, the change is not ready.
