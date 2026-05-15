# Deployment Checklist - MyProdusen

**Use this checklist when deploying to VPS + Coolify**

---

## Pre-Deployment Checklist

### ✅ Code Preparation

- [ ] All changes committed to Git
- [ ] Tests passing: `npm run test`
- [ ] Build successful: `npm run build`
- [ ] TypeScript clean: `npm run lint`
- [ ] Documentation reviewed
- [ ] Environment variables documented

### ✅ VPS Preparation

- [ ] VPS provisioned (2+ vCPU, 4+ GB RAM)
- [ ] Coolify installed and accessible
- [ ] PostgreSQL database created in Coolify
- [ ] Database credentials saved securely
- [ ] Domain name configured (optional)
- [ ] SSL certificate ready (Let's Encrypt via Coolify)

### ✅ Git Repository

- [ ] Repository pushed to GitHub/GitLab
- [ ] Branch: `main` selected
- [ ] Repository connected to Coolify
- [ ] Webhook configured for auto-deploy (optional)

---

## Deployment Steps

### Step 1: Configure Coolify Application

- [ ] Create new application in Coolify
- [ ] Select Git repository
- [ ] Select branch: `main`
- [ ] Build pack: Nixpacks (auto-detected)
- [ ] Port: `3000`

### Step 2: Set Environment Variables

Copy these to Coolify Environment Variables section:

```env
DATABASE_URL=postgresql://user:password@postgres:5432/myprodusen
JWT_SECRET=<generate-32-char-secret>
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
UPLOAD_DIR=/app/uploads
MAX_UPLOAD_SIZE=5242880
DEFAULT_GEOFENCE_RADIUS=100
SESSION_TIMEOUT_HOURS=8
```

**Generate JWT Secret:**
```bash
openssl rand -base64 32
```

- [ ] All environment variables added
- [ ] DATABASE_URL correct
- [ ] JWT_SECRET generated (32+ characters)
- [ ] NEXT_PUBLIC_APP_URL matches your domain

### Step 3: Configure Persistent Storage

- [ ] Add storage volume in Coolify
- [ ] Name: `uploads`
- [ ] Source: `/var/lib/coolify/uploads/myprodusen`
- [ ] Destination: `/app/uploads`
- [ ] Permissions: Read/Write

### Step 4: Configure Domain (Optional)

- [ ] Add domain in Coolify
- [ ] DNS A record pointing to VPS IP
- [ ] SSL certificate auto-generated
- [ ] HTTPS working

### Step 5: Deploy Application

- [ ] Click "Deploy" in Coolify
- [ ] Monitor build logs
- [ ] Wait for deployment to complete (~3-5 min)
- [ ] Check deployment status: Success

### Step 6: Initialize Database

**Via Coolify Terminal:**
```bash
npm run db:push
```

- [ ] Schema pushed successfully
- [ ] No errors in logs

### Step 7: Seed Database (First Deploy Only)

```bash
npm run db:seed
```

- [ ] Seed completed successfully
- [ ] Default users created

---

## Post-Deployment Verification

### ✅ Health Checks

**1. API Health Check**
```bash
curl https://yourdomain.com/api/health
```
Expected: `{"status":"ok","database":"connected"}`

- [ ] Health endpoint responding
- [ ] Database connected

**2. Test Login**
```bash
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@myprodusen.com","password":"admin123"}'
```
Expected: JWT token returned

- [ ] Login working
- [ ] JWT token received

**3. Browser Access**
- [ ] Open: `https://yourdomain.com`
- [ ] Login page loads
- [ ] Login with admin credentials
- [ ] Dashboard accessible

### ✅ Feature Testing

- [ ] Employee list loads
- [ ] Create new employee works
- [ ] Attendance check-in works (requires GPS)
- [ ] Leave request works
- [ ] Shift management works
- [ ] Work location management works

### ✅ Security Verification

- [ ] HTTPS enabled (green padlock)
- [ ] HTTP redirects to HTTPS
- [ ] JWT_SECRET is strong (32+ chars)
- [ ] Database credentials secure
- [ ] Upload directory writable
- [ ] No sensitive data in logs

---

## Security Hardening

### Immediate (Day 1)

- [ ] Change all default passwords:
  - [ ] Superadmin: admin@myprodusen.com
  - [ ] Admin HR: hr@myprodusen.com
  - [ ] Supervisor: supervisor@myprodusen.com
  - [ ] Employee 1: employee1@myprodusen.com
  - [ ] Employee 2: employee2@myprodusen.com

- [ ] Delete or disable demo accounts (optional)

- [ ] Configure firewall on VPS:
```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw enable
```

### Week 1

- [ ] Set up database backups (daily)
- [ ] Configure monitoring alerts
- [ ] Review application logs
- [ ] Test backup restoration
- [ ] Document admin procedures

### Month 1

- [ ] Implement rate limiting
- [ ] Add httpOnly cookie authentication
- [ ] Enable audit logging
- [ ] Security audit
- [ ] Performance optimization

---

## Database Backup Setup

### Automated Backup Script

Create `/root/backup-myprodusen.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/myprodusen"
mkdir -p $BACKUP_DIR

# Backup database
docker exec postgres pg_dump -U myprodusen_user myprodusen > $BACKUP_DIR/db_$DATE.sql

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/lib/coolify/uploads/myprodusen

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

- [ ] Script created
- [ ] Script executable: `chmod +x /root/backup-myprodusen.sh`
- [ ] Test backup: `/root/backup-myprodusen.sh`
- [ ] Add to crontab: `0 2 * * * /root/backup-myprodusen.sh`

---

## Monitoring Setup

### Application Monitoring

- [ ] Coolify metrics enabled
- [ ] CPU/RAM alerts configured
- [ ] Disk space alerts configured
- [ ] Application logs reviewed daily

### Database Monitoring

```bash
# Check database size
docker exec postgres psql -U myprodusen_user -d myprodusen \
  -c "SELECT pg_size_pretty(pg_database_size('myprodusen'));"

# Check connections
docker exec postgres psql -U myprodusen_user -d myprodusen \
  -c "SELECT count(*) FROM pg_stat_activity;"
```

- [ ] Database size monitored
- [ ] Connection pool configured
- [ ] Slow query logging enabled

---

## Rollback Plan

### If Deployment Fails

**Option 1: Redeploy Previous Version**
- [ ] Go to Coolify Deployments tab
- [ ] Find last successful deployment
- [ ] Click "Redeploy"

**Option 2: Git Rollback**
```bash
git revert HEAD
git push origin main
```
- [ ] Coolify auto-deploys reverted version

**Option 3: Restore from Backup**
```bash
# Restore database
cat /var/backups/myprodusen/db_YYYYMMDD_HHMMSS.sql | \
  docker exec -i postgres psql -U myprodusen_user -d myprodusen

# Restore uploads
tar -xzf /var/backups/myprodusen/uploads_YYYYMMDD_HHMMSS.tar.gz -C /
```

---

## Troubleshooting

### Build Fails

- [ ] Check Coolify build logs
- [ ] Verify package.json is committed
- [ ] Check Node.js version compatibility
- [ ] Clear build cache and retry

### Database Connection Error

- [ ] Verify DATABASE_URL in environment variables
- [ ] Check PostgreSQL is running
- [ ] Test connection from terminal
- [ ] Check network connectivity

### Application Crashes

- [ ] Check application logs in Coolify
- [ ] Verify all environment variables set
- [ ] Check database migrations ran
- [ ] Verify upload directory permissions

### Upload Errors

```bash
# Fix permissions
docker exec myprodusen-app chown -R nextjs:nodejs /app/uploads
docker exec myprodusen-app chmod -R 755 /app/uploads
```

---

## Performance Optimization

### After 1 Month

- [ ] Review slow queries
- [ ] Add database indexes if needed
- [ ] Configure CDN for static assets
- [ ] Enable gzip compression
- [ ] Optimize image uploads
- [ ] Review and optimize bundle size

### Database Optimization

```sql
-- Add indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date 
  ON "Attendance"("employeeId", "checkInTime");

CREATE INDEX IF NOT EXISTS idx_leave_employee_status 
  ON "LeaveRequest"("employeeId", "status");
```

---

## Documentation

### Keep Updated

- [ ] Document custom configurations
- [ ] Update environment variables list
- [ ] Document backup procedures
- [ ] Document rollback procedures
- [ ] Document admin credentials (securely)

---

## Support Contacts

**Technical Issues:**
- Coolify Docs: https://coolify.io/docs
- Drizzle ORM: https://orm.drizzle.team
- Next.js: https://nextjs.org/docs

**Emergency Contacts:**
- VPS Provider Support
- Database Administrator
- Development Team

---

## Sign-Off

**Deployment Date:** _______________

**Deployed By:** _______________

**Verified By:** _______________

**Status:** 
- [ ] ✅ Production Ready
- [ ] ⚠️ Issues Found (document below)
- [ ] ❌ Rollback Required

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________

---

**Deployment Checklist Complete! 🎉**

Keep this document for future deployments and updates.
