# Quick Reference - New Structure

## 📁 Where to Put Your Code

| What you're adding | Where it goes | Example |
|-------------------|---------------|---------|
| UI Component | `src/components/ui/` | Button, Input, Modal |
| Layout Component | `src/components/layout/` | Sidebar, Header, Footer |
| Feature Component | `src/components/{feature}/` | Dashboard, Offline |
| Business Logic | `src/services/{feature}/` | auth.service.ts |
| API Call | `src/api/client/` | api-client.ts |
| Custom Hook | `src/hooks/{category}/` | useAuth.ts, useOffline.ts |
| Utility Function | `src/utils/` | date.ts, csv-export.ts |
| Validation Schema | `src/utils/validation/` | employee.ts, auth.ts |
| Security Util | `src/utils/security/` | rate-limiter.ts |
| Context Provider | `src/context/` | AuthContext.tsx |
| Static Data | `src/data/` | constants.ts, config.ts |
| Image/Icon | `src/assets/images/` | logo.png |

## 🔗 Import Patterns

```typescript
// ✅ DO: Use absolute imports with @/ prefix
import { Button } from '@/components/ui/Button'
import { authService } from '@/services/auth/auth.service'
import { formatDate } from '@/utils/date'
import { useAuth } from '@/hooks/auth/useAuth'

// ❌ DON'T: Use relative imports
import { Button } from '../../../components/ui/Button'
import { authService } from '../../features/auth/auth.service'
```

## 📝 Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Component | PascalCase | `Button.tsx`, `UserProfile.tsx` |
| Service | kebab-case + .service.ts | `auth.service.ts` |
| Hook | camelCase + use prefix | `useAuth.ts`, `useOffline.ts` |
| Util | kebab-case | `date-formatter.ts` |
| Type | PascalCase + .types.ts | `User.types.ts` |
| Context | PascalCase + Context | `AuthContext.tsx` |

## 🎯 Common Tasks

### Adding a New Component
```bash
# 1. Create file
touch src/components/ui/NewComponent.tsx

# 2. Add to barrel export
echo "export { default as NewComponent } from './NewComponent'" >> src/components/ui/index.ts

# 3. Import and use
import { NewComponent } from '@/components/ui/NewComponent'
```

### Adding a New Service
```bash
# 1. Create service file
touch src/services/feature-name/feature.service.ts

# 2. Add to barrel export
echo "export * from './feature-name/feature.service'" >> src/services/index.ts

# 3. Import and use
import { featureService } from '@/services/feature-name/feature.service'
```

### Adding a New Hook
```bash
# 1. Create hook file
touch src/hooks/category/useFeature.ts

# 2. Import and use
import { useFeature } from '@/hooks/category/useFeature'
```

### Adding a New Util
```bash
# 1. Create util file
touch src/utils/my-util.ts

# 2. Add to barrel export (optional)
echo "export * from './my-util'" >> src/utils/index.ts

# 3. Import and use
import { myUtil } from '@/utils/my-util'
```

## 🚫 What NOT to Do

❌ Don't put business logic in components  
✅ Extract to services

❌ Don't use relative imports  
✅ Use @/ prefix

❌ Don't create files in root  
✅ Use src/ structure

❌ Don't mix concerns  
✅ Keep components, services, utils separate

❌ Don't skip barrel exports  
✅ Add to index.ts for cleaner imports

## 🔍 Finding Files

```bash
# Find a component
find src/components -name "Button*"

# Find a service
find src/services -name "*auth*"

# Find a util
find src/utils -name "*date*"

# Find a hook
find src/hooks -name "use*"
```

## 🛠️ Troubleshooting

### Module not found
1. Check file exists in src/
2. Verify tsconfig.json paths
3. Restart dev server
4. Delete .next and tsconfig.tsbuildinfo

### Type errors
1. Delete .next folder
2. Delete tsconfig.tsbuildinfo
3. Run `npm run dev`

### Import not working
1. Check path alias in tsconfig.json
2. Use correct @/ prefix
3. Check file extension (.ts vs .tsx)

## 📚 More Info

- Full structure: `docs/FOLDER_STRUCTURE.md`
- Migration guide: `docs/MIGRATION_GUIDE.md`
- Import guidelines: `src/README.md`
- Dev rules: `AGENTS.md`

---

**Last Updated:** 2026-05-15
