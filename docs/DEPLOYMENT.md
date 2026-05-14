# Deployment Guide — VPS + Coolify

## Required Environment Variables
- `NODE_ENV=production`
- `DATABASE_URL=postgresql://...`
- `JWT_SECRET=<strong 32+ character secret>`
- `NEXT_PUBLIC_APP_URL=https://your-domain`
- `UPLOAD_DIR=/app/uploads`
- `MAX_UPLOAD_SIZE=5242880`

## Docker
- `Dockerfile` builds Next.js standalone output.
- `.dockerignore` excludes secrets, dependencies, build output, and uploads.
- `docker-compose.yml` is for local validation, not final production secrets.

## Coolify Setup
- Create app from GitHub repo.
- Attach PostgreSQL service.
- Set env vars in Coolify secrets panel.
- Mount persistent volume: `/app/uploads`.
- Healthcheck path: `/api/health`.
- Run migrations with `npx prisma migrate deploy` before production traffic.

## Database Safety
- Never run `prisma migrate reset` in production.
- Commit `prisma/migrations/**` before deploy.
- Test migrations against a staging database first.

## Backup
- Schedule PostgreSQL backups with `pg_dump`.
- Back up upload volume `/app/uploads`.
- Test restore before launch.
