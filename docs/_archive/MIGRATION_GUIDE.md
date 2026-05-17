# Migration Guide: New Folder Structure

## Overview

This guide helps you migrate from the old folder structure to the new organized `src/` structure.

## What Changed?

### Old Structure
```
MyProdusen/
├── components/          # Mixed components
├── features/            # Feature services
├── lib/                 # Mixed utilities
└── public/              # Static files
```

### New Structure
```
MyProdusen/
├── src/                 # Organized source code
│   ├── api/            # Backend connection
│   ├── assets/         # Static files
│   ├── components/     # Reusable components
│   ├── context/        # Global state
│   ├── data/           # Static content
│   ├── hooks/          # Custom hooks
│   ├── services/       # Business logic
│   └── utils/          # Utility functions
├── app/                # Next.js pages & API routes
├── lib/                # Core backend utilities
└── public/             # Public static files
```

## Import Path Changes

### Components

**Before:**
```typescript
import { Button } from '../../../components/ui/Button'
import { Sidebar } from '../../components/layout/Sidebar'
```

**After:**
```typescript
import { Button } from '@/components/ui/Button'
import { Sidebar } from '@/components/layout/Sidebar'
```

### Services

**Before:**
```typescript
import { authService } from '@/features/auth/auth.service'
import { employeeService } from '@/features/employees/employee.service'
```

**After:**
```typescript
import { authService } from '@/services/auth/auth.service'
import { employeeService } from '@/services/employees/employee.service'
```

### Utils

**Before:**
```typescript
import { formatDate } from '@/lib/utils/date'
import { validateEmployee } from '@/lib/validations/employee'
```

**After:**
```typescript
import { formatDate } from '@/utils/date'
import { validateEmployee } from '@/utils/validation/employee'
```

### Hooks

**Before:**
```typescript
import { syncManager } from '@/lib/offline/sync-manager'
```

**After:**
```typescript
import { syncManager } from '@/hooks/offline/sync-manager'
```

### Assets

**Before:**
```typescript
import logo from '/public/logo.png'
```

**After:**
```typescript
import logo from '@/assets/images/logo.png'
```

## Automated Migration

Run the migration script to automatically update import paths:

```bash
./scripts/update-imports.sh
```

This script will:
- Update component imports to use `@/components/*`
- Update service imports to use `@/services/*`
- Update utility imports to use `@/utils/*`
- Update validation imports to use `@/utils/validation/*`

## Manual Steps

### 1. Review Auto-Updated Files

After running the script, review the changes:

```bash
git diff
```

### 2. Update Remaining Imports

Some imports may need manual updates:

- Context providers
- Custom hooks
- API client imports
- Asset imports

### 3. Update Tests

Update test files to use new import paths:

```bash
find tests -type f -name "*.test.ts" -o -name "*.test.tsx"
```

### 4. Verify Build

```bash
npm run build
```

### 5. Run Tests

```bash
npm test
```

## Common Issues

### Issue: Module not found

**Error:**
```
Module not found: Can't resolve '@/components/ui/Button'
```

**Solution:**
- Check that the file exists in `src/components/ui/Button.tsx`
- Verify tsconfig.json has correct path aliases
- Restart your dev server

### Issue: Type errors

**Error:**
```
Cannot find module '@/services/auth/auth.service' or its corresponding type declarations
```

**Solution:**
- Delete `.next` folder and `tsconfig.tsbuildinfo`
- Run `npm run dev` to regenerate types

### Issue: Circular dependencies

**Error:**
```
Circular dependency detected
```

**Solution:**
- Review barrel exports (index.ts files)
- Import specific files instead of using barrel exports
- Refactor to remove circular dependencies

## Rollback Plan

If you need to rollback:

1. Revert the changes:
```bash
git reset --hard HEAD
```

2. Or manually restore old imports:
```bash
git checkout HEAD -- app/
```

## Benefits of New Structure

✅ **Clear separation of concerns**
- Components are purely presentational
- Services contain business logic
- Utils are pure functions

✅ **Better discoverability**
- Easy to find files by category
- Logical organization

✅ **Improved scalability**
- Easy to add new features
- Clear ownership boundaries

✅ **Cleaner imports**
- Consistent import paths
- No more relative path hell

✅ **Better IDE support**
- Auto-completion works better
- Easier refactoring

## Next Steps

1. ✅ Run migration script
2. ✅ Review changes
3. ✅ Update manual imports
4. ✅ Test application
5. ✅ Update team documentation
6. ✅ Remove old directories (after verification)

## Questions?

- See `docs/FOLDER_STRUCTURE.md` for detailed structure
- See `src/README.md` for import guidelines
- See `AGENTS.md` for development rules

## Timeline

- **Phase 1 (Current)**: New structure created, files copied
- **Phase 2 (Next)**: Update all import paths
- **Phase 3 (Final)**: Remove old directories, full migration complete

## Checklist

- [ ] Run migration script
- [ ] Review git diff
- [ ] Update manual imports
- [ ] Update test files
- [ ] Build succeeds
- [ ] Tests pass
- [ ] Dev server runs
- [ ] Production build works
- [ ] Update team documentation
- [ ] Remove old directories

---

**Last Updated:** 2026-05-15
**Status:** In Progress
