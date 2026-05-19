# Installation Guide

> **AI agent role source of truth:** MyProdusen production uses exactly two user-facing account roles: `SUPERADMIN` and `EMPLOYEE`. Legacy `ADMIN_HR` and `SUPERVISOR` references are historical only and must not be used for new UI/UX, docs, tests, or route access.


Local development setup. For production deployment, read
[`DEPLOYMENT.md`](./DEPLOYMENT.md) and [`COOLIFY.md`](./COOLIFY.md).

## System requirements

- Node.js 22+
- PostgreSQL 14+
- npm 10+
- (Optional) Redis 7+ for caching and rate limit; the app degrades gracefully if Redis is absent.
- (Recommended) Docker for parity with the Coolify production stack.

## 1. Install prerequisites

### macOS (Homebrew)

```bash
brew install node@22 postgresql@14
brew services start postgresql@14
```

### Ubuntu / Debian

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

## 2. Create the database

```bash
sudo -u postgres psql <<'SQL'
CREATE DATABASE myprodusen;
CREATE USER myprodusen_user WITH PASSWORD 'replace_me';
GRANT ALL PRIVILEGES ON DATABASE myprodusen TO myprodusen_user;
SQL
```

Verify the connection:

```bash
psql "postgresql://myprodusen_user:replace_me@localhost:5432/myprodusen"
```

## 3. Clone & install

```bash
git clone <repository-url>
cd MyProdusen
npm install
```

## 4. Configure environment

```bash
cp .env.example .env
```

The minimum required keys for local development:

```env
DATABASE_URL="postgresql://myprodusen_user:replace_me@localhost:5432/myprodusen"
JWT_SECRET="replace-me-with-a-long-random-string"   # ≥ 32 chars in production
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
APP_URL="http://localhost:3000"
UPLOAD_DIR="./uploads"
ATTENDANCE_SELFIE_DIR="attendance-selfies"
MAX_SELFIE_SIZE_MB=1
GPS_MAX_ACCURACY_METERS=100
DEFAULT_GEOFENCE_RADIUS_METERS=100
REJECT_OUTSIDE_GEOFENCE=true
GPS_TIMESTAMP_MAX_AGE_SECONDS=120
ATTENDANCE_EXPORT_MAX_ROWS=5000
```

`./uploads` is git-ignored. The directory is created lazily on the first
selfie write. Production uses `/app/uploads` on the persistent Coolify volume.

## 5. Apply migrations

```bash
npm run db:deploy
```

This runs `scripts/run-migrations.mjs`, which tracks every applied SQL file in
the `_myprodusen_migrations` table and is safe against partially-baselined
databases.

## 6. Bootstrap a superadmin (one-time)

```bash
SUPERADMIN_EMAIL=admin@example.com \
SUPERADMIN_USERNAME=superadmin \
SUPERADMIN_PASSWORD='replace-me-strong' \
npm run bootstrap:superadmin
```

Rotate or remove `SUPERADMIN_*` env vars after the first successful login.

## 7. Run the dev server

```bash
npm run dev
```

The app boots on `http://localhost:3000`. Log in with the superadmin
credentials, create employees, and assign work locations + shifts before
testing attendance.

## Verify the install

```bash
npm run lint    # tsc --noEmit
npm run test    # vitest run (expect 206 passing)
npm run build   # next build (production smoke test)
```

If any of these fail, see [`TESTING.md`](./TESTING.md) for diagnostics.

## Optional: Docker-based local DB

If you don't want PostgreSQL on the host machine, the repo's
`docker-compose.yml` can run Postgres alongside the app. See
[`DEPLOYMENT.md`](./DEPLOYMENT.md) for details.
