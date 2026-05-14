# Installation Guide - MyProdusen

**Local Development Setup**

---

## System Requirements

- **Node.js:** 22.x or higher
- **PostgreSQL:** 14.x or higher
- **npm:** 10.x or higher
- **Git:** Latest version
- **OS:** macOS, Linux, or Windows (WSL2)

---

## Step 1: Install Prerequisites

### macOS

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node@22

# Install PostgreSQL
brew install postgresql@14
brew services start postgresql@14
```

### Ubuntu/Debian

```bash
# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Windows (WSL2)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
```

---

## Step 2: Setup PostgreSQL Database

### Create Database and User

```bash
# Access PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE myprodusen;
CREATE USER myprodusen_user WITH PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE myprodusen TO myprodusen_user;

# Exit
\q
```

### Verify Connection

```bash
psql -U myprodusen_user -d myprodusen -h localhost
```

---

## Step 3: Clone Repository

```bash
# Clone the repository
git clone <repository-url>
cd MyProdusen

# Or if already cloned
cd MyProdusen
git pull origin main
```

---

## Step 4: Install Dependencies

```bash
npm install
```

This installs:
- Next.js 16
- Drizzle ORM
- TypeScript
- All required dependencies

---

## Step 5: Configure Environment

### Create .env file

```bash
cp .env.example .env
```

### Edit .env

```env
# Database
DATABASE_URL="postgresql://myprodusen_user:your_password_here@localhost:5432/myprodusen?schema=public"

# JWT Secret (generate a strong secret)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# App
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Upload Storage
UPLOAD_DIR="./uploads"
MAX_UPLOAD_SIZE="5242880"

# Geo-fencing
DEFAULT_GEOFENCE_RADIUS=100

# Session
SESSION_TIMEOUT_HOURS=8
```

### Generate Strong JWT Secret

```bash
# macOS/Linux
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Step 6: Setup Database Schema

### Push Schema to Database

```bash
npm run db:push
```

This creates all tables, indexes, and constraints in your PostgreSQL database.

### Verify Schema

```bash
# Connect to database
psql -U myprodusen_user -d myprodusen -h localhost

# List tables
\dt

# Should show:
# User, Employee, WorkLocation, Shift, Attendance, 
# LeaveRequest, KpiTemplate, KpiItem, KpiAssignment, 
# KpiResult, AuditLog, Notification
```

---

## Step 7: Seed Database

### Run Seed Script

```bash
npm run db:seed
```

This creates:
- 1 Superadmin
- 1 Admin HR
- 1 Supervisor
- 2 Employees
- 2 Work locations
- 2 Shifts
- 1 KPI template with 4 items

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Superadmin | admin@myprodusen.com | admin123 |
| Admin HR | hr@myprodusen.com | hr123 |
| Supervisor | supervisor@myprodusen.com | supervisor123 |
| Employee 1 | employee1@myprodusen.com | employee123 |
| Employee 2 | employee2@myprodusen.com | employee123 |

---

## Step 8: Start Development Server

```bash
npm run dev
```

Server starts at: **http://localhost:3000**

### Verify Installation

1. Open browser: `http://localhost:3000`
2. You should see the login page
3. Login with: `admin@myprodusen.com` / `admin123`
4. You should see the dashboard

---

## Step 9: Verify API Endpoints

### Health Check

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-05-15T...",
  "database": "connected"
}
```

### Test Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@myprodusen.com",
    "password": "admin123"
  }'
```

Should return JWT token.

---

## Step 10: Run Tests

```bash
npm run test
```

Expected output:
```
✓ Test Files  4 passed (4)
✓ Tests  22 passed (22)
```

---

## Optional: Drizzle Studio

Visual database browser:

```bash
npm run db:studio
```

Opens at: **https://local.drizzle.studio**

Features:
- Browse all tables
- View/edit data
- Run queries
- Inspect schema

---

## Development Workflow

### Daily Development

```bash
# Pull latest changes
git pull origin main

# Install new dependencies (if any)
npm install

# Start dev server
npm run dev
```

### Making Schema Changes

```bash
# 1. Edit drizzle/schema.ts
# 2. Generate migration
npm run db:generate

# 3. Apply migration
npm run db:push

# 4. Restart dev server
npm run dev
```

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test file
npm run test lib/geofencing.test.ts

# Run with watch mode
npm run test -- --watch
```

### Type Checking

```bash
npm run lint
```

### Building for Production

```bash
npm run build
npm run start
```

---

## Troubleshooting

### Port 3000 Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Database Connection Error

**Check PostgreSQL is running:**
```bash
# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql
```

**Check connection string:**
```bash
# Test connection
psql -U myprodusen_user -d myprodusen -h localhost
```

**Common issues:**
- Wrong password in DATABASE_URL
- PostgreSQL not running
- Database doesn't exist
- User doesn't have permissions

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

### Seed Script Fails

**Error: "duplicate key value"**
- Database already seeded
- Drop tables and re-seed:

```bash
# Connect to database
psql -U myprodusen_user -d myprodusen -h localhost

# Drop all tables
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

# Exit and re-run
\q
npm run db:push
npm run db:seed
```

---

## IDE Setup

### VS Code (Recommended)

**Install Extensions:**
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Prisma (for syntax highlighting)
- GitLens

**Settings (.vscode/settings.json):**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### WebStorm

- Enable TypeScript support
- Configure Node.js interpreter
- Enable ESLint
- Configure Prettier

---

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| DATABASE_URL | PostgreSQL connection string | - | ✅ |
| JWT_SECRET | Secret for JWT signing | dev-only-secret | ✅ |
| NODE_ENV | Environment (development/production) | development | ✅ |
| NEXT_PUBLIC_APP_URL | Public app URL | http://localhost:3000 | ✅ |
| UPLOAD_DIR | Upload directory path | ./uploads | ✅ |
| MAX_UPLOAD_SIZE | Max file size in bytes | 5242880 (5MB) | ❌ |
| DEFAULT_GEOFENCE_RADIUS | Default radius in meters | 100 | ❌ |
| SESSION_TIMEOUT_HOURS | JWT expiration in hours | 8 | ❌ |

---

## Next Steps

After successful installation:

1. ✅ Explore the dashboard
2. ✅ Test attendance check-in (requires GPS/location)
3. ✅ Create new employees
4. ✅ Test leave requests
5. ✅ Review API documentation
6. ✅ Read [AGENTS.md](../AGENTS.md) for development guidelines

---

## Getting Help

**Common Resources:**
- [Current State](CURRENT_STATE.md) - Implementation status
- [PRD](prd.md) - Product requirements
- [Drizzle Migration](DRIZZLE_MIGRATION.md) - ORM details
- [Coolify Deployment](COOLIFY_DEPLOYMENT.md) - Production deployment

**External Documentation:**
- Next.js: https://nextjs.org/docs
- Drizzle ORM: https://orm.drizzle.team
- PostgreSQL: https://www.postgresql.org/docs/

---

**Installation Complete! 🎉**  
**Ready for development 🚀**
