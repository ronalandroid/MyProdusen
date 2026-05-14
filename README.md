# MyProdusen - Employee Management System

**Employee Management System for Produsen Dimsum Medan**

Modern web application for managing employee attendance, KPI tracking, leave requests, and HR operations with GPS-based geofencing and real-time monitoring.

---

## 🚀 Tech Stack

### Core
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 6
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Styling:** Tailwind CSS 3

### Backend
- **Authentication:** JWT + bcryptjs
- **Validation:** Zod
- **Database Client:** postgres (node-postgres)
- **Geolocation:** Custom geofencing utilities

### Frontend
- **UI Components:** React 19
- **Forms:** React Hook Form
- **State Management:** TanStack Query
- **Icons:** Lucide React

### DevOps
- **Deployment:** Coolify (Docker-based)
- **Hosting:** VPS (Ubuntu 22.04+)
- **Database Migrations:** Drizzle Kit
- **Testing:** Vitest

---

## 📋 Features

### ✅ Implemented (MVP)

**Authentication & Authorization**
- JWT-based authentication
- Role-based access control (RBAC)
- 4 user roles: Superadmin, Admin HR, Supervisor, Employee
- Secure password hashing with bcrypt

**Employee Management**
- CRUD operations for employees
- Auto-generated NIP (Employee ID)
- Supervisor assignment
- Division and position tracking
- Profile photo upload

**Attendance System**
- GPS-based check-in/check-out
- Geofencing validation (radius-based)
- Selfie capture for verification
- Late/early leave calculation
- Shift management
- Work location management

**Leave Management**
- Leave/sick/permission requests
- Approval workflow
- Supervisor/HR approval
- Status tracking (pending/approved/rejected)

**Work Locations**
- Multiple location support
- GPS coordinates (latitude/longitude)
- Configurable geofence radius
- Active/inactive status

**Shifts**
- Multiple shift support
- Configurable start/end times
- Employee shift assignment

**KPI System**
- KPI template creation
- Multiple scoring types (higher/lower/boolean)
- Weighted scoring
- KPI assignment to employees
- Period-based tracking

### 🔜 Planned (Phase 2)

- Reports & analytics
- CSV/Excel export
- Audit log UI
- Notification system
- QR code attendance
- Face matching for selfies
- Anti-fake GPS detection
- WhatsApp notifications
- Payroll integration

---

## 📚 Documentation

### Quick Start
- **[Installation Guide](docs/INSTALLATION.md)** - Local development setup
- **[Coolify Deployment](docs/COOLIFY_DEPLOYMENT.md)** - Production deployment guide
- **[Drizzle Migration](docs/DRIZZLE_MIGRATION.md)** - ORM migration details

### Project Documentation
- **[PRD](docs/prd.md)** - Product requirements and specifications
- **[Current State](docs/CURRENT_STATE.md)** - Implementation status
- **[Implementation Plan](docs/IMPLEMENTATION_PLAN.md)** - Development roadmap
- **[API Gap Matrix](docs/API_GAP_MATRIX.md)** - API coverage status

### Development
- **[AGENTS.md](AGENTS.md)** - AI agent development guidelines

---

## 🛠️ Local Development

### Prerequisites

- Node.js 22+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd MyProdusen
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Setup database**
   ```bash
   # Push schema to database
   npm run db:push
   
   # Seed with demo data
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open browser**
   ```
   http://localhost:3000
   ```

### Default Login Credentials

After seeding:

| Role | Email | Password |
|------|-------|----------|
| Superadmin | admin@myprodusen.com | admin123 |
| Admin HR | hr@myprodusen.com | hr123 |
| Supervisor | supervisor@myprodusen.com | supervisor123 |
| Employee 1 | employee1@myprodusen.com | employee123 |
| Employee 2 | employee2@myprodusen.com | employee123 |

⚠️ **Change these passwords in production!**

---

## 📦 NPM Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # TypeScript type checking
npm run test         # Run tests
```

### Database
```bash
npm run db:generate  # Generate migration files
npm run db:migrate   # Apply migrations
npm run db:push      # Push schema (dev only)
npm run db:studio    # Open Drizzle Studio
npm run db:seed      # Seed database
```

---

## 🏗️ Project Structure

```
MyProdusen/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── employees/       # Employee management
│   │   ├── attendance/      # Attendance tracking
│   │   ├── leave/           # Leave requests
│   │   ├── shifts/          # Shift management
│   │   └── work-locations/  # Location management
│   ├── dashboard/           # Dashboard pages
│   ├── login/               # Login page
│   └── layout.tsx           # Root layout
├── features/                # Feature modules
│   ├── auth/                # Auth service
│   ├── employees/           # Employee service
│   ├── attendance/          # Attendance service
│   ├── leave/               # Leave service
│   ├── shifts/              # Shift service
│   └── work-locations/      # Location service
├── lib/                     # Shared utilities
│   ├── db.ts                # Drizzle client
│   ├── auth.ts              # JWT utilities
│   ├── middleware.ts        # Auth middleware
│   ├── permissions.ts       # RBAC logic
│   ├── geofencing.ts        # GPS utilities
│   ├── upload.ts            # File upload
│   ├── utils/               # Helper functions
│   └── validations/         # Zod schemas
├── drizzle/                 # Database
│   ├── schema.ts            # Database schema
│   ├── seed.ts              # Seed script
│   └── migrations/          # Migration files
├── docs/                    # Documentation
├── Dockerfile               # Docker configuration
├── drizzle.config.ts        # Drizzle configuration
└── package.json             # Dependencies
```

---

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with salt rounds
- **RBAC** - Role-based access control
- **Input Validation** - Zod schema validation
- **SQL Injection Protection** - Drizzle ORM parameterized queries
- **Geofencing** - GPS-based location verification
- **Selfie Verification** - Photo capture for attendance
- **Audit Logging** - Track all critical actions (planned)

---

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test -- --coverage
```

**Current Test Coverage:**
- ✅ Geofencing calculations
- ✅ Date utilities
- ✅ KPI scoring
- ✅ Permissions logic

---

## 🚀 Deployment

### VPS + Coolify (Recommended)

See **[Coolify Deployment Guide](docs/COOLIFY_DEPLOYMENT.md)** for detailed instructions.

**Quick Deploy:**
1. Install Coolify on VPS
2. Create PostgreSQL database
3. Connect Git repository
4. Configure environment variables
5. Deploy application
6. Run migrations
7. Seed database

### Docker

```bash
# Build image
docker build -t myprodusen .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  myprodusen
```

---

## 🤝 Contributing

This is a private project for Produsen Dimsum Medan. For internal development guidelines, see [AGENTS.md](AGENTS.md).

---

## 📄 License

ISC License - Produsen Dimsum Medan

---

## 🆘 Support

For issues or questions:
1. Check [documentation](docs/)
2. Review [current state](docs/CURRENT_STATE.md)
3. Contact development team

---

## 📊 Project Status

**Version:** 1.0.0  
**Status:** ✅ MVP Complete - Ready for Production  
**Last Updated:** 2026-05-15

**Build Status:**
- ✅ TypeScript compilation: Passing
- ✅ Tests: 22/22 passing
- ✅ Build: Successful
- ✅ Drizzle ORM: Migrated

**Next Milestones:**
1. Production deployment on VPS
2. Security hardening (httpOnly cookies, rate limiting)
3. KPI API implementation
4. Reports & export features
5. Notification system

---

**Built with ❤️ for Produsen Dimsum Medan**
