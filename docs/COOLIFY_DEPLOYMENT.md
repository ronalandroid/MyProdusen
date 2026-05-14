# Coolify Deployment Guide - MyProdusen

**Tech Stack:** Next.js 16 + Drizzle ORM + PostgreSQL + VPS + Coolify  
**Last Updated:** 2026-05-15

---

## Prerequisites

- VPS with Docker installed (Ubuntu 22.04+ recommended)
- Coolify installed on VPS
- PostgreSQL database (can be managed by Coolify)
- Domain name (optional, can use IP)
- Git repository (GitHub, GitLab, or Bitbucket)

---

## Step 1: Prepare Your VPS

### Install Coolify

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Access Coolify at: `http://your-vps-ip:8000`

### Create PostgreSQL Database

In Coolify dashboard:
1. Go to **Databases** → **New Database**
2. Select **PostgreSQL**
3. Set database name: `myprodusen`
4. Set username: `myprodusen_user`
5. Generate strong password
6. Deploy database

Note the connection string:
```
postgresql://myprodusen_user:password@postgres:5432/myprodusen
```

---

## Step 2: Configure Git Repository

### Push Your Code

```bash
git add .
git commit -m "Ready for Coolify deployment with Drizzle ORM"
git push origin main
```

### Connect Repository to Coolify

1. In Coolify: **Projects** → **New Project**
2. Select **Git Repository**
3. Connect your Git provider (GitHub/GitLab)
4. Select repository: `MyProdusen`
5. Select branch: `main`

---

## Step 3: Configure Application

### Build Settings

**Build Pack:** Nixpacks (auto-detected for Next.js)

**Build Command:**
```bash
npm install && npm run db:generate && npm run build
```

**Start Command:**
```bash
npm start
```

**Port:** `3000`

### Environment Variables

Add these in Coolify **Environment Variables** section:

```env
# Database
DATABASE_URL=postgresql://myprodusen_user:YOUR_PASSWORD@postgres:5432/myprodusen

# JWT Secret (generate strong 32+ char secret)
JWT_SECRET=your-super-secret-jwt-key-change-this-min-32-characters

# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Upload Storage
UPLOAD_DIR=/app/uploads
MAX_UPLOAD_SIZE=5242880

# Geo-fencing
DEFAULT_GEOFENCE_RADIUS=100

# Session
SESSION_TIMEOUT_HOURS=8
```

**Generate Strong JWT Secret:**
```bash
openssl rand -base64 32
```

---

## Step 4: Configure Persistent Storage

### Create Volume for Uploads

In Coolify application settings:

1. Go to **Storages** → **Add Storage**
2. **Name:** `uploads`
3. **Source Path:** `/var/lib/coolify/uploads/myprodusen`
4. **Destination Path:** `/app/uploads`
5. **Save**

This ensures uploaded selfies and photos persist across deployments.

---

## Step 5: Configure Domain (Optional)

### Add Custom Domain

1. In Coolify: **Domains** → **Add Domain**
2. Enter your domain: `myprodusen.yourdomain.com`
3. Coolify will auto-configure SSL with Let's Encrypt

### DNS Configuration

Point your domain to VPS IP:
```
A Record: myprodusen.yourdomain.com → YOUR_VPS_IP
```

Wait for DNS propagation (5-30 minutes).

---

## Step 6: Deploy Application

### Initial Deployment

1. Click **Deploy** in Coolify
2. Monitor build logs
3. Wait for deployment to complete (~3-5 minutes)

### Run Database Migration

After first successful build, run migration:

**Option A: Via Coolify Terminal**
1. Go to **Terminal** in Coolify
2. Run:
   ```bash
   npm run db:push
   ```

**Option B: Via SSH**
```bash
ssh root@your-vps-ip
docker exec -it myprodusen-app npm run db:push
```

### Seed Database (First Deploy Only)

```bash
docker exec -it myprodusen-app npm run db:seed
```

⚠️ **Important:** Change default passwords immediately after seeding!

---

## Step 7: Verify Deployment

### Health Check

```bash
curl https://yourdomain.com/api/health
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
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@myprodusen.com",
    "password": "admin123"
  }'
```

Should return JWT token.

### Access Application

Open browser: `https://yourdomain.com`

Login with:
- Email: `admin@myprodusen.com`
- Password: `admin123`

**⚠️ Change this password immediately!**

---

## Step 8: Post-Deployment Security

### 1. Change Default Passwords

Login as each user and change passwords:
- Superadmin
- Admin HR
- Supervisor
- Employees

### 2. Update Seed Script

Remove or secure `drizzle/seed.ts` to prevent accidental re-seeding.

### 3. Configure Firewall

```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw enable
```

### 4. Set Up Database Backups

**Automated Backup Script:**

```bash
#!/bin/bash
# /root/backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/myprodusen"
mkdir -p $BACKUP_DIR

docker exec postgres pg_dump -U myprodusen_user myprodusen > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

**Add to Crontab:**
```bash
crontab -e
# Add: Daily backup at 2 AM
0 2 * * * /root/backup-db.sh
```

---

## Continuous Deployment

### Auto-Deploy on Git Push

Coolify can auto-deploy when you push to `main`:

1. In Coolify: **Settings** → **Auto Deploy**
2. Enable **Deploy on Push**
3. Coolify will watch your Git repository

Now every `git push origin main` triggers deployment.

### Pre-Deploy Hook

Add to Coolify pre-deploy script:
```bash
npm run db:push
```

This ensures schema is updated before app starts.

---

## Monitoring & Logs

### View Application Logs

In Coolify:
- **Logs** tab shows real-time application logs
- Filter by error/warning/info

### Monitor Resources

- **Metrics** tab shows CPU, RAM, disk usage
- Set up alerts for high resource usage

### Database Monitoring

```bash
# Check database size
docker exec postgres psql -U myprodusen_user -d myprodusen -c "SELECT pg_size_pretty(pg_database_size('myprodusen'));"

# Check active connections
docker exec postgres psql -U myprodusen_user -d myprodusen -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## Scaling & Performance

### Horizontal Scaling

Coolify supports multiple instances:
1. **Settings** → **Scale**
2. Increase replicas to 2-3
3. Coolify auto-load-balances

### Database Connection Pooling

Update `DATABASE_URL`:
```env
DATABASE_URL=postgresql://user:pass@postgres:5432/myprodusen?pgbouncer=true&connection_limit=10
```

### CDN for Static Assets

Use Cloudflare or similar:
1. Point domain to Cloudflare
2. Enable caching for `/uploads/*`
3. Reduces server load

---

## Troubleshooting

### Build Fails

**Check logs in Coolify:**
- Look for npm install errors
- Verify Node.js version compatibility
- Ensure `package.json` is committed

**Common fixes:**
```bash
# Clear build cache
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection Error

**Check connection string:**
```bash
docker exec myprodusen-app printenv DATABASE_URL
```

**Test connection:**
```bash
docker exec postgres psql -U myprodusen_user -d myprodusen -c "SELECT 1;"
```

### Upload Directory Not Writable

**Fix permissions:**
```bash
docker exec myprodusen-app chown -R nextjs:nodejs /app/uploads
docker exec myprodusen-app chmod -R 755 /app/uploads
```

### App Crashes After Deploy

**Check logs:**
```bash
docker logs myprodusen-app --tail 100
```

**Common issues:**
- Missing environment variables
- Database migration not run
- Port already in use

---

## Rollback Procedure

### Rollback to Previous Version

1. In Coolify: **Deployments** tab
2. Find previous successful deployment
3. Click **Redeploy**

### Manual Rollback via Git

```bash
git revert HEAD
git push origin main
```

Coolify auto-deploys the reverted version.

---

## Backup & Restore

### Full Backup

```bash
# Backup database
docker exec postgres pg_dump -U myprodusen_user myprodusen > backup.sql

# Backup uploads
tar -czf uploads-backup.tar.gz /var/lib/coolify/uploads/myprodusen
```

### Restore from Backup

```bash
# Restore database
cat backup.sql | docker exec -i postgres psql -U myprodusen_user -d myprodusen

# Restore uploads
tar -xzf uploads-backup.tar.gz -C /var/lib/coolify/uploads/myprodusen
```

---

## Cost Optimization

### VPS Recommendations

**Minimum (10-20 users):**
- 2 vCPU
- 4 GB RAM
- 50 GB SSD
- ~$10-20/month (DigitalOcean, Hetzner, Vultr)

**Recommended (50-100 users):**
- 4 vCPU
- 8 GB RAM
- 100 GB SSD
- ~$40-60/month

### Database Optimization

```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_attendance_employee_date ON "Attendance"("employeeId", "checkInTime");
CREATE INDEX idx_leave_employee_status ON "LeaveRequest"("employeeId", "status");
```

---

## Security Checklist

- [ ] Strong JWT_SECRET (32+ characters)
- [ ] Changed all default passwords
- [ ] HTTPS enabled (Let's Encrypt)
- [ ] Firewall configured (UFW)
- [ ] Database backups automated
- [ ] Environment variables secured
- [ ] Upload directory permissions correct
- [ ] Rate limiting enabled (future)
- [ ] Monitoring alerts configured

---

## Support & Resources

- **Coolify Docs:** https://coolify.io/docs
- **Drizzle ORM:** https://orm.drizzle.team
- **Next.js:** https://nextjs.org/docs

---

**Deployment Guide Complete ✅**  
**Ready for production deployment on VPS with Coolify 🚀**
