# MyProdusen Folder Structure

## Overview
This document describes the organized folder structure of the MyProdusen project following Next.js App Router best practices.

## Root Directory Structure

```
MyProdusen/
├── app/                    # Next.js App Router (Pages & API Routes)
│   ├── api/               # API route handlers
│   ├── dashboard/         # Dashboard pages
│   ├── login/             # Login page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
│
├── src/                   # Source code (NEW organized structure)
│   ├── api/              # Backend Connection
│   │   ├── client/       # API client instances
│   │   └── types/        # API type definitions
│   │
│   ├── assets/           # Static Files
│   │   ├── images/       # Images (logos, illustrations)
│   │   ├── icons/        # Icon files
│   │   └── fonts/        # Custom fonts
│   │
│   ├── components/       # Reusable Components
│   │   ├── ui/          # Base UI components
│   │   ├── layout/      # Layout components
│   │   ├── forms/       # Form components
│   │   ├── tables/      # Table components
│   │   ├── dashboard/   # Dashboard components
│   │   └── offline/     # Offline mode components
│   │
│   ├── context/          # Global State Management
│   │   └── (React Context providers)
│   │
│   ├── data/             # Static Content
│   │   └── (Constants, config objects)
│   │
│   ├── hooks/            # Custom Logic
│   │   ├── auth/        # Authentication hooks
│   │   ├── offline/     # Offline functionality hooks
│   │   └── data/        # Data fetching hooks
│   │
│   ├── services/         # Frontend Logic (Business Layer)
│   │   ├── auth/        # Authentication services
│   │   ├── employees/   # Employee management
│   │   ├── attendance/  # Attendance tracking
│   │   ├── leave/       # Leave management
│   │   ├── shifts/      # Shift scheduling
│   │   ├── work-locations/ # Work location services
│   │   ├── kpi/         # KPI calculations
│   │   ├── audit/       # Audit logging
│   │   ├── reports/     # Report generation
│   │   └── notifications/ # Notifications
│   │
│   └── utils/            # Utility Functions
│       ├── validation/   # Validation schemas
│       ├── date/         # Date utilities
│       ├── export/       # Export utilities
│       └── security/     # Security utilities
│
├── lib/                   # Core Libraries (Backend utilities)
│   ├── db.ts             # Database connection
│   ├── auth.ts           # Auth utilities
│   ├── cache/            # Caching layer
│   ├── logger/           # Logging utilities
│   ├── resilience/       # Circuit breaker, retry
│   └── middleware.ts     # Middleware functions
│
├── features/              # Feature modules (Legacy - being migrated)
│   └── (Feature-specific code)
│
├── components/            # Legacy components (being migrated to src/)
│
├── public/                # Public static files
│   ├── uploads/          # User uploads
│   └── logo.png          # Static assets
│
├── docs/                  # Documentation
│   ├── prd.md            # Product requirements
│   ├── CURRENT_STATE.md  # Current implementation state
│   ├── IMPLEMENTATION_PLAN.md # Implementation roadmap
│   └── FOLDER_STRUCTURE.md # This file
│
├── tests/                 # Test files
│   ├── api/              # API tests
│   ├── db/               # Database tests
│   └── helpers/          # Test helpers
│
├── scripts/               # Utility scripts
│
└── drizzle/              # Database migrations
    └── migrations/
```

## Migration Status

### ✅ Completed
- Created new `src/` directory structure
- Moved components to `src/components/`
- Moved services to `src/services/`
- Moved utilities to `src/utils/`
- Moved hooks to `src/hooks/`
- Moved assets to `src/assets/`
- Created barrel exports (index.ts) for easy imports
- Updated tsconfig.json with path aliases

### 🔄 In Progress
- Updating import paths across the project
- Testing the new structure

### 📋 Pending
- Remove old directories after verification
- Update documentation references

## Import Path Examples

### Before (Old Structure)
```typescript
import { Button } from '../../../components/ui/Button'
import { authService } from '../../../features/auth/auth.service'
import { formatDate } from '../../../lib/utils/date'
```

### After (New Structure)
```typescript
import { Button } from '@/components/ui/Button'
import { authService } from '@/services/auth/auth.service'
import { formatDate } from '@/utils/date'
```

## Key Principles

1. **Separation of Concerns**: Each directory has a clear, single responsibility
2. **Scalability**: Easy to add new features without cluttering
3. **Discoverability**: Logical organization makes code easy to find
4. **Maintainability**: Clear structure reduces cognitive load
5. **Type Safety**: TypeScript throughout with proper type definitions

## Directory Responsibilities

### src/api/ - Backend Connection
- API client configuration
- HTTP request/response handling
- API type definitions
- Backend communication layer

### src/assets/ - Static Files
- Images, icons, fonts
- Static media files
- Brand assets

### src/components/ - Reusable Components
- UI components (buttons, inputs, modals)
- Layout components (sidebar, header)
- Feature-specific components
- Presentational components only (no business logic)

### src/context/ - Global State Management
- React Context providers
- Global state management
- Shared state across components

### src/data/ - Static Content
- Constants and enums
- Configuration objects
- Static data structures
- Mock data for development

### src/hooks/ - Custom Logic
- Custom React hooks
- Reusable component logic
- Side effects management
- State management hooks

### src/services/ - Frontend Logic
- Business logic layer
- Data transformation
- API integration
- Feature-specific services
- Offline sync logic

### src/utils/ - Utility Functions
- Pure helper functions
- Validation utilities
- Date/time utilities
- Export utilities
- Security utilities

## Best Practices

1. **Keep components dumb**: Move business logic to services
2. **Use barrel exports**: Import from index files for cleaner imports
3. **Follow naming conventions**: See src/README.md
4. **Type everything**: Use TypeScript for all files
5. **Test critical paths**: Add tests for services and utils
6. **Document complex logic**: Add comments for non-obvious code

## Next Steps

1. Update all import paths to use new structure
2. Verify all functionality works with new paths
3. Remove old directories after verification
4. Update CI/CD pipelines if needed
5. Update team documentation

## Questions?

Refer to:
- `src/README.md` - Detailed src directory guide
- `docs/prd.md` - Product requirements
- `AGENTS.md` - Agent development rules
