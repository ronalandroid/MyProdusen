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

## Seed Recovery

- Use `npm run db:seed` only for local or approved staging bootstrap.
- Seed is idempotent: it updates the Superadmin and Employee seed accounts instead of creating duplicate user rows.
- Password values stay in environment variables: `SEED_SUPERADMIN_PASSWORD` and `SEED_EMPLOYEE_PASSWORD`.
- Never run seed as a production data reset.
