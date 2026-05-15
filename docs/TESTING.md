# Testing Documentation

## Overview

MyProdusen uses **Vitest** as the testing framework for unit, integration, and database constraint tests. This document outlines the testing strategy, how to run tests, and coverage goals.

## Test Structure

```
tests/
├── setup.ts                    # Global test setup and environment config
├── helpers/
│   └── test-utils.ts          # Test utilities and helper functions
├── api/
│   ├── auth.test.ts           # Authentication API tests
│   ├── attendance.test.ts     # Attendance API tests
│   ├── employees.test.ts      # Employee API tests
│   └── leave.test.ts          # Leave request API tests
├── db/
│   └── constraints.test.ts    # Database constraint tests
└── rbac/
    └── authorization.test.ts  # RBAC authorization tests
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npx vitest run tests/api/auth.test.ts
```

### Run Tests Matching Pattern
```bash
npx vitest run -t "should login successfully"
```

## Test Categories

### 1. API Integration Tests

Test API routes end-to-end by calling route handlers directly with mock requests.

**Coverage:**
- `tests/api/auth.test.ts` - Login, register, profile, change password
- `tests/api/attendance.test.ts` - Check-in, check-out, geofencing, duplicate prevention
- `tests/api/employees.test.ts` - CRUD operations, RBAC enforcement
- `tests/api/leave.test.ts` - Leave requests, approval workflow

**Key Features:**
- Direct route handler invocation
- Mock JWT tokens for authentication
- Database cleanup after each test
- Real database interactions (not mocked)

### 2. Database Constraint Tests

Test database-level constraints to ensure data integrity.

**Coverage:**
- Attendance unique constraint (one check-in per employee per day)
- NIP uniqueness
- Email uniqueness
- Username uniqueness

**Location:** `tests/db/constraints.test.ts`

### 3. RBAC Authorization Tests

Test role-based access control and authorization rules.

**Coverage:**
- Supervisor can only see their team
- Employee can only see own data
- Role escalation prevention (ADMIN_HR cannot create SUPERADMIN)
- Permission enforcement across roles

**Location:** `tests/rbac/authorization.test.ts`

### 4. Existing Unit Tests

Existing unit tests for utility functions:
- `lib/geofencing.test.ts` - Geofencing calculations
- `lib/permissions.test.ts` - Permission checks
- `lib/utils/date.test.ts` - Date utilities
- `lib/utils/kpi.test.ts` - KPI scoring

## Test Utilities

### Helper Functions

Located in `tests/helpers/test-utils.ts`:

- `createTestUser(role, overrides?)` - Create test user with JWT token
- `createTestEmployee(userId, overrides?)` - Create test employee record
- `createTestWorkLocation(overrides?)` - Create test work location
- `createTestShift(overrides?)` - Create test shift
- `cleanupTestData(ids)` - Clean up test data after tests
- `createMockRequest(method, url, options?)` - Create mock HTTP request

### Example Usage

```typescript
import { createTestUser, createTestEmployee, cleanupTestData } from '../helpers/test-utils';

describe('My Test Suite', () => {
  const testUserIds: string[] = [];
  const testEmployeeIds: string[] = [];

  afterEach(async () => {
    await cleanupTestData({
      employeeIds: testEmployeeIds,
      userIds: testUserIds,
    });
    testEmployeeIds.length = 0;
    testUserIds.length = 0;
  });

  it('should do something', async () => {
    const user = await createTestUser('EMPLOYEE');
    testUserIds.push(user.id);

    const employeeId = await createTestEmployee(user.id);
    testEmployeeIds.push(employeeId);

    // Your test logic here
  });
});
```

## Environment Setup

Tests use the following environment variables (set in `tests/setup.ts`):

- `NODE_ENV=test`
- `JWT_SECRET=test-jwt-secret-key-for-testing-only-32chars`
- `DATABASE_URL` - Uses `TEST_DATABASE_URL` if set, otherwise falls back to `DATABASE_URL`

**Important:** Tests run against a real database. Use a separate test database to avoid affecting development or production data.

## Coverage Goals

### Current Coverage

Run `npm run test:coverage` to see current coverage report.

### Target Coverage

- **API Routes:** 80%+ coverage
- **Services:** 80%+ coverage
- **Utilities:** 90%+ coverage
- **Critical Business Logic:** 95%+ coverage

### Critical Areas Requiring High Coverage

1. **Authentication & Authorization**
   - Login/logout flows
   - JWT token validation
   - Role-based access control
   - Permission checks

2. **Attendance System**
   - Geofencing validation
   - Duplicate check-in prevention
   - Check-in/check-out workflow
   - Late/early leave calculations

3. **Leave Management**
   - Leave request creation
   - Approval workflow
   - Supervisor team scoping

4. **Employee Management**
   - CRUD operations
   - NIP generation
   - Supervisor assignment

## Best Practices

### 1. Test Isolation

Each test should be independent and not rely on other tests:

```typescript
afterEach(async () => {
  await cleanupTestData({ userIds, employeeIds });
  userIds.length = 0;
  employeeIds.length = 0;
});
```

### 2. Descriptive Test Names

Use clear, descriptive test names:

```typescript
it('should fail when outside geofence', async () => {
  // Test implementation
});
```

### 3. Arrange-Act-Assert Pattern

Structure tests clearly:

```typescript
it('should check in successfully', async () => {
  // Arrange
  const user = await createTestUser('EMPLOYEE');
  const location = await createTestWorkLocation();

  // Act
  const response = await checkInPOST(request);

  // Assert
  expect(response.status).toBe(200);
  expect(data.success).toBe(true);
});
```

### 4. Test Both Success and Failure Cases

Always test both happy path and error cases:

```typescript
it('should login successfully with valid credentials', async () => {
  // Success case
});

it('should fail with invalid password', async () => {
  // Failure case
});
```

### 5. Clean Up Test Data

Always clean up test data to prevent test pollution:

```typescript
afterEach(async () => {
  await cleanupTestData({ userIds, employeeIds });
});
```

## Known Limitations

1. **No Rate Limiting Tests:** Rate limiting is not currently tested due to complexity of mocking time-based limits.

2. **No File Upload Tests:** Selfie upload validation is tested with data URLs, not actual file uploads.

3. **No Email/Notification Tests:** Email and notification services are not tested as they are not yet implemented.

4. **Database Migrations:** Migration tests are not automated. Migrations should be tested manually before deployment.

## Continuous Integration

Tests should be run in CI/CD pipeline before deployment:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm test

- name: Check coverage
  run: npm run test:coverage
```

## Troubleshooting

### Tests Failing Due to Database Connection

Ensure `DATABASE_URL` or `TEST_DATABASE_URL` is set correctly:

```bash
export TEST_DATABASE_URL="postgresql://user:password@localhost:5432/myprodusen_test"
```

### Tests Timing Out

Increase test timeout in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    testTimeout: 10000, // 10 seconds
  },
});
```

### Cleanup Errors

If cleanup fails, manually clean test data:

```sql
DELETE FROM "Attendance" WHERE id LIKE 'test_%';
DELETE FROM "Employee" WHERE id LIKE 'test_%';
DELETE FROM "User" WHERE id LIKE 'test_%';
```

## Future Improvements

1. Add E2E tests using Playwright or Cypress
2. Add performance tests for critical endpoints
3. Add load testing for attendance check-in
4. Add mutation testing to verify test quality
5. Add visual regression tests for UI components
6. Add API contract tests using Pact or similar
7. Add security tests (SQL injection, XSS, etc.)

## Contributing

When adding new features:

1. Write tests before or alongside implementation
2. Ensure all tests pass before submitting PR
3. Maintain or improve coverage percentage
4. Update this documentation if adding new test categories
