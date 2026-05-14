# 🚀 Quick Start Guide - MyProdusen

## Setup in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
Make sure PostgreSQL is running, then:

```bash
# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL="postgresql://user:password@localhost:5432/myprodusen?schema=public"

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed initial data
npm run prisma:seed
```

### 3. Start Development Server
```bash
npm run dev
```

Visit: http://localhost:3000

## 🧪 Test the API

### Login as Superadmin
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@myprodusen.com",
    "password": "admin123"
  }'
```

Save the token from response.

### Get Profile
```bash
curl http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test Check-In (GPS + Selfie)
```bash
curl -X POST http://localhost:3000/api/attendance/check-in \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "workLocationId": "GET_FROM_SEED_OUTPUT",
    "latitude": 3.5953,
    "longitude": 98.6723,
    "accuracy": 10.5,
    "selfie": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "deviceInfo": "Test Device"
  }'
```

## 📋 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Superadmin | admin@myprodusen.com | admin123 |
| Admin HR | hr@myprodusen.com | hr123 |
| Supervisor | supervisor@myprodusen.com | supervisor123 |
| Employee 1 | employee1@myprodusen.com | employee123 |
| Employee 2 | employee2@myprodusen.com | employee123 |

## 🎯 Key Features to Test

### ✅ Authentication
- [x] Login
- [x] Get profile
- [x] Change password

### ✅ Employee Management
- [x] List employees
- [x] Create employee (auto NIP generation)
- [x] Update employee
- [x] View employee details

### ✅ GPS + Selfie Attendance
- [x] Check-in with geo-fencing validation
- [x] Check-out with geo-fencing validation
- [x] View today's attendance
- [x] Automatic late calculation

### ✅ Leave Management
- [x] Submit leave request
- [x] Approve/reject leave
- [x] View leave history

## 🔧 Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Create database manually if needed
createdb myprodusen
```

### Prisma Client Not Generated
```bash
npm run prisma:generate
```

### Migration Failed
```bash
# Reset database (WARNING: deletes all data)
npm run db:reset
```

## 📚 Next Steps

1. **Frontend Development** - Build UI components and pages
2. **Dashboards** - Create role-based dashboards
3. **Reports** - Implement export functionality
4. **Notifications** - Add real-time notifications
5. **Deployment** - Setup VPS + Coolify

## 🆘 Need Help?

Check the full documentation in `README.md` or `prd .md`
