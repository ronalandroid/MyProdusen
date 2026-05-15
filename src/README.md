# Source Directory Structure

This directory contains the organized source code for MyProdusen application.

## Directory Overview

### 📁 api/ - Backend Connection
API client configuration, HTTP clients, and backend communication utilities.
- `client/` - API client instances and configuration
- `types/` - API request/response type definitions

### 📁 assets/ - Static Files
Static assets like images, icons, and fonts.
- `images/` - Image files (logos, illustrations)
- `icons/` - Icon files
- `fonts/` - Custom font files

### 📁 components/ - Reusable Components
React components organized by feature and type.
- `ui/` - Base UI components (Button, Input, Modal, Table, etc.)
- `layout/` - Layout components (Sidebar, Header, Footer)
- `forms/` - Form components
- `tables/` - Table components
- `dashboard/` - Dashboard-specific components
- `offline/` - Offline mode components

### 📁 context/ - Global State Management
React Context providers for global state management.

### 📁 data/ - Static Content
Static data, constants, and configuration objects.

### 📁 hooks/ - Custom Logic
Custom React hooks for reusable logic.
- `auth/` - Authentication hooks
- `offline/` - Offline functionality hooks
- `data/` - Data fetching and management hooks

### 📁 services/ - Frontend Logic
Business logic and service layer organized by feature.
- `auth/` - Authentication and authorization services
- `employees/` - Employee management services
- `attendance/` - Attendance tracking services
- `leave/` - Leave management services
- `shifts/` - Shift scheduling services
- `work-locations/` - Work location services
- `kpi/` - KPI calculation services
- `audit/` - Audit logging services
- `reports/` - Report generation services
- `notifications/` - Notification services

### 📁 utils/ - Utility Functions
Helper functions and utilities.
- `validation/` - Validation schemas and functions
- `date/` - Date manipulation utilities
- `export/` - Export utilities (CSV, PDF)
- `security/` - Security utilities (rate limiting, geofencing, password policy)

## Import Guidelines

Use absolute imports from `@/` prefix:

```typescript
// Components
import { Button } from '@/components/ui/Button'
import { Sidebar } from '@/components/layout/Sidebar'

// Services
import { authService } from '@/services/auth/auth.service'
import { employeeService } from '@/services/employees/employee.service'

// Utils
import { formatDate } from '@/utils/date'
import { validateEmployee } from '@/utils/validation/employee'

// Hooks
import { useAuth } from '@/hooks/auth/useAuth'
import { useOffline } from '@/hooks/offline/useOffline'

// API
import { apiClient } from '@/api/client/auth-client'
```

## File Naming Conventions

- Components: PascalCase (e.g., `Button.tsx`, `UserProfile.tsx`)
- Services: kebab-case with `.service.ts` suffix (e.g., `auth.service.ts`)
- Hooks: camelCase with `use` prefix (e.g., `useAuth.ts`)
- Utils: kebab-case (e.g., `date-formatter.ts`)
- Types: PascalCase with `.types.ts` suffix (e.g., `User.types.ts`)

## Best Practices

1. Keep components small and focused
2. Extract reusable logic into custom hooks
3. Use services for business logic, not components
4. Validate data at API boundaries using utils/validation
5. Use TypeScript for type safety
6. Follow the existing code style and patterns
