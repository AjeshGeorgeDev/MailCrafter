# Testing Guide

This document provides an overview of the test suite for MailCrafter.

## Quick Start

```bash
# Install dependencies (if not already installed)
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Test Structure

The test suite is organized into the following categories:

### 1. Unit Tests (`tests/lib/`)
- **Authentication**: Password hashing, validation
- **Email Builder**: Renderer, types, adapters
- **Email Services**: Email logging, statistics
- **Security**: Encryption utilities
- **Templates**: Predefined templates, structure validation
- **Validations**: SMTP config validation

### 2. Server Action Tests (`tests/app/actions/`)
- **Notifications**: CRUD operations
- **Templates**: Template creation, saving, retrieval
- **Campaigns**: Campaign management
- **SMTP**: SMTP profile management
- **Organizations**: Organization settings

### 3. API Route Tests (`tests/app/api/`)
- **Email Sending**: Email API endpoints
- Authentication and authorization

### 4. Component Tests (`tests/components/`)
- **UI Components**: Button, form components
- React component rendering and interactions

### 5. Integration Tests (`tests/integration/`)
- **Template Flow**: End-to-end template creation and retrieval
- Multi-language template management
- Database operations

## Test Coverage

### Current Coverage Areas

✅ **Authentication & Security**
- Password hashing and validation
- Encryption/decryption utilities
- Session management

✅ **Email Builder**
- Document rendering
- Structure conversion
- Type validation

✅ **Server Actions**
- Template operations
- Campaign management
- SMTP profile management
- Notification system
- Organization settings

✅ **API Routes**
- Email sending endpoints
- Authentication checks

✅ **Utilities**
- Class name merging
- Validation schemas
- Helper functions

## Writing New Tests

### Test File Naming
- Unit tests: `*.test.ts`
- Component tests: `*.test.tsx`
- Integration tests: `integration/*.test.ts`

### Example Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { functionToTest } from '@/path/to/function';

describe('Function Name', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something', () => {
    const result = functionToTest();
    expect(result).toBe(expected);
  });
});
```

### Using Test Helpers

```typescript
import { 
  createTestUser, 
  createTestOrganization,
  cleanupTestData 
} from '../utils/test-helpers';

beforeEach(async () => {
  await cleanupTestData();
  const user = await createTestUser();
  const org = await createTestOrganization();
});
```

### Mocking Prisma

```typescript
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));
```

## Running Specific Tests

```bash
# Run a specific test file
npm test tests/lib/auth/password.test.ts

# Run tests matching a pattern
npm test -- --grep "password"

# Run tests in a specific directory
npm test tests/lib/
```

## Coverage Goals

- **Unit Tests**: 80%+ coverage for core functions
- **Integration Tests**: Cover all critical user flows
- **Component Tests**: Test UI interactions and rendering

## Continuous Integration

Tests should be run:
- On every pull request
- Before deployment
- On main branch commits

## Troubleshooting

### Tests failing due to Prisma client
- Ensure `prisma generate` has been run
- Check database connection in test environment

### Component tests failing
- Ensure `jsdom` environment is set in `vitest.config.ts`
- Check React Testing Library setup

### Mock issues
- Verify mocks are set up in `tests/setup.ts`
- Check that mocks are reset in `beforeEach` hooks

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data after tests
3. **Mocks**: Mock external dependencies (database, APIs)
4. **Descriptive Names**: Use clear test descriptions
5. **Arrange-Act-Assert**: Structure tests clearly
6. **Coverage**: Aim for meaningful coverage, not just numbers

## Test Utilities

### Available Helpers (`tests/utils/test-helpers.ts`)

- `createTestUser()` - Create a test user
- `createTestOrganization()` - Create a test organization
- `createTestTemplate()` - Create a test template
- `createTestSmtpProfile()` - Create a test SMTP profile
- `cleanupTestData()` - Clean up all test data
- `createMockPrisma()` - Create a mocked Prisma client

## Next Steps

- [ ] Add E2E tests with Playwright
- [ ] Increase component test coverage
- [ ] Add performance tests
- [ ] Add accessibility tests
- [ ] Set up CI/CD test pipeline

