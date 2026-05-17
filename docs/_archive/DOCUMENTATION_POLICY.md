# Documentation Policy — MyProdusen

**Status:** Active  
**Scope:** All future documentation changes

## Rule

All project documentation must live in `docs/`.

The only root-level markdown file allowed is `AGENTS.md`, because agent systems read it from repository root.

## When Creating Documentation

- Create new `.md` files directly under `docs/`.
- Do not create root-level summaries, reports, handoffs, or checklists.
- Update `docs/INDEX.md` when adding, moving, or renaming documentation.
- Use relative links from inside `docs/` without `docs/` prefix.
- Prefer updating existing docs over creating duplicate summary files.

## Source of Truth Order

1. `docs/prd.md`
2. `docs/CURRENT_STATE.md`
3. `docs/IMPLEMENTATION_PLAN.md`
4. `docs/ARCHITECTURE_DECISION.md`
5. Feature-specific docs in `docs/`

## Root Markdown Exception

`AGENTS.md` stays at repository root and should keep pointing agents to `docs/`.
