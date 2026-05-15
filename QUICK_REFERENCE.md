# Quick Reference - MyProdusen

**Drizzle ORM + VPS + Coolify Deployment**

---

## 🚀 Quick Commands

### Development
```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # TypeScript check
npm run test             # Run all tests
```

### Database (Drizzle)
```bash
npm run db:generate      # Generate migration files
npm run db:migrate       # Apply migrations (production)
npm run db:push          # Push schema directly (dev)
npm run db:studio        # Open Drizzle Studio
npm run db:seed          # Seed with demo data
```

---

## 📁 Project Structure

```
MyProdusen/
├── app/                 # Next.js App Router
│   ├── api/            # API endpoints
│   └── dashboard/      # Dashboard pages
├── features/           # Business logic services
├── lib/                # Utilities & middleware
├── drizzle/            # Database schema & seed
└── docs/               # Documentation
```

---

## 🔑 Environment Variables

```env
DATABASE_URL="postgresql://user:pass@host:5432/myprodusen"
JWT_SECRET="min-32-characters-secret"
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
UPLOAD_DIR="/app/uploads"
```

Generate JWT Secret:
```bash
openssl rand -base64 32
```

---

## 🗄️ Database Setup

### First Time Setup
```bash
# 1. Push schema
npm run db:push

# 2. Seed database
npm run db:seed

# 3. Login with:
# admin@myprodusen.com / admin123
```

### Schema Changes
```bash
# 1. Edit drizzle/schema.ts
# 2. Generate migration
npm run db:generate

# 3. Apply changes
npm run db:push
```

---

## 🚢 Deployment (Coolify)

### Quick Deploy
```bash
# 1. Push to Git
git push origin main

# 2. In Coolify:
# - Connect repository
# - Set environment variables
# - Add storage volume: /app/uploads
# - Deploy

# 3. Initialize database
docker exec myprodusen-app npm run db:push
docker exec myprodusen-app npm run db:seed
```

### Environment Setup in Coolify
1. DATABASE_URL (from Coolify PostgreSQL)
2. JWT_SECRET (generate with openssl)
3. NEXT_PUBLIC_APP_URL (your domain)
4. NODE_ENV=production

---

## 🔐 Default Credentials

After seeding:

| Role | Email | Password |
|------|-------|----------|
| Superadmin | admin@myprodusen.com | admin123 |
| Admin HR | hr@myprodusen.com | hr123 |
| Supervisor | supervisor@myprodusen.com | supervisor123 |
| Employee 1 | employee1@myprodusen.com | employee123 |
| Employee 2 | employee2@myprodusen.com | employee123 |

⚠️ **Change immediately in production!**

---

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run specific test
npm run test lib/geofencing.test.ts

# Watch mode
npm run test -- --watch
```

**Current Coverage:**
- ✅ 22 tests passing
- ✅ Geofencing, Date utils, KPI, Permissions

---

## 🔍 Debugging

### Check Health
```bash
curl http://localhost:3000/api/health
```

### View Logs (Coolify)
```bash
docker logs myprodusen-app --tail 100 -f
```

### Database Connection
```bash
# Test connection
psql $DATABASE_URL

# Check tables
\dt

# Check data
SELECT * FROM "User" LIMIT 5;
```

### Drizzle Studio
```bash
npm run db:studio
# Opens: https://local.drizzle.studio
```

---

## 💾 Backup & Restore

### Backup
```bash
# Database
docker exec postgres pg_dump -U user myprodusen > backup.sql

# Uploads
tar -czf uploads.tar.gz /var/lib/coolify/uploads/myprodusen
```

### Restore
```bash
# Database
cat backup.sql | docker exec -i postgres psql -U user myprodusen

# Uploads
tar -xzf uploads.tar.gz -C /
```

---

## 🔄 Rollback

### To Previous Deployment
In Coolify: **Deployments** → Select previous → **Redeploy**

### To Prisma (if needed)
```bash
git checkout backup-prisma-before-drizzle
npm install
npm run build
```

---

## 📊 Monitoring

### Check Database Size
```bash
docker exec postgres psql -U user -d myprodusen \
  -c "SELECT pg_size_pretty(pg_database_size('myprodusen'));"
```

### Check Connections
```bash
docker exec postgres psql -U user -d myprodusen \
  -c "SELECT count(*) FROM pg_stat_activity;"
```

### Application Metrics
- Coolify Dashboard → Metrics tab
- CPU, RAM, Disk usage

---

## 🛠️ Common Issues

### Port 3000 in use
```bash
lsof -i :3000
kill -9 <PID>
```

### Database connection error
- Check DATABASE_URL
- Verify PostgreSQL running
- Test connection with psql

### Build fails
```bash
rm -rf .next node_modules
npm install
npm run build
```

### Upload permission error
```bash
docker exec myprodusen-app chown -R nextjs:nodejs /app/uploads
docker exec myprodusen-app chmod -R 755 /app/uploads
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `README.md` | Project overview |
| `docs/INSTALLATION.md` | Local setup |
| `docs/COOLIFY_DEPLOYMENT.md` | VPS deployment |
| `docs/DRIZZLE_MIGRATION.md` | Migration details |
| `DEPLOYMENT_CHECKLIST.md` | Deploy checklist |
| `MIGRATION_SUMMARY.md` | Executive summary |

---

## 🔗 Useful Links

- **Drizzle ORM:** https://orm.drizzle.team
- **Coolify:** https://coolify.io/docs
- **Next.js:** https://nextjs.org/docs
- **PostgreSQL:** https://www.postgresql.org/docs

---

## 📞 Quick Help

**Can't connect to database?**
→ Check DATABASE_URL in .env

**Build failing?**
→ Run `npm run lint` to see TypeScript errors

**Tests failing?**
→ Run `npm run test` to see which tests

**Deployment issues?**
→ Check Coolify logs in dashboard

**Need to rollback?**
→ Use Coolify Deployments tab

---

## ✅ Health Check Endpoints

```bash
# API Health
curl https://yourdomain.com/api/health

# Test Login
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@myprodusen.com","password":"admin123"}'
```

---

## 🎯 Tech Stack Summary

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 6
- **Database:** PostgreSQL 14+
- **ORM:** Drizzle ORM 0.45.2
- **Auth:** JWT + bcryptjs
- **Validation:** Zod
- **Styling:** Tailwind CSS 3
- **Testing:** Vitest
- **Deployment:** Docker + Coolify
- **Hosting:** VPS

---

**Keep this reference handy for quick lookups! 📌**
