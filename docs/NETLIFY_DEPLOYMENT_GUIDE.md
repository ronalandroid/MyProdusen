# 🚀 Netlify Deployment Guide - MyProdusen

**Date:** 2026-05-15  
**Status:** Ready for Deployment

---

## 📋 Prerequisites

Before deploying to Netlify, ensure you have:

- ✅ GitHub/GitLab/Bitbucket account
- ✅ Netlify account (free tier works)
- ✅ PostgreSQL database (Neon, Supabase, or Railway)
- ✅ Environment variables ready

---

## 🔧 Step 1: Prepare Your Repository

### 1.1 Commit All Changes

```bash
git add .
git commit -m "feat: prepare for Netlify deployment with responsive UI"
git push origin main
```

### 1.2 Verify Files

Ensure these files exist:
- ✅ `netlify.toml` (created)
- ✅ `next.config.js` (updated)
- ✅ `package.json`
- ✅ `.env.example`

---

## 🌐 Step 2: Deploy to Netlify

### Option A: Deploy via Netlify Dashboard (Recommended)

1. **Go to Netlify**
   - Visit https://app.netlify.com
   - Click "Add new site" → "Import an existing project"

2. **Connect Repository**
   - Choose your Git provider (GitHub/GitLab/Bitbucket)
   - Authorize Netlify
   - Select your repository: `MyProdusen`

3. **Configure Build Settings**
   ```
   Build command: npm run build
   Publish directory: .next
   ```

4. **Add Environment Variables**
   Go to "Site settings" → "Environment variables" → "Add a variable"
   
   Required variables:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/database
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars
   NEXTAUTH_URL=https://your-site.netlify.app
   NEXTAUTH_SECRET=your-nextauth-secret-key
   NODE_ENV=production
   ```

   Optional variables:
   ```
   REDIS_URL=redis://your-redis-url (if using Redis)
   ```

5. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete (3-5 minutes)

### Option B: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize Site**
   ```bash
   netlify init
   ```

4. **Set Environment Variables**
   ```bash
   netlify env:set DATABASE_URL "postgresql://user:password@host:5432/database"
   netlify env:set JWT_SECRET "your-super-secret-jwt-key-min-32-chars"
   netlify env:set NEXTAUTH_URL "https://your-site.netlify.app"
   netlify env:set NEXTAUTH_SECRET "your-nextauth-secret-key"
   netlify env:set NODE_ENV "production"
   ```

5. **Deploy**
   ```bash
   netlify deploy --prod
   ```

---

## 🗄️ Step 3: Setup Database

### Option A: Neon (Recommended - Free Tier)

1. Go to https://neon.tech
2. Create a new project
3. Copy the connection string
4. Add to Netlify environment variables as `DATABASE_URL`

### Option B: Supabase

1. Go to https://supabase.com
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (use "Connection pooling" for better performance)
5. Add to Netlify environment variables as `DATABASE_URL`

### Option C: Railway

1. Go to https://railway.app
2. Create a new PostgreSQL database
3. Copy the connection string
4. Add to Netlify environment variables as `DATABASE_URL`

---

## 🔄 Step 4: Run Database Migrations

After deploying, run migrations:

### Option A: Via Netlify Functions (Recommended)

Create a one-time function to run migrations:

```bash
# This will be done automatically on first deploy
# The init script in lib/init.ts handles migrations
```

### Option B: Manually via CLI

```bash
# Set DATABASE_URL locally
export DATABASE_URL="your-production-database-url"

# Run migrations
npm run db:push
```

---

## 🔐 Step 5: Configure Environment Variables

### Required Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
NEXTAUTH_URL=https://your-site.netlify.app
NEXTAUTH_SECRET=your-nextauth-secret-key-minimum-32-chars

# Environment
NODE_ENV=production
```

### Optional Variables

```env
# Redis (for caching)
REDIS_URL=redis://your-redis-url

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000
```

---

## 🧪 Step 6: Test Your Deployment

### 6.1 Check Build Logs

1. Go to Netlify Dashboard
2. Click on your site
3. Go to "Deploys"
4. Check the latest deploy logs

### 6.2 Test the Site

1. **Visit your site**: `https://your-site.netlify.app`

2. **Test pages:**
   - ✅ Splash page: `/`
   - ✅ Login page: `/login`
   - ✅ Dashboard: `/dashboard` (after login)

3. **Test responsive design:**
   - Mobile (< 768px)
   - Tablet (768-1023px)
   - Desktop (1024px+)

4. **Test functionality:**
   - Login/logout
   - Navigation
   - API endpoints
   - Database connections

---

## 🐛 Troubleshooting

### Build Fails

**Error: "Module not found"**
```bash
# Solution: Clear cache and rebuild
netlify build --clear-cache
```

**Error: "Out of memory"**
```bash
# Solution: Increase Node memory in netlify.toml
[build.environment]
  NODE_OPTIONS = "--max-old-space-size=4096"
```

### Database Connection Issues

**Error: "Connection refused"**
- Check DATABASE_URL is correct
- Ensure database allows connections from Netlify IPs
- Verify database is running

**Error: "SSL required"**
- Add `?sslmode=require` to DATABASE_URL
- Example: `postgresql://user:pass@host:5432/db?sslmode=require`

### Environment Variables Not Working

1. Go to Netlify Dashboard
2. Site settings → Environment variables
3. Verify all variables are set
4. Redeploy the site

### Images Not Loading

- Ensure `images.unoptimized = true` in next.config.js
- Check image paths are correct
- Verify images are in `public/` folder

---

## 🔄 Step 7: Setup Continuous Deployment

Netlify automatically deploys when you push to your repository.

### Configure Deploy Contexts

Edit `netlify.toml`:

```toml
# Production deploys
[context.production]
  command = "npm run build"
  
[context.production.environment]
  NODE_ENV = "production"

# Deploy previews (PRs)
[context.deploy-preview]
  command = "npm run build"
  
[context.deploy-preview.environment]
  NODE_ENV = "development"

# Branch deploys
[context.branch-deploy]
  command = "npm run build"
```

---

## 🎯 Step 8: Custom Domain (Optional)

### Add Custom Domain

1. Go to Netlify Dashboard
2. Site settings → Domain management
3. Click "Add custom domain"
4. Enter your domain: `myprodusen.com`
5. Follow DNS configuration instructions

### Enable HTTPS

Netlify automatically provisions SSL certificates via Let's Encrypt.

---

## 📊 Step 9: Monitor Your Site

### Netlify Analytics

1. Go to your site dashboard
2. Click "Analytics"
3. View traffic, performance, and errors

### Setup Alerts

1. Site settings → Notifications
2. Add email notifications for:
   - Deploy failures
   - Deploy success
   - Form submissions

---

## 🚀 Quick Deploy Checklist

- [ ] Repository pushed to GitHub/GitLab/Bitbucket
- [ ] `netlify.toml` configured
- [ ] `next.config.js` updated
- [ ] Database created (Neon/Supabase/Railway)
- [ ] Environment variables set in Netlify
- [ ] Site deployed successfully
- [ ] Database migrations run
- [ ] Site tested (all pages work)
- [ ] Responsive design verified
- [ ] API endpoints tested
- [ ] Custom domain configured (optional)

---

## 📝 Post-Deployment Tasks

### 1. Create Admin User

After first deploy, create an admin user via API or database:

```sql
-- Connect to your database
INSERT INTO users (username, email, password_hash, role)
VALUES ('admin', 'admin@myprodusen.com', 'hashed-password', 'ADMIN');
```

### 2. Test All Features

- [ ] Login/logout
- [ ] Employee management
- [ ] Attendance tracking
- [ ] Leave requests
- [ ] Reports
- [ ] KPI tracking

### 3. Setup Monitoring

- [ ] Enable Netlify Analytics
- [ ] Setup error tracking (Sentry)
- [ ] Configure uptime monitoring

---

## 🔗 Useful Links

- **Netlify Dashboard**: https://app.netlify.com
- **Netlify Docs**: https://docs.netlify.com
- **Next.js on Netlify**: https://docs.netlify.com/frameworks/next-js/
- **Neon Database**: https://neon.tech
- **Supabase**: https://supabase.com

---

## 💡 Tips for Success

1. **Use Environment Variables**: Never commit secrets to Git
2. **Test Locally First**: Run `npm run build` before deploying
3. **Monitor Build Times**: Optimize if builds take > 5 minutes
4. **Use Deploy Previews**: Test changes before merging to main
5. **Enable Branch Deploys**: Test features in isolation
6. **Setup Notifications**: Get alerted on deploy failures
7. **Use Netlify Functions**: For serverless API endpoints
8. **Enable Analytics**: Monitor site performance

---

## 🎊 Success!

Once deployed, your MyProdusen HRIS application will be live at:

**URL**: `https://your-site.netlify.app`

Features:
- ✅ Mobile-first responsive design
- ✅ Fast global CDN
- ✅ Automatic HTTPS
- ✅ Continuous deployment
- ✅ Deploy previews for PRs
- ✅ Serverless functions
- ✅ Form handling
- ✅ Analytics

---

## 📞 Support

**Need Help?**
- Netlify Support: https://answers.netlify.com
- Netlify Status: https://www.netlifystatus.com
- Documentation: Check the docs above

---

**Status:** ✅ Ready to Deploy  
**Platform:** Netlify  
**Build Time:** ~3-5 minutes  
**Cost:** Free tier available  

---

**🚀 Happy Deploying! Your MyProdusen app is ready for the world! 🚀**

