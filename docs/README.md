# MyProdusen - Employee Management System

Web application untuk mengelola kehadiran karyawan, KPI, dan performa untuk Produsen Dimsum Medan.

## 🚀 Features

### ✅ Implemented (MVP Core)

- **Authentication & RBAC**
  - Login with JWT
  - Role-based access control (Superadmin, Admin HR, Supervisor, Employee)
  - Change password
  - User profile management

- **Employee Management**
  - Auto-generated NIP (Format: YYMMDD-XXXX)
  - CRUD operations
  - Employee status management
  - Supervisor assignment
  - Default shift and location assignment

- **Work Location Management**
  - GPS coordinates (latitude, longitude)
  - Configurable radius for geo-fencing
  - Active/inactive status

- **Shift Management**
  - Multiple shifts support
  - Start and end time configuration
  - Active/inactive status

- **GPS + Selfie Attendance System** ⭐
  - Check-in with GPS validation
  - Check-out with GPS validation
  - Geo-fencing (radius validation)
  - GPS accuracy validation
  - Selfie capture for check-in and check-out
  - Automatic late calculation
  - Automatic work duration calculation
  - Manual adjustment with audit trail
  - Device info, IP, and user agent tracking

- **Leave/Sick/Permission Management**
  - Leave request submission
  - Approval/rejection workflow
  - Overlap validation
  - Status tracking

- **KPI Management**
  - KPI template creation
  - Multiple scoring types (higher_is_better, lower_is_better, boolean)
  - Weighted scoring
  - KPI assignment to employees

- **Utilities**
  - Permission system
  - Date utilities
  - NIP generator
  - KPI calculator
  - Geo-fencing calculator

### 🔜 Pending (Phase 2)

- Dashboards (Superadmin, HR, Supervisor, Employee)
- Reports and export (CSV/Excel)
- Audit logs
- Notifications
- UI components library
- Frontend pages
- Deployment configuration

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd MyProdusen
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
```

Edit `.env` and configure:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/myprodusen?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
UPLOAD_DIR="./public/uploads"
DEFAULT_GEOFENCE_RADIUS=100
SESSION_TIMEOUT_HOURS=8
```

4. **Setup database**
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed initial data
npm run prisma:seed
```

5. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 👥 Default Users

After seeding, you can login with:

| Role | Email | Password |
|------|-------|----------|
| Superadmin | admin@myprodusen.com | admin123 |
| Admin HR | hr@myprodusen.com | hr123 |
| Supervisor | supervisor@myprodusen.com | supervisor123 |
| Employee 1 | employee1@myprodusen.com | employee123 |
| Employee 2 | employee2@myprodusen.com | employee123 |

## 📡 API Documentation

### Authentication

#### POST `/api/auth/login`
Login to the system.

**Request:**
```json
{
  "email": "admin@myprodusen.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "email": "admin@myprodusen.com",
      "username": "superadmin",
      "role": "SUPERADMIN",
      "employee": {...}
    }
  },
  "message": "Login berhasil"
}
```

#### GET `/api/auth/profile`
Get current user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "admin@myprodusen.com",
    "username": "superadmin",
    "role": "SUPERADMIN",
    "isActive": true,
    "employee": {...}
  }
}
```

#### POST `/api/auth/change-password`
Change user password.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "currentPassword": "admin123",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

### Employees

#### GET `/api/employees`
Get all employees (with filters).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` - Filter by status (ACTIVE, INACTIVE, SUSPENDED)
- `division` - Filter by division
- `supervisorId` - Filter by supervisor
- `search` - Search by name, NIP, or email

#### POST `/api/employees`
Create new employee.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "fullName": "John Doe",
  "email": "john@myprodusen.com",
  "phone": "081234567890",
  "address": "Medan",
  "joinDate": "2026-05-14",
  "division": "Produksi",
  "position": "Operator",
  "supervisorId": "...",
  "defaultShiftId": "...",
  "defaultLocationId": "...",
  "username": "johndoe",
  "password": "password123",
  "role": "EMPLOYEE"
}
```

#### GET `/api/employees/[id]`
Get employee by ID.

#### PUT `/api/employees/[id]`
Update employee.

### Attendance

#### POST `/api/attendance/check-in`
Check-in with GPS and selfie.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "workLocationId": "...",
  "shiftId": "...",
  "latitude": 3.5952,
  "longitude": 98.6722,
  "accuracy": 10.5,
  "selfie": "base64_encoded_image_or_url",
  "deviceInfo": "iPhone 13 Pro"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "employeeId": "...",
    "checkInTime": "2026-05-14T08:05:00.000Z",
    "checkInLatitude": 3.5952,
    "checkInLongitude": 98.6722,
    "checkInDistance": 45.2,
    "status": "LATE",
    "lateMinutes": 5,
    "employee": {...},
    "workLocation": {...},
    "shift": {...}
  },
  "message": "Check-in berhasil"
}
```

**Error Response (Outside Radius):**
```json
{
  "success": false,
  "error": "Anda berada di luar radius lokasi kerja (250m dari lokasi). Radius maksimal: 100m"
}
```

#### POST `/api/attendance/check-out`
Check-out with GPS and selfie.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "attendanceId": "...",
  "latitude": 3.5952,
  "longitude": 98.6722,
  "accuracy": 12.3,
  "selfie": "base64_encoded_image_or_url",
  "deviceInfo": "iPhone 13 Pro"
}
```

#### GET `/api/attendance/today`
Get today's attendance for current user.

**Headers:**
```
Authorization: Bearer <token>
```

## 🗂️ Project Structure

```
MyProdusen/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── register/route.ts
│   │   │   ├── profile/route.ts
│   │   │   └── change-password/route.ts
│   │   ├── employees/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── attendance/
│   │   │   ├── check-in/route.ts
│   │   │   ├── check-out/route.ts
│   │   │   └── today/route.ts
│   │   ├── work-locations/
│   │   ├── shifts/
│   │   └── leave/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   ├── layout/
│   ├── forms/
│   └── tables/
├── features/
│   ├── auth/
│   │   └── auth.service.ts
│   ├── employees/
│   │   └── employee.service.ts
│   ├── attendance/
│   │   └── attendance.service.ts
│   ├── work-locations/
│   │   └── work-location.service.ts
│   ├── shifts/
│   │   └── shift.service.ts
│   └── leave/
│       └── leave.service.ts
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   ├── geofencing.ts
│   ├── permissions.ts
│   ├── middleware.ts
│   ├── utils/
│   │   ├── response.ts
│   │   ├── nip-generator.ts
│   │   ├── date.ts
│   │   └── kpi.ts
│   └── validations/
│       ├── auth.ts
│       ├── employee.ts
│       └── attendance.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── prd .md
├── AGENT.md
└── README.md
```

## 🔐 Security Features

- Password hashing with bcrypt
- JWT authentication with expiration
- Role-based access control (RBAC)
- Permission-based authorization
- Backend geo-fencing validation
- GPS accuracy validation
- IP address and user agent tracking
- Audit trail for manual adjustments

## 🧪 Testing

### Test Attendance with Mock GPS

You can test the attendance system by sending requests with GPS coordinates near the seeded work location:

**Work Location (Pabrik Dimsum Medan):**
- Latitude: 3.5952
- Longitude: 98.6722
- Radius: 100m

**Valid coordinates (within radius):**
- Latitude: 3.5953, Longitude: 98.6723 (≈15m away)
- Latitude: 3.5951, Longitude: 98.6721 (≈15m away)

**Invalid coordinates (outside radius):**
- Latitude: 3.6000, Longitude: 98.6800 (≈600m away)

## 📊 Database Schema

Key models:
- **User** - Authentication and role
- **Employee** - Employee data with auto-generated NIP
- **WorkLocation** - GPS coordinates and radius
- **Shift** - Work shift configuration
- **Attendance** - Check-in/out with GPS and selfie
- **LeaveRequest** - Leave/sick/permission requests
- **KpiTemplate** - KPI configuration
- **KpiItem** - Individual KPI metrics
- **KpiResult** - KPI scores
- **AuditLog** - System audit trail
- **Notification** - User notifications

## 🚀 Deployment

### VPS + Coolify (Recommended)

1. **Prepare environment variables**
2. **Build Docker image**
3. **Setup PostgreSQL**
4. **Run migrations**
5. **Start application**

Detailed deployment guide coming soon.

## 📝 Development Guidelines

Follow the guidelines in `AGENT.md` for:
- Code structure
- Naming conventions
- Security practices
- Testing requirements
- UI/UX standards

## 🤝 Contributing

This is an internal project for Produsen Dimsum Medan.

## 📄 License

ISC

## 📞 Support

For support, contact the development team.

---

**Built with ❤️ for Produsen Dimsum Medan**
