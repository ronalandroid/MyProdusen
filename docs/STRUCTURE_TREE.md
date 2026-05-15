# Project Structure Tree

## Complete Directory Structure

```
MyProdusen/
│
├── 📁 app/                          # Next.js App Router
│   ├── api/                         # API Routes
│   │   ├── attendance/
│   │   ├── auth/
│   │   ├── employees/
│   │   ├── kpi/
│   │   ├── leave/
│   │   ├── reports/
│   │   ├── shifts/
│   │   └── work-locations/
│   ├── dashboard/                   # Dashboard Pages
│   ├── login/                       # Login Page
│   ├── layout.tsx                   # Root Layout
│   ├── page.tsx                     # Home Page
│   └── globals.css                  # Global Styles
│
├── 📁 src/                          # ⭐ NEW Organized Source Code
│   │
│   ├── 📁 api/                      # Backend Connection
│   │   ├── client/                  # API client instances
│   │   │   └── auth-client.ts
│   │   └── types/                   # API type definitions
│   │
│   ├── 📁 assets/                   # Static Files
│   │   ├── images/                  # Images
│   │   │   └── logo.png
│   │   ├── icons/                   # Icons
│   │   └── fonts/                   # Fonts
│   │
│   ├── 📁 components/               # Reusable Components
│   │   ├── ui/                      # Base UI Components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── index.ts            # Barrel export
│   │   ├── layout/                  # Layout Components
│   │   │   ├── Sidebar.tsx
│   │   │   └── index.ts
│   │   ├── offline/                 # Offline Components
│   │   │   ├── SyncQueue.tsx
│   │   │   ├── ConflictResolver.tsx
│   │   │   ├── OfflineIndicator.tsx
│   │   │   ├── SyncStatus.tsx
│   │   │   └── index.ts
│   │   ├── forms/                   # Form Components
│   │   ├── tables/                  # Table Components
│   │   └── dashboard/               # Dashboard Components
│   │
│   ├── 📁 context/                  # Global State Management
│   │   └── (Future: AuthContext, ThemeContext)
│   │
│   ├── 📁 data/                     # Static Content
│   │   └── (Future: constants, config, mock data)
│   │
│   ├── 📁 hooks/                    # Custom Logic
│   │   ├── auth/                    # Auth Hooks
│   │   ├── offline/                 # Offline Hooks
│   │   │   ├── sync-manager.ts
│   │   │   ├── conflict-resolver.ts
│   │   │   ├── network-detector.ts
│   │   │   └── ...
│   │   └── data/                    # Data Hooks
│   │
│   ├── 📁 services/                 # Frontend Logic (Business Layer)
│   │   ├── auth/                    # Authentication
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.ts
│   │   │   └── permissions.ts
│   │   ├── employees/               # Employee Management
│   │   │   └── employee.service.ts
│   │   ├── attendance/              # Attendance Tracking
│   │   │   ├── attendance.service.ts
│   │   │   └── attendance.offline.ts
│   │   ├── leave/                   # Leave Management
│   │   │   ├── leave.service.ts
│   │   │   └── leave.offline.ts
│   │   ├── shifts/                  # Shift Scheduling
│   │   │   └── shift.service.ts
│   │   ├── work-locations/          # Work Locations
│   │   │   └── work-location.service.ts
│   │   ├── kpi/                     # KPI Calculations
│   │   │   └── kpi.service.ts
│   │   ├── audit/                   # Audit Logging
│   │   │   └── audit.service.ts
│   │   ├── reports/                 # Report Generation
│   │   ├── notifications/           # Notifications
│   │   └── index.ts                 # Barrel export
│   │
│   ├── 📁 utils/                    # Utility Functions
│   │   ├── validation/              # Validation Schemas
│   │   │   ├── auth.ts
│   │   │   ├── employee.ts
│   │   │   ├── attendance.ts
│   │   │   └── index.ts
│   │   ├── security/                # Security Utils
│   │   │   ├── geofencing.ts
│   │   │   ├── password-policy.ts
│   │   │   ├── rate-limiter.ts
│   │   │   └── index.ts
│   │   ├── date.ts                  # Date utilities
│   │   ├── kpi.ts                   # KPI utilities
│   │   ├── csv-export.ts            # CSV export
│   │   ├── nip-generator.ts         # NIP generator
│   │   ├── response.ts              # Response helpers
│   │   ├── file-upload.ts           # File upload
│   │   ├── upload.ts                # Upload helpers
│   │   └── index.ts                 # Barrel export
│   │
│   ├── README.md                    # Source directory guide
│   └── QUICK_REFERENCE.md           # Quick reference card
│
├── 📁 lib/                          # Core Backend Libraries
│   ├── db.ts                        # Database connection
│   ├── auth.ts                      # Auth utilities
│   ├── env.ts                       # Environment config
│   ├── middleware.ts                # Middleware
│   ├── cache/                       # Caching layer (Redis)
│   ├── logger/                      # Logging utilities
│   ├── resilience/                  # Circuit breaker, retry
│   ├── offline/                     # Offline sync backend
│   └── ...
│
├── 📁 features/                     # Legacy Feature Modules
│   └── (Being migrated to src/services/)
│
├── 📁 components/                   # Legacy Components
│   └── (Being migrated to src/components/)
│
├── 📁 public/                       # Public Static Files
│   ├── uploads/                     # User uploads
│   └── logo.png                     # Static assets
│
├── 📁 docs/                         # Documentation
│   ├── prd.md                       # Product requirements
│   ├── BRD.md                       # Business requirements
│   ├── SRC.md                       # Software requirements
│   ├── CURRENT_STATE.md             # Implementation status
│   ├── IMPLEMENTATION_PLAN.md       # Implementation roadmap
│   ├── FOLDER_STRUCTURE.md          # ⭐ Folder structure guide
│   ├── MIGRATION_GUIDE.md           # ⭐ Migration instructions
│   ├── RESTRUCTURE_SUMMARY.md       # ⭐ Restructure summary
│   ├── STRUCTURE_TREE.md            # ⭐ This file
│   ├── INDEX.md                     # Documentation index
│   └── ...
│
├── 📁 tests/                        # Test Files
│   ├── api/                         # API tests
│   ├── db/                          # Database tests
│   ├── helpers/                     # Test helpers
│   └── ...
│
├── 📁 scripts/                      # Utility Scripts
│   └── update-imports.sh            # ⭐ Import migration script
│
├── 📁 drizzle/                      # Database Migrations
│   └── migrations/
│
├── 📄 tsconfig.json                 # ⭐ Updated with path aliases
├── 📄 package.json                  # Dependencies
├── 📄 next.config.js                # Next.js config
├── 📄 tailwind.config.ts            # Tailwind config
├── 📄 middleware.ts                 # Next.js middleware
├── 📄 AGENTS.md                     # Agent development rules
└── 📄 README.md                     # Project README
```

## Legend

- 📁 = Directory
- 📄 = File
- ⭐ = New/Updated in restructure

## Key Directories

### 🎨 Frontend (src/)
- **components/** - Reusable UI components
- **services/** - Business logic layer
- **hooks/** - Custom React hooks
- **utils/** - Helper functions
- **context/** - Global state management

### 🔧 Backend (lib/)
- **db.ts** - Database connection
- **auth.ts** - Authentication utilities
- **cache/** - Redis caching
- **logger/** - Logging system
- **resilience/** - Error handling

### 📱 Pages (app/)
- **api/** - API route handlers
- **dashboard/** - Dashboard pages
- **login/** - Authentication pages

### 📚 Documentation (docs/)
- **prd.md** - Product requirements
- **FOLDER_STRUCTURE.md** - Structure guide
- **MIGRATION_GUIDE.md** - Migration steps

## File Count Summary

- **Components:** 12 files
- **Services:** 12 files
- **Utils:** 15+ files
- **Hooks:** 6 files
- **Assets:** 1 file
- **Documentation:** 4 new docs
- **Total migrated:** 53+ files

## Import Examples

```typescript
// Components
import { Button, Input, Modal } from '@/components/ui'
import { Sidebar } from '@/components/layout'

// Services
import { authService } from '@/services/auth/auth.service'
import { employeeService } from '@/services/employees/employee.service'

// Utils
import { formatDate } from '@/utils/date'
import { validateEmployee } from '@/utils/validation/employee'

// Hooks
import { useAuth } from '@/hooks/auth/useAuth'
import { useOffline } from '@/hooks/offline/useOffline'

// Assets
import logo from '@/assets/images/logo.png'
```

---

**Last Updated:** 2026-05-15  
**Status:** Structure Complete, Ready for Migration
