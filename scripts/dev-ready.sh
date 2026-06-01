#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT="${PORT:-3000}"
export PORT
export SEED_SUPERADMIN_PASSWORD="${SEED_SUPERADMIN_PASSWORD:-LocalAdminPass123!}"
export SEED_EMPLOYEE_PASSWORD="${SEED_EMPLOYEE_PASSWORD:-LocalEmployeePass123!}"

if command -v lsof >/dev/null 2>&1; then
  lsof -ti ":$PORT" | xargs -r kill -9 2>/dev/null || true
fi

npm run db:deploy
npm run db:seed

if [ -d android ] && command -v npx >/dev/null 2>&1; then
  npx cap sync android || true
fi

printf '\nReady login:\n  http://localhost:%s/login\n  admin@myprodusen.com / %s\n  employee1@myprodusen.com / %s\n\n' "$PORT" "$SEED_SUPERADMIN_PASSWORD" "$SEED_EMPLOYEE_PASSWORD"

exec npm run dev
