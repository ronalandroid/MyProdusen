# Visual Project Structure

## 🎨 Complete Architecture Overview

```
MyProdusen/
│
├── 🎯 app/                          Next.js App Router (Pages & API)
│   ├── api/                         Backend API Routes
│   ├── dashboard/                   Dashboard Pages
│   ├── login/                       Auth Pages
│   └── *.tsx                        Root Pages & Layout
│
├── ⭐ src/                          NEW Organized Source Code
│   │
│   ├── 🔌 api/                      Backend Connection
│   │   ├── client/                  → auth-client.ts
│   │   └── types/                   → (API types)
│   │
│   ├── 🖼️ assets/                   Static Files
│   │   ├── images/                  → logo.png
│   │   ├── icons/                   → (icons)
│   │   └── fonts/                   → (fonts)
│   │
│   ├── 🧩 components/               Reusable Components (15 files)
│   │   ├── ui/                      → Button, Input, Modal, Table, Toast...
│   │   ├── layout/                  → Sidebar
│   │   ├── offline/                 → SyncQueue, ConflictResolver...
│   │   ├── forms/                   → (form components)
│   │   ├── tables/                  → (table components)
│   │   └── dashboard/               → (dashboard components)
│   │
│   ├── 🌐 context/                  Global State Management
│   │   └── (Future: AuthContext, ThemeContext...)
│   │
│   ├── 📊 data/                     Static Content
│   │   └── (Future: constants, config, mock data...)
│   │
│   ├── 🪝 hooks/                    Custom Logic (4 files)
│   │   ├── auth/                    → (auth hooks)
│   │   ├── offline/                 → sync-manager, conflict-resolver...
│   │   └── data/                    → (data hooks)
│   │
│   ├── ⚙️ services/                 Frontend Logic (13 files)
│   │   ├── auth/                    → auth.service, auth, permissions
│   │   ├── employees/               → employee.service
│   │   ├── attendance/              → attendance.service, .offline
│   │   ├── leave/                   → leave.service, .offline
│   │   ├── shifts/                  → shift.service
│   │   ├── work-locations/          → work-location.service
│   │   ├── kpi/                     → kpi.service
│   │   ├── audit/                   → audit.service
│   │   ├── reports/                 → (report services)
│   │   └── notifications/           → (notification services)
│   │
│   └── 🛠️ utils/                    Utility Functions (18 files)
│       ├── validation/              → auth, employee, attendance
│       ├── security/                → geofencing, password-policy, rate-limiter
│       └── *.ts                     → date, kpi, csv-export, nip-generator...
│
├── 🔧 lib/                          Core Backend Libraries
│   ├── db.ts                        Database Connection
│   ├── auth.ts                      Auth Utilities
│   ├── cache/                       Redis Caching
│   ├── logger/                      Logging System
│   ├── resilience/                  Error Handling
│   └── ...
│
├── 📚 docs/                         Documentation (NEW)
│   ├── FOLDER_STRUCTURE.md          Detailed structure guide
│   ├── STRUCTURE_TREE.md            Visual directory tree
│   ├── VISUAL_STRUCTURE.md          This file
│   ├── MIGRATION_GUIDE.md           Migration instructions
│   ├── RESTRUCTURE_SUMMARY.md       Comprehensive summary
│   ├── RESTRUCTURE_CHECKLIST.md     Migration checklist
│   ├── INDEX.md                     Documentation index
│   └── ...
│
├── 🧪 tests/                        Test Files
├── 📜 scripts/                      Utility Scripts
│   └── update-imports.sh            Import migration script
├── 🗄️ drizzle/                     Database Migrations
├── 🌍 public/                       Public Static Files
└── ⚙️ Config Files                  tsconfig, package.json, etc.
```

## 📊 File Distribution

```
┌─────────────────────────────────────────────────────────┐
│  src/ Directory Breakdown                               │
├─────────────────────────────────────────────────────────┤
│  📁 components/       15 files  ████████████████  29%   │
│  📁 utils/            18 files  ███████████████████ 35% │
│  📁 services/         13 files  █████████████  25%      │
│  📁 hooks/             4 files  ████  8%                │
│  📁 api/               1 file   █  2%                   │
│  📁 assets/            1 file   █  2%                   │
├─────────────────────────────────────────────────────────┤
│  TOTAL:              52 files                           │
└─────────────────────────────────────────────────────────┘
```

## 🔄 Import Flow

```
┌──────────────┐
│   Pages      │  app/dashboard/page.tsx
│  (app/)      │
└──────┬───────┘
       │ imports
       ↓
┌──────────────┐
│  Components  │  src/components/ui/Button.tsx
│              │  src/components/layout/Sidebar.tsx
└──────┬───────┘
       │ uses
       ↓
┌──────────────┐
│   Services   │  src/services/auth/auth.service.ts
│              │  src/services/employees/employee.service.ts
└──────┬───────┘
       │ calls
       ↓
┌──────────────┐
│   API        │  src/api/client/auth-client.ts
│              │  app/api/*/route.ts
└──────┬───────┘
       │ uses
       ↓
┌──────────────┐
│   Utils      │  src/utils/validation/employee.ts
│              │  src/utils/date.ts
└──────────────┘
```

## 🎯 Separation of Concerns

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│  src/components/  →  Pure UI, no business logic         │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                  │
│  src/services/  →  Business rules, data transformation  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    DATA ACCESS LAYER                     │
│  src/api/  →  Backend communication                     │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    UTILITY LAYER                         │
│  src/utils/  →  Pure functions, helpers                 │
└─────────────────────────────────────────────────────────┘
```

## 📝 Import Examples by Layer

### Components (Presentation)
```typescript
// Import UI components
import { Button, Input, Modal } from '@/components/ui'
import { Sidebar } from '@/components/layout'

// Use services for business logic
import { authService } from '@/services/auth/auth.service'
```

### Services (Business Logic)
```typescript
// Import API client
import { apiClient } from '@/api/client/auth-client'

// Import utils for helpers
import { formatDate } from '@/utils/date'
import { validateEmployee } from '@/utils/validation/employee'
```

### Hooks (Reusable Logic)
```typescript
// Import services
import { authService } from '@/services/auth/auth.service'

// Import utils
import { formatDate } from '@/utils/date'
```

### Utils (Pure Functions)
```typescript
// No imports from components or services
// Only import other utils or external libraries
import { z } from 'zod'
```

## 🚀 Development Workflow

```
1. Create Component
   └─→ src/components/ui/NewComponent.tsx
       └─→ Add to src/components/ui/index.ts

2. Add Business Logic
   └─→ src/services/feature/feature.service.ts
       └─→ Add to src/services/index.ts

3. Create Helper Function
   └─→ src/utils/helper.ts
       └─→ Add to src/utils/index.ts

4. Add Custom Hook
   └─→ src/hooks/category/useFeature.ts

5. Use in Page
   └─→ app/page.tsx
       └─→ Import from @/components, @/services, @/hooks
```

## 📦 Module Dependencies

```
app/              →  src/components/
                 →  src/services/
                 →  src/hooks/
                 →  lib/

src/components/  →  src/hooks/
                 →  src/utils/

src/services/    →  src/api/
                 →  src/utils/
                 →  lib/

src/hooks/       →  src/services/
                 →  src/utils/

src/api/         →  src/utils/
                 →  lib/

src/utils/       →  (no internal dependencies)

lib/             →  (backend only)
```

## 🎨 Color Legend

- 🎯 = Pages & Routes
- ⭐ = New Structure
- 🔌 = API/Backend
- 🖼️ = Assets
- 🧩 = Components
- 🌐 = State Management
- 📊 = Data
- 🪝 = Hooks
- ⚙️ = Services
- 🛠️ = Utils
- 🔧 = Backend Libraries
- 📚 = Documentation
- 🧪 = Tests
- 📜 = Scripts

---

**Last Updated:** 2026-05-15  
**Status:** Structure Complete, Ready for Migration
