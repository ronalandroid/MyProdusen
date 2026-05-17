# Production Checklist — MyProdusen

Last updated: 2026-05-15

## Pre-Deployment Security

### Environment Variables
- [ ] `JWT_SECRET` is at least 32 characters and cryptographically random
- [ ] `JWT_SECRET` is NOT the default value from `.env.example`
- [ ] `DATABASE_URL` uses strong password (16+ chars, mixed case, numbers, symbols)
- [ ] `SUPERADMIN_EMAIL` and `SUPERADMIN_PASSWORD` are removed or changed from defaults
- [ ] All environment variables validated via `lib/env.ts` on startup
- [ ] `.env` file is NOT committed to git
- [ ] `.env.example` contains no real secrets

### Database Security
- [ ] Production database uses SSL/TLS connection
- [ ] Database user has minimum required privileges (no SUPERUSER)
- [ ] Database backups are configured and tested
- [ ] Initial migration `0000_clean_mad_thinker.sql` is committed and applied
- [ ] Attendance unique constraint exists: `Attendance_employeeId_checkInDate_key`
- [ ] All indexes are created for performance (see `drizzle/schema.ts`)

### Authentication & Authorization
- [ ] `requireAuth` middleware fetches active user/role from database
- [ ] All API routes use `requireAuth` for protected endpoints
- [ ] Role hierarchy enforced: cannot create users with higher privileges
- [ ] Session timeout configured via `SESSION_TIMEOUT_HOURS`
- [ ] Password hashing uses bcrypt with appropriate cost factor
- [ ] Login rate limiting implemented (Phase 2)
- [ ] Password policy enforced: min 12 chars, complexity rules (Phase 2)

### File Upload Security
- [ ] `UPLOAD_DIR` is writable by application user
- [ ] `UPLOAD_DIR` is backed up regularly
- [ ] File size limit enforced via `MAX_UPLOAD_SIZE`
- [ ] File type validation for selfie uploads
- [ ] Uploaded files stored outside public web root or served with proper headers
- [ ] Selfie images stored as file paths, not data URLs in database

### RBAC & Data Access
- [ ] Superadmin: full access verified
- [ ] Admin HR: can manage employees, attendance, shifts, locations, leave
- [ ] Supervisor: row-level filtering for team members only
- [ ] Employee: can only access own data
- [ ] All mutations write to audit log (Phase 3)

## Build & Deployment

### Build Validation
- [ ] `npm run lint` passes (TypeScript type check)
- [ ] `npm run build` completes successfully with webpack
- [ ] Build uses `output: 'standalone'` for Docker optimization
- [ ] No sensitive data in build output or client bundles
- [ ] `outputFileTracingRoot` set to avoid lockfile warnings

### Docker & Container
- [ ] Dockerfile builds successfully: `docker build -t myprodusen .`
- [ ] Container runs locally: `docker run -p 3000:3000 --env-file .env myprodusen`
- [ ] Health check endpoint responds: `curl http://localhost:3000/api/health`
- [ ] Database migrations run before app starts: `npx drizzle-kit migrate`
- [ ] Upload volume mounted persistently: `/app/uploads`
- [ ] Container runs as non-root user (nextjs:nodejs)
- [ ] Container restarts on failure

### Coolify / Production Server
- [ ] Environment variables configured in Coolify dashboard
- [ ] Persistent volume mapped for `/app/uploads`
- [ ] Database connection tested from container
- [ ] HTTPS/TLS certificate configured
- [ ] Domain name configured and DNS resolves
- [ ] Firewall rules allow only necessary ports (443, 80)
- [ ] Server has sufficient resources (2GB+ RAM, 20GB+ disk)

## Runtime Monitoring

### Health & Observability
- [ ] Health check endpoint monitored: `/api/health`
- [ ] Database connectivity checked in health endpoint
- [ ] Disk space monitored (upload directory)
- [ ] Memory usage tracked
- [ ] Application logs collected and retained
- [ ] Error tracking configured (Sentry, LogRocket, etc.)
- [ ] Uptime monitoring configured (UptimeRobot, Pingdom, etc.)

### Performance
- [ ] Database query performance acceptable (<500ms p95)
- [ ] API response times acceptable (<1s p95)
- [ ] Geofencing calculations optimized
- [ ] Indexes exist for all foreign keys and frequently queried columns
- [ ] Connection pooling configured for database

## Data Management

### Backup & Recovery
- [ ] Database backup schedule configured (daily minimum)
- [ ] Backup restoration tested successfully
- [ ] Upload files backed up separately from database
- [ ] Backup retention policy documented (30 days minimum)
- [ ] Disaster recovery plan documented
- [ ] RTO (Recovery Time Objective) defined and tested
- [ ] RPO (Recovery Point Objective) defined and acceptable

### Data Retention
- [ ] Audit log retention policy defined (1 year minimum)
- [ ] Attendance records retention policy defined (3 years minimum)
- [ ] Leave request retention policy defined (2 years minimum)
- [ ] Soft delete strategy implemented for employees
- [ ] GDPR/data privacy compliance reviewed (if applicable)

## Functional Validation

### Core Features
- [ ] User registration and login work
- [ ] Password change works
- [ ] Employee CRUD operations work
- [ ] Work location CRUD with geofencing works
- [ ] Shift management works
- [ ] Attendance check-in with GPS + selfie works
- [ ] Attendance check-out with GPS + selfie works
- [ ] Geofence validation enforced (within radius)
- [ ] Leave request submission works
- [ ] Leave approval/rejection works
- [ ] Dashboard displays correct data for each role

### Edge Cases
- [ ] Duplicate attendance prevented (one check-in per employee per day)
- [ ] Inactive users cannot login
- [ ] Expired sessions redirect to login
- [ ] Invalid GPS coordinates rejected
- [ ] Out-of-geofence attendance rejected
- [ ] File upload size limit enforced
- [ ] Invalid file types rejected
- [ ] Concurrent requests handled safely

## Security Hardening

### Network Security
- [ ] HTTPS enforced (no HTTP access)
- [ ] HSTS header configured
- [ ] CSP (Content Security Policy) configured
- [ ] CORS configured appropriately
- [ ] Rate limiting on login endpoint (Phase 2)
- [ ] DDoS protection configured (Cloudflare, etc.)

### Application Security
- [ ] SQL injection prevented (parameterized queries via Drizzle ORM)
- [ ] XSS prevented (React escaping + CSP)
- [ ] CSRF protection implemented (SameSite cookies)
- [ ] Sensitive data not logged
- [ ] Error messages don't leak implementation details
- [ ] Dependencies scanned for vulnerabilities: `npm audit`
- [ ] Security headers configured (X-Frame-Options, X-Content-Type-Options)

### Secrets Management
- [ ] Secrets not in source code
- [ ] Secrets not in Docker image layers
- [ ] Secrets rotated regularly (JWT_SECRET, DB password)
- [ ] Access to secrets limited to authorized personnel
- [ ] Secrets stored in secure vault (Coolify secrets, AWS Secrets Manager, etc.)

## Post-Deployment

### Smoke Tests
- [ ] Login as Superadmin works
- [ ] Login as Admin HR works
- [ ] Login as Supervisor works
- [ ] Login as Employee works
- [ ] Create test employee works
- [ ] Submit test attendance works
- [ ] Submit test leave request works
- [ ] Dashboard loads without errors

### Documentation
- [ ] Deployment process documented
- [ ] Rollback procedure documented
- [ ] Incident response plan documented
- [ ] Admin user guide available
- [ ] API documentation up to date
- [ ] Architecture diagram available

### Handoff
- [ ] Production credentials shared securely with client
- [ ] Monitoring access granted to operations team
- [ ] Support contact information documented
- [ ] Maintenance schedule communicated
- [ ] Training provided to administrators
- [ ] User acceptance testing completed

## Phase 2+ Features (Future)

- [ ] Login rate limiting implemented
- [ ] Strong password policy enforced
- [ ] Audit log API and UI implemented
- [ ] KPI API routes implemented
- [ ] Report export (CSV/Excel) implemented
- [ ] Notification service implemented
- [ ] QR code attendance (optional)
- [ ] Face matching for selfies (optional)
- [ ] Anti-fake GPS detection (optional)

## Emergency Contacts

- **Technical Lead:** [Name, Email, Phone]
- **Database Admin:** [Name, Email, Phone]
- **Hosting Provider:** Coolify / [Provider Name]
- **Domain Registrar:** [Provider Name]
- **SSL Certificate:** [Provider Name]

## Rollback Plan

If critical issues occur post-deployment:

1. **Immediate:** Revert to previous Docker image tag
2. **Database:** Restore from last known good backup
3. **Uploads:** Restore upload directory from backup
4. **Verify:** Run smoke tests on rolled-back version
5. **Communicate:** Notify stakeholders of rollback
6. **Investigate:** Root cause analysis in separate environment
7. **Fix Forward:** Apply fix and re-deploy when ready

## Sign-Off

- [ ] Technical Lead approval
- [ ] Security review completed
- [ ] Client acceptance received
- [ ] Production deployment authorized

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Approved By:** _______________
