# Design References

This folder is the **canonical visual contract** for MyProdusen. Every UI
change must match the assets here. If something looks ambiguous, stop and
ask — do not interpret.

## Inventory

```
docs/references/
├── README.md                       ← this file (rules of engagement)
├── design-checklist.md             ← per-screen checklist agents must satisfy
├── email-style-guide.md            ← full email design guide (style, tone, copy)
├── myprodusen-logo.png             ← official logo
└── screens/
    ├── employee-app-shell.png      ← gambar 1: Employee mobile shell
    ├── superadmin-app-shell.png    ← gambar 2: Super Admin mobile shell
    └── emailing-system.png         ← gambar 3: Email templates
```

## Rules of engagement

1. **Reference-first.** Before writing UI code, open the relevant screenshot
   and the matching section of `design-checklist.md`. If the change is to
   email, also read `email-style-guide.md`.
2. **No invention.** If a layout, copy, or interaction is not in the
   references, treat it as out of scope and ask the operator. Do not
   improvise.
3. **No brand drift.** Yellow `#FFC107`, accent red `#E53935`, black
   `#111111`, soft gray `#F5F5F5`, success green `#22C55E`. No other
   colours, no other tokens, no extra design system.
4. **Mobile-first, then tablet, then desktop.** All screens are designed for
   mobile in the references. Desktop adaptations must keep the same visual
   identity, typography rhythm, and component vocabulary.
5. **Document the link in every commit.** Commit messages that change UI
   must reference the checklist line they satisfy, e.g.
   `feat(ui): add greeting card per design-checklist.md §Beranda-Employee`.
6. **No commercial / marketing language.** This is an internal HRIS, not a
   SaaS product.

## Workflow for any agent

```
1. Receive task that touches UI.
2. Identify screen(s) affected → open screens/<screen>.png.
3. Open docs/references/design-checklist.md, find the matching section.
4. Read what is required AND what is forbidden.
5. Implement.
6. Run npm run release:check.
7. Manual viewport check at 320, 375, 768, 1024, 1440 px.
8. Commit with checklist line referenced.
9. Open PR. Operator approves the screenshot diff.
```

## What stays out of references

- `docs/references/_archive/` does not exist — old design boards do not
  belong here. If a design changes, replace the file in place and bump the
  checklist; never keep stale variants.
- Marketing assets, social media art, partner branding — out of scope.

## How to update references

When the operator approves a new design:

1. Drop the new image into `screens/` with the exact filename of the
   screen it replaces.
2. Update the matching section of `design-checklist.md`.
3. Commit on a feature branch named `design/<short-desc>`.
4. PR title must say "Design refresh — <screen>" so reviewers know to look
   at the screenshot diff specifically.

The reference assets are source of truth. Live code follows them, never
the other way around.
