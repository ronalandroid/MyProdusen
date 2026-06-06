# Codegraph UI Audit — MyProdusen

Generated from import graph for React Doctor/UI audit.

## Summary

- TSX files scanned: 100
- Import edges: 335

## Category dependency graph

### app

- `app` → `external:next`: 19
- `app` → `external:react`: 9
- `app` → `external:lucide-react`: 6
- `app` → `relative`: 3
- `app` → `components`: 2
- `app` → `external:@tanstack`: 1
- `app` → `lib`: 1

### app/dashboard

- `app/dashboard` → `components`: 58
- `app/dashboard` → `external:next`: 40
- `app/dashboard` → `external:react`: 38
- `app/dashboard` → `external:lucide-react`: 29
- `app/dashboard` → `lib`: 28
- `app/dashboard` → `relative`: 9
- `app/dashboard` → `external:@tanstack`: 1
- `app/dashboard` → `hooks`: 1

### components

- `components` → `external:react`: 12
- `components` → `hooks`: 6
- `components` → `external:lucide-react`: 4
- `components` → `external:next`: 2
- `components` → `lib`: 2
- `components` → `relative`: 1

### src/components

- `src/components` → `external:react`: 21
- `src/components` → `external:lucide-react`: 14
- `src/components` → `lib`: 11
- `src/components` → `hooks`: 7
- `src/components` → `external:next`: 6
- `src/components` → `components`: 2
- `src/components` → `relative`: 1
- `src/components` → `external:@tanstack`: 1

## Top shared dependencies

- `react`: 80
- `lucide-react`: 53
- `next/navigation`: 41
- `@/lib/auth-client`: 26
- `next/link`: 17
- `@/components/ui/LoadingSpinner`: 17
- `@/components/ui/Button`: 15
- `@/components/ui/Input`: 8
- `@/components/ui/Modal`: 6
- `next/image`: 5
- `./state`: 5
- `@/components/ui/Toast`: 4
- `@/lib/permissions`: 4
- `@/hooks/offline/db`: 4
- `@/hooks/offline/network-detector`: 4
- `@tanstack/react-query`: 3
- `@/lib/navigation/role-navigation`: 3
- `next`: 2
- `@/components/locations/WorkLocationMap`: 2
- `@/hooks/useRealtime`: 2
- `./Button`: 2
- `@/hooks/offline/conflict-resolver`: 2
- `@/hooks/offline/sync-manager`: 2
- `@/lib/maps/osm-tile-math`: 2
- `next/font/google`: 1
- `@/components/pwa/PwaInstallPrompt`: 1
- `@/components/pwa/ServiceWorkerRegistration`: 1
- `./providers`: 1
- `./activate-account-client`: 1
- `@/components/layout/Sidebar`: 1

## Highest fan-out files

- `app/dashboard/layout.tsx`: 9
- `app/dashboard/page.tsx`: 9
- `app/dashboard/attendance/clock/page.tsx`: 9
- `app/dashboard/leave/page.tsx`: 9
- `app/dashboard/employees/page.tsx`: 9
- `app/dashboard/employees/[id]/page.tsx`: 9
- `app/dashboard/profile/page.tsx`: 8
- `app/dashboard/locations/page.tsx`: 8
- `app/dashboard/documents/page.tsx`: 8
- `src/components/dashboard/EmployeeBeranda.tsx`: 8
- `app/dashboard/attendance/page.tsx`: 7
- `app/dashboard/self-service/page.tsx`: 7
- `app/dashboard/notifications/page.tsx`: 7
- `app/dashboard/reports/page.tsx`: 7
- `app/dashboard/reports/attendance/page.tsx`: 7
- `components/layout/Sidebar.tsx`: 7
- `app/dashboard/attendance/exceptions/page.tsx`: 6
- `app/dashboard/leave/balance/page.tsx`: 6
- `src/components/layout/Sidebar.tsx`: 6
- `app/layout.tsx`: 5
- `app/dashboard/attendance/success/page.tsx`: 5
- `app/dashboard/profile/password/page.tsx`: 5
- `app/dashboard/kpi/page.tsx`: 5
- `app/dashboard/kpi/template/page.tsx`: 5
- `app/dashboard/payroll/page.tsx`: 5
- `src/components/dashboard/LeaderBeranda.tsx`: 5
- `app/activate-account/activate-account-client.tsx`: 4
- `app/dashboard/settings/page.tsx`: 4
- `app/dashboard/payroll/me/page.tsx`: 4
- `app/dashboard/reports/pdf/page.tsx`: 4
