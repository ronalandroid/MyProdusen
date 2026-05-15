# Project Restructuring Plan — MyProdusen

**Date**: 2026-05-15  
**Purpose**: Reorganize project structure for better maintainability and scalability

## Current Structure Issues

1. Mixed concerns in `lib/` directory
2. `features/` contains backend services but unclear naming
3. No clear separation between frontend and backend utilities
4. Components could be better organized
5. No dedicated folders for hooks, context, or static data

## New Proposed Structure

```
MyProdusen/
├── src/
│   ├── api/                    # Backend API logic (moved from features/)
│   │   ├── attendance/
│   │   ├── auth/
│   │   ├── employees/
│   │   ├── kpi/
│   │   ├── leave/
│   │   └── reports/
│   │
│   ├── components/             # Reusable UI components
│   │   ├── common/            # Shared components (Button, Input, etc.)
│   │   ├── dashboard/         # Dashboard-specific components
│   │   ├── forms/             # Form components
│   │   ├── layout/            # Layout components (Header, Sidebar, etc.)
│   │   ├── tables/            # Table components
│   │   └── ui/                # Base UI components
│   │
│   ├── context/               # React Context for global state
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── NotificationContext.tsx
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useGeolocation.ts
│   │   ├── useCamera.ts
│   │   └── useOfflineSync.ts
│   │
│   ├── services/              # Frontend service layer
│   │   ├── api-client.ts      # API client wrapper
│   │   ├── attendance.service.ts
│   │   ├── auth.service.ts
│   │   ├── employee.service.ts
│   │   └── storage.service.ts
│   │
│   ├── utils/                 # Utility functions
│   │   ├── date.ts
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   └── helpers.ts
│   │
│   ├── types/                 # TypeScript type definitions
│   │   ├── api.types.ts
│   │   ├── models.types.ts
│   │   └── common.types.ts
│   │
│   ├── constants/             # Application constants
│   │   ├── routes.ts
│   │   ├── config.ts
│   │   └── messages.ts
│   │
│   └── data/                  # Static data/content
│       ├── roles.ts
│       ├── permissions.ts
│       └── menu-items.ts
│
├── app/                       # Next.js App Router (pages)
│   ├── api/                   # API routes (stays here)
│   ├── dashboard/             # Dashboard pages
│   ├── login/                 # Login page
│   └── layout.tsx
│
├── lib/                       # Backend/Server utilities
│   ├── auth.ts               # Server-side auth
│   ├── db.ts                 # Database connection
│   ├── middleware.ts         # API middleware
│   ├── password-policy.ts
│   ├── rate-limiter.ts
│   ├── file-upload.ts
│   ├── geofencing.ts
│   └── audit.ts
│
├── public/                    # Static assets
│   ├── images/
│   ├── icons/
│   └── uploads/
│
├── drizzle/                   # Database schema & migrations
├── tests/                     # Test files
├── scripts/                   # Operational scripts
└── docs/                      # Documentation
```

## Migration Strategy

### Phase 1: Create New Structure (Non-Breaking)
1. Create new `src/` directory with subdirectories
2. Keep existing structure intact
3. Copy files to new locations (don't move yet)

### Phase 2: Update Imports (Gradual)
1. Update import paths in copied files
2. Test each module independently
3. Use path aliases in tsconfig.json

### Phase 3: Move Files (Breaking Changes)
1. Move files from old to new locations
2. Update all import references
3. Run tests after each major move

### Phase 4: Cleanup
1. Remove old empty directories
2. Update documentation
3. Final build and test

## Detailed Mapping

### Backend Services (features/ → src/api/)
```
features/attendance/attendance.service.ts → src/api/attendance/attendance.service.ts
features/auth/auth.service.ts → src/api/auth/auth.service.ts
features/employees/employee.service.ts → src/api/employees/employee.service.ts
features/kpi/kpi.service.ts → src/api/kpi/kpi.service.ts
features/leave/leave.service.ts → src/api/leave/leave.service.ts
```

### Frontend Services (NEW - extract from components)
```
Create: src/services/api-client.ts
Create: src/services/attendance.service.ts (frontend)
Create: src/services/auth.service.ts (frontend)
Create: src/services/storage.service.ts
```

### Custom Hooks (NEW - extract from components)
```
Create: src/hooks/useAuth.ts
Create: src/hooks/useGeolocation.ts
Create: src/hooks/useCamera.ts
Create: src/hooks/useOfflineSync.ts
Create: src/hooks/useAttendance.ts
```

### Context Providers (NEW)
```
Create: src/context/AuthContext.tsx
Create: src/context/ThemeContext.tsx
Create: src/context/NotificationContext.tsx
```

### Utilities (lib/utils/ → src/utils/)
```
lib/utils/date.ts → src/utils/date.ts
lib/utils/format.ts → src/utils/format.ts
lib/utils/response.ts → src/utils/response.ts (keep in lib for backend)
lib/utils/csv-export.ts → src/utils/csv-export.ts
```

### Components (Reorganize)
```
components/ui/* → src/components/ui/*
components/forms/* → src/components/forms/*
components/layout/* → src/components/layout/*
components/dashboard/* → src/components/dashboard/*
components/tables/* → src/components/tables/*
```

### Types (NEW - consolidate)
```
Create: src/types/api.types.ts
Create: src/types/models.types.ts
Create: src/types/common.types.ts
Extract types from various files
```

### Constants (NEW)
```
Create: src/constants/routes.ts
Create: src/constants/config.ts
Create: src/constants/messages.ts
Create: src/constants/permissions.ts
```

## Path Aliases Configuration

Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@/api/*": ["./src/api/*"],
      "@/components/*": ["./src/components/*"],
      "@/context/*": ["./src/context/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/services/*": ["./src/services/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/types/*": ["./src/types/*"],
      "@/constants/*": ["./src/constants/*"],
      "@/data/*": ["./src/data/*"],
      "@/lib/*": ["./lib/*"]
    }
  }
}
```

## Benefits

1. **Clear Separation**: Frontend vs Backend code
2. **Better Organization**: Logical grouping by function
3. **Easier Navigation**: Developers know where to find things
4. **Scalability**: Easy to add new features
5. **Maintainability**: Reduced coupling between modules
6. **Testability**: Easier to test isolated modules
7. **Reusability**: Shared code is clearly identified

## Risks & Mitigation

### Risk 1: Breaking Changes
**Mitigation**: 
- Do gradual migration
- Keep old structure until new one is tested
- Use git branches for each phase

### Risk 2: Import Path Updates
**Mitigation**:
- Use path aliases from the start
- Update tsconfig.json first
- Use find/replace carefully

### Risk 3: Build Failures
**Mitigation**:
- Test build after each major change
- Keep backup of working state
- Use TypeScript to catch import errors

## Timeline

- **Phase 1**: 1-2 hours (Create structure, copy files)
- **Phase 2**: 2-3 hours (Update imports, test modules)
- **Phase 3**: 1-2 hours (Move files, update references)
- **Phase 4**: 1 hour (Cleanup, documentation)

**Total Estimated Time**: 5-8 hours

## Success Criteria

- [ ] All files in new structure
- [ ] TypeScript compilation passes
- [ ] Production build succeeds
- [ ] All tests pass
- [ ] No broken imports
- [ ] Documentation updated
- [ ] Path aliases working
- [ ] Old directories removed

## Rollback Plan

If issues arise:
1. Revert to previous git commit
2. Keep old structure alongside new
3. Gradually migrate one module at a time
4. Use feature flags if needed

## Notes

- This is a major refactoring - do it when no active development
- Communicate with team before starting
- Consider doing it in a separate branch
- Test thoroughly before merging to main
- Update CI/CD pipelines if needed

