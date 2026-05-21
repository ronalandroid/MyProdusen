# Operations — MyProdusen

> Canonical operations, backup/restore, rollback, troubleshooting, and production runbook.

> Role lock: production UI/login/access uses only `SUPERADMIN` and `EMPLOYEE`; `ADMIN_HR` and `SUPERVISOR` are historical database enum values only and must be denied in production access.

## Production Runtime

- Target: VPS + Coolify + Docker + PostgreSQL.
- Persistent upload volume: `/app/uploads`.
- Health endpoint: `/api/health` must not leak secrets.
- Version endpoint: `/api/version` may expose only safe metadata.
- Secrets live in Coolify or password manager only.

## Daily Operations

- Check Coolify app health and latest deploy status.
- Check `/api/health` and core login flow.
- Check disk usage for `/app/uploads` and PostgreSQL volume.
- Review critical audit logs and failed login spikes.
- Confirm backup jobs completed.

## Backup

Database backup:

```bash
pg_dump "$DATABASE_URL" --format=custom --file=myprodusen-$(date +%F).dump
```

Upload backup:

```bash
tar -czf myprodusen-uploads-$(date +%F).tar.gz /app/uploads
```

Rules:

- Store backups outside app container.
- Encrypt or restrict backup access.
- Never commit dumps or upload archives.
- Test restore at least quarterly on staging.

## Restore Drill

1. Provision staging PostgreSQL and upload volume.
2. Restore DB using `pg_restore`.
3. Restore `/app/uploads` archive.
4. Set staging env secrets.
5. Run `npm run db:deploy` for newer additive migrations.
6. Run smoke checks from `TESTING_QA.md`.
7. Record result in `CHANGELOG.md` or issue tracker.

## Rollback

1. Stop deploy rollout in Coolify.
2. Identify last known-good image/commit.
3. Restore previous image if app-only failure.
4. Restore DB only if approved and necessary.
5. Verify `/api/health`, auth, attendance, uploads, payroll RBAC.
6. Record rollback reason, operator, timestamp, commit, and backup ID.

## Incident Response

- Auth/RBAC leak: disable affected route or feature flag immediately, preserve logs, rotate secrets if needed.
- Upload exposure: remove public mapping, rotate signed URLs if any, audit access logs.
- Payroll leak: disable payroll routes, preserve audit logs, notify owner/HR PIC.
- Migration failure: stop app, inspect migration table, never reset production DB.

## Production Signoff

- Release checklist complete.
- Backup and rollback ready.
- Smoke tests passed.
- Owner/HR/technical PIC approve go-live.

## Go-Live Command Order

1. Run `npm run release:env` in Coolify shell.
2. Run `npm run db:deploy`.
3. Run `npm run start:prod` or let Coolify start the configured process.
4. Verify `/api/health` and `/api/version`.
5. Run `BASE_URL=https://myprodusen.online npm run verify:live-routes`.
6. Run authenticated smoke with dedicated `E2E_SUPERADMIN_*` and `E2E_EMPLOYEE_*` staging-safe accounts.

Do not proceed if `release:env` reports errors or any TestSprite/E2E bypass flag is `true`.

## Seed Recovery

- Use `npm run db:seed` only for local or approved staging bootstrap.
- Seed is idempotent: it updates the Superadmin and Employee seed accounts instead of creating duplicate user rows.
- Password values stay in environment variables: `SEED_SUPERADMIN_PASSWORD` and `SEED_EMPLOYEE_PASSWORD`.
- Never run seed as a production data reset.

## Restore script compatibility — 2026-05-22

`scripts/backup.sh` creates PostgreSQL custom-format `.dump` files with `pg_dump --format=custom`. `scripts/restore.sh` restores `.dump` files with `pg_restore --clean --if-exists --no-owner --no-acl` and restores uploads to `UPLOAD_DIR` (default `/app/uploads`). Run restore drills only on staging or an explicitly approved recovery target.
