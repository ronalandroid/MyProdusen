# Production Deployment Guide — MyProdusen

Last updated: 2026-05-15

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL 15+ database (managed or self-hosted)
- Domain name with SSL certificate
- Coolify or similar deployment platform (optional)
- Minimum 2GB RAM, 2 CPU cores, 20GB storage

## Environment Variables

Create a `.env` file with the following variables:

```bash
# Database (REQUIRED)
DATABASE_URL="postgresql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:5432/<DB_NAME>?schema=public"

# JWT Secret (REQUIRED - minimum 32 characters)
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"

# App Configuration
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
PORT=3000

# Upload Storage
UPLOAD_DIR="/app/uploads"
MAX_UPLOAD_SIZE="5242880"

# Geo-fencing
DEFAULT_GEOFENCE_RADIUS=100

# Session
SESSION_TIMEOUT_HOURS=8

# Redis Cache (Optional but recommended)
REDIS_URL="redis://redis:6379"
REDIS_PASSWORD=""
REDIS_DB="0"
REDIS_MAX_RETRIES="3"
CACHE_ENABLED="true"
CACHE_DEFAULT_TTL="300"

# Initial Superadmin (Only for first deployment)
# REMOVE AFTER FIRST DEPLOYMENT
SUPERADMIN_EMAIL="admin@yourdomain.com"
SUPERADMIN_PASSWORD=<STRONG_SUPERADMIN_PASSWORD>
```

## Security Checklist

### Before Deployment

- [ ] Generate strong JWT_SECRET (minimum 32 characters)
- [ ] Use strong database password
- [ ] Set NODE_ENV=production
- [ ] Configure HTTPS/SSL certificate
- [ ] Review and set proper CORS origins
- [ ] Remove or change default superadmin credentials
- [ ] Ensure DATABASE_URL uses SSL in production
- [ ] Set secure cookie settings (httpOnly, secure, sameSite)

### After Deployment

- [ ] Change default superadmin password immediately
- [ ] Test authentication and authorization
- [ ] Verify geo-fencing works correctly
- [ ] Test file upload and storage
- [ ] Configure backup schedule
- [ ] Set up monitoring and alerts
- [ ] Review audit logs regularly

## Deployment Steps

### Option 1: Docker Compose (Recommended)

1. **Clone repository and prepare environment**

```bash
git clone <repository-url>
cd MyProdusen
cp .env.example .env
# Edit .env with production values
```

2. **Build Docker image**

```bash
docker build -t myprodusen:latest .
```

3. **Run database migrations**

```bash
# Ensure database is accessible
docker run --rm \
  --env-file .env \
  myprodusen:latest \
  npm run db:migrate
```

4. **Start application**

```bash
docker-compose up -d
```

5. **Verify deployment**

```bash
curl http://localhost:3000/api/health
```

### Option 2: Coolify Deployment

1. **Create new service in Coolify**
   - Service Type: Docker
   - Repository: Your Git repository
   - Branch: main or production

2. **Configure environment variables**
   - Add all required environment variables from `.env.example`
   - Ensure JWT_SECRET is strong and unique

3. **Configure persistent volume**
   - Mount `/app/uploads` to persistent storage
   - Ensure proper permissions (user: nextjs, uid: 1001)

4. **Configure build settings**
   - Build Command: `npm run build`
   - Start Command: `node server.js`
   - Port: 3000

5. **Run migrations**
   - Add pre-deployment command: `npm run db:migrate`

6. **Deploy**
   - Click "Deploy" and monitor logs

### Option 3: Manual VPS Deployment

1. **Install Node.js 22+**

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **Install PM2**

```bash
sudo npm install -g pm2
```

3. **Clone and setup**

```bash
git clone <repository-url>
cd MyProdusen
npm ci --only=production
cp .env.example .env
# Edit .env with production values
```

4. **Build application**

```bash
npm run build
```

5. **Run migrations**

```bash
npm run db:migrate
```

6. **Start with PM2**

```bash
pm2 start npm --name "myprodusen" -- start
pm2 save
pm2 startup
```

7. **Configure Nginx reverse proxy**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /uploads {
        alias /path/to/MyProdusen/public/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

8. **Setup SSL with Certbot**

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Database Setup

### Initial Migration

```bash
npm run db:migrate
```

### Seed Initial Data (Optional)

```bash
# Only run on first deployment
npm run db:seed
```

**WARNING**: The seed script creates demo users with weak passwords. Change all passwords immediately after seeding.

### Backup Strategy

1. **Automated PostgreSQL backups**

```bash
# Add to crontab
0 2 * * * pg_dump -U user -h host myprodusen | gzip > /backups/myprodusen_$(date +\%Y\%m\%d).sql.gz
```

2. **Backup uploads directory**

```bash
# Add to crontab
0 3 * * * tar -czf /backups/uploads_$(date +\%Y\%m\%d).tar.gz /app/uploads
```

3. **Retention policy**
   - Keep daily backups for 7 days
   - Keep weekly backups for 4 weeks
   - Keep monthly backups for 12 months

## Monitoring

### Health Check Endpoint

```bash
curl https://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-05-15T12:00:00.000Z",
  "database": "connected"
}
```

### Application Logs

```bash
# Docker
docker logs -f myprodusen

# PM2
pm2 logs myprodusen

# Check for errors
pm2 logs myprodusen --err
```

### Key Metrics to Monitor

- Response time (should be < 500ms for most requests)
- Error rate (should be < 1%)
- Database connection pool usage
- Memory usage (should stay under 80%)
- Disk space (especially /uploads directory)
- Failed login attempts (potential security issue)

## Troubleshooting

### Application won't start

1. Check environment variables are set correctly
2. Verify database connection: `psql $DATABASE_URL`
3. Check logs for specific errors
4. Ensure port 3000 is not already in use

### Database connection errors

1. Verify DATABASE_URL format
2. Check database server is running
3. Verify network connectivity
4. Check database user permissions
5. Ensure SSL is configured if required

### File upload errors

1. Check UPLOAD_DIR exists and is writable
2. Verify MAX_UPLOAD_SIZE is appropriate
3. Check disk space availability
4. Ensure proper permissions (uid 1001 for Docker)

### Geo-fencing not working

1. Verify work locations have correct coordinates
2. Check DEFAULT_GEOFENCE_RADIUS is appropriate
3. Test with known coordinates
4. Verify GPS accuracy threshold

## Rollback Procedure

### Quick Rollback

```bash
# Docker
docker-compose down
docker-compose up -d --force-recreate

# PM2
pm2 stop myprodusen
git checkout <previous-commit>
npm ci
npm run build
pm2 restart myprodusen
```

### Database Rollback

```bash
# Restore from backup
gunzip < /backups/myprodusen_YYYYMMDD.sql.gz | psql $DATABASE_URL
```

## Performance Optimization

### Enable Redis Caching

1. Install Redis
2. Set CACHE_ENABLED=true
3. Configure REDIS_URL
4. Monitor cache hit rate

### Database Optimization

1. Add indexes for frequently queried columns
2. Enable connection pooling
3. Regular VACUUM and ANALYZE
4. Monitor slow queries

### CDN for Static Assets

1. Configure CDN for /uploads directory
2. Set appropriate cache headers
3. Enable gzip compression

## Security Hardening

### Rate Limiting

Rate limiting is built-in for:
- Login: 5 attempts per 15 minutes
- Registration: 3 per hour
- Password reset: 3 per hour
- Attendance: 5 per hour

### Regular Security Tasks

- [ ] Review audit logs weekly
- [ ] Update dependencies monthly
- [ ] Rotate JWT_SECRET every 6 months
- [ ] Review user permissions quarterly
- [ ] Test backup restoration quarterly
- [ ] Security audit annually

### Firewall Rules

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

## Maintenance

### Update Application

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm ci

# Run migrations
npm run db:migrate

# Build
npm run build

# Restart
pm2 restart myprodusen
# or
docker-compose restart
```

### Database Maintenance

```bash
# Vacuum database
psql $DATABASE_URL -c "VACUUM ANALYZE;"

# Check database size
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size('myprodusen'));"
```

### Clean Old Files

```bash
# Remove old attendance selfies (older than 90 days)
find /app/uploads/attendance -type f -mtime +90 -delete
```

## Support

For issues or questions:
1. Check logs first
2. Review this deployment guide
3. Check docs/CURRENT_STATE.md
4. Contact system administrator

## Appendix

### Useful Commands

```bash
# Check application status
curl http://localhost:3000/api/health

# View real-time logs
docker logs -f myprodusen

# Database shell
psql $DATABASE_URL

# Check disk usage
df -h

# Check memory usage
free -h

# List running processes
pm2 list
```

### Environment Variable Reference

See `.env.example` for complete list with descriptions.
