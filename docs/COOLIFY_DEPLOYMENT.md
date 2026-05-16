# 🚀 Panduan Deploy MyProdusen ke VPS + Coolify

**Domain:** `myprodusen.online`  
**Stack:** Next.js 16 + Drizzle ORM + PostgreSQL + Redis + Docker  
**Last Updated:** 2026-05-16

---

## Arsitektur Deployment

```
┌─────────────────────────────────────────────────────┐
│                     VPS Server                       │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │              Coolify (Port 8000)              │   │
│  │                                               │   │
│  │  ┌─────────────┐  ┌──────────┐  ┌─────────┐ │   │
│  │  │ MyProdusen   │  │PostgreSQL│  │  Redis  │ │   │
│  │  │ (Next.js)    │→ │  (DB)    │  │ (Cache) │ │   │
│  │  │ Port 3000    │  │ Port 5432│  │Port 6379│ │   │
│  │  └─────────────┘  └──────────┘  └─────────┘ │   │
│  │                                               │   │
│  │  ┌─────────────────────────────────────────┐ │   │
│  │  │ Traefik Reverse Proxy (Auto SSL)        │ │   │
│  │  │ myprodusen.online → MyProdusen:3000     │ │   │
│  │  └─────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Prerequisites

- [x] VPS dengan minimal **2 vCPU, 4GB RAM, 50GB SSD**
- [x] Ubuntu 22.04+ atau Debian 12+
- [x] Domain `myprodusen.online` sudah dibeli
- [x] Akses SSH ke VPS (`ssh root@IP_VPS`)
- [x] Repo GitHub: `ronalandroid/MyProdusen`

---

## Step 1: Install Coolify di VPS

SSH ke VPS:

```bash
ssh root@YOUR_VPS_IP
```

Install Coolify (one-command):

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Tunggu selesai (~2-3 menit), lalu akses:

```
http://YOUR_VPS_IP:8000
```

Buat akun admin Coolify di sana.

---

## Step 2: Setting DNS Domain

Di panel DNS registrar kamu (Niagahoster/Namecheap/Cloudflare), tambahkan:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| **A** | `@` | `YOUR_VPS_IP` | 300 |
| **A** | `www` | `YOUR_VPS_IP` | 300 |

> Tunggu propagasi DNS 5-30 menit. Cek dengan: `ping myprodusen.online`

---

## Step 3: Buat Database PostgreSQL di Coolify

1. Login ke Coolify → **Databases** → **+ New**
2. Pilih **PostgreSQL**
3. Isi:
   - **Name:** `myprodusen-db`
   - **Database:** `myprodusen`
   - **Username:** `myprodusen_user`
   - **Password:** *(generate password kuat)*
4. Klik **Deploy**
5. Catat **Internal URL**-nya:
   ```
   postgresql://myprodusen_user:PASSWORD@myprodusen-db:5432/myprodusen
   ```

---

## Step 4: Buat Database Redis di Coolify

1. **Databases** → **+ New** → **Redis**
2. Isi:
   - **Name:** `myprodusen-redis`
   - **Password:** *(kosong atau generate)*
3. Klik **Deploy**
4. Catat **Internal URL**-nya:
   ```
   redis://myprodusen-redis:6379
   ```

---

## Step 5: Deploy Aplikasi MyProdusen

### 5a. Connect GitHub Repository

1. Di Coolify → **Projects** → **+ New Project** → beri nama `MyProdusen`
2. Di project, klik **+ New Resource** → **Application**
3. Pilih **GitHub** → connect akun GitHub kamu
4. Pilih repo: **`ronalandroid/MyProdusen`**
5. Branch: **`main`**

### 5b. Build Configuration

Di tab **General**:

| Setting | Value |
|---------|-------|
| **Build Pack** | Dockerfile |
| **Dockerfile Location** | `/Dockerfile` |
| **Port** | `3000` |

> ⚠️ **Pilih "Dockerfile"**, bukan Nixpacks. Dockerfile kita sudah dioptimasi dengan entrypoint yang otomatis push schema ke database.

### 5c. Environment Variables

Di tab **Environment Variables**, tambahkan SEMUA ini:

```env
# Database — ganti dengan Internal URL dari Step 3
DATABASE_URL=postgresql://myprodusen_user:PASSWORD@myprodusen-db:5432/myprodusen

# Redis — ganti dengan Internal URL dari Step 4
REDIS_URL=redis://myprodusen-redis:6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_MAX_RETRIES=3
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=300

# JWT Secret — WAJIB GANTI! Generate dengan:
# openssl rand -base64 48
JWT_SECRET=GANTI_INI_DENGAN_SECRET_KUAT_MINIMAL_32_KARAKTER

# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://myprodusen.online
APP_URL=https://myprodusen.online

# Upload
UPLOAD_DIR=/app/uploads
MAX_UPLOAD_SIZE=5242880

# Geo-fencing
DEFAULT_GEOFENCE_RADIUS=100

# Session
SESSION_TIMEOUT_HOURS=8

# Superadmin (hanya untuk pertama kali)
SUPERADMIN_EMAIL=produsendimsumm@gmail.com
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=GANTI_PASSWORD_KUAT_12_KARAKTER

# Email
RESEND_API_KEY=re_YOUR_REAL_API_KEY
RESEND_FROM_EMAIL=MyProdusen <noreply@myprodusen.online>
```

### 5d. Persistent Storage (Upload Selfie)

Di tab **Storages** → **+ Add**:

| Setting | Value |
|---------|-------|
| **Name** | `uploads` |
| **Source Path** | `/var/lib/coolify/volumes/myprodusen-uploads` |
| **Destination Path** | `/app/uploads` |

### 5e. Set Domain

Di tab **Domains**:

| Setting | Value |
|---------|-------|
| **Domain** | `myprodusen.online` |

Coolify akan otomatis:
- Konfigurasi Traefik reverse proxy
- Generate SSL certificate via Let's Encrypt
- Redirect HTTP → HTTPS

### 5f. Deploy! 🚀

Klik tombol **Deploy**. Tunggu build selesai (~3-5 menit).

---

## Step 6: Verifikasi Deployment

### Health Check

```bash
curl https://myprodusen.online/api/health
```

Response yang diharapkan:
```json
{
  "status": "ok",
  "timestamp": "2026-05-16T...",
  "checks": {
    "database": { "status": "ok" },
    "redis": { "status": "ok" },
    "disk": { "status": "ok" }
  }
}
```

### Test Login

Buka browser: **https://myprodusen.online**

Login dengan:
- Email: `produsendimsumm@gmail.com`
- Password: *(password yang kamu set di SUPERADMIN_PASSWORD)*

> ⚠️ **SEGERA GANTI PASSWORD** setelah login pertama!

---

## Step 7: Auto-Deploy (Opsional tapi Direkomendasikan)

Di Coolify → Settings aplikasi:

1. Enable **Auto Deploy on Push**
2. Sekarang setiap `git push origin main` akan otomatis deploy

Workflow development:

```bash
# Buat perubahan...
git add .
git commit -m "feat: fitur baru"
git push origin main
# → Coolify otomatis build & deploy!
```

---

## Step 8: Security Checklist

Setelah deploy, pastikan:

- [ ] JWT_SECRET sudah diganti (bukan default)
- [ ] SUPERADMIN_PASSWORD sudah diganti (min 12 karakter)
- [ ] Password superadmin sudah diganti di web setelah login
- [ ] HTTPS aktif (cek gembok di browser)
- [ ] Firewall VPS aktif:
  ```bash
  ufw allow 22/tcp    # SSH
  ufw allow 80/tcp    # HTTP
  ufw allow 443/tcp   # HTTPS
  ufw allow 8000/tcp  # Coolify Dashboard
  ufw enable
  ```
- [ ] Database backup terjadwal

---

## Database Backup Otomatis

SSH ke VPS dan buat script backup:

```bash
cat > /root/backup-myprodusen.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/myprodusen"
mkdir -p $BACKUP_DIR

# Ganti container name sesuai di Coolify
docker exec myprodusen-db pg_dump -U myprodusen_user myprodusen > $BACKUP_DIR/backup_$DATE.sql

# Compress
gzip $BACKUP_DIR/backup_$DATE.sql

# Hapus backup > 14 hari
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +14 -delete

echo "✅ Backup selesai: $BACKUP_DIR/backup_$DATE.sql.gz"
EOF

chmod +x /root/backup-myprodusen.sh
```

Jadwalkan di crontab:

```bash
crontab -e
# Tambahkan:
0 2 * * * /root/backup-myprodusen.sh
```

---

## Restore Database

```bash
# Decompress
gunzip backup_YYYYMMDD_HHMMSS.sql.gz

# Restore
cat backup_YYYYMMDD_HHMMSS.sql | docker exec -i myprodusen-db psql -U myprodusen_user -d myprodusen
```

---

## Monitoring & Logs

### Lihat Logs di Coolify
- Klik aplikasi → tab **Logs**
- Filter: error / warning / info

### Lihat Logs via SSH
```bash
# Logs aplikasi
docker logs myprodusen-app --tail 100 -f

# Logs database
docker logs myprodusen-db --tail 50

# Logs Redis
docker logs myprodusen-redis --tail 50
```

### Cek Resource
```bash
docker stats --no-stream
```

### Cek Database Size
```bash
docker exec myprodusen-db psql -U myprodusen_user -d myprodusen -c "SELECT pg_size_pretty(pg_database_size('myprodusen'));"
```

---

## Troubleshooting

### Build Gagal

**Cek build logs di Coolify.** Masalah umum:

1. **npm install error** → pastikan `package.json` dan `package-lock.json` ter-commit
2. **TypeScript error** → `ignoreBuildErrors: true` sudah di-set, tapi cek jika ada error fatal
3. **Out of memory** → tambah RAM VPS atau set `NODE_OPTIONS=--max-old-space-size=2048`

### Database Connection Error

```bash
# Cek apakah DB container running
docker ps | grep postgres

# Test koneksi manual
docker exec myprodusen-db psql -U myprodusen_user -d myprodusen -c "SELECT 1;"

# Cek env var di container app
docker exec myprodusen-app printenv DATABASE_URL
```

### Upload Tidak Bisa

```bash
# Cek volume mount
docker inspect myprodusen-app | grep -A5 "Mounts"

# Fix permissions
docker exec -u root myprodusen-app chown -R nextjs:nodejs /app/uploads
```

### App Crash Loop

```bash
# Lihat error terakhir
docker logs myprodusen-app --tail 200

# Masalah umum:
# - Missing env vars → cek semua env di Coolify
# - DB belum ready → Coolify mungkin perlu restart urutan service
```

---

## Rollback

### Via Coolify
1. Tab **Deployments**
2. Cari deployment sebelumnya yang sukses
3. Klik **Redeploy**

### Via Git
```bash
git revert HEAD
git push origin main
# → Coolify otomatis deploy versi reverted
```

---

## Rekomendasi VPS

| Skala | vCPU | RAM | SSD | Biaya/bulan |
|-------|------|-----|-----|-------------|
| 10-20 karyawan | 2 | 4 GB | 50 GB | ~$10-20 |
| 50-100 karyawan | 4 | 8 GB | 100 GB | ~$40-60 |

Provider recommended: **Hetzner, DigitalOcean, Vultr, IDCloudhost**

---

**✅ Deployment Guide Complete — MyProdusen siap di-deploy ke myprodusen.online!**
