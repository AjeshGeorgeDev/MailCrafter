# Test Suite Documentation

This directory contains comprehensive tests for the MailCrafter application.

## Test Structure

```
tests/
├── setup.ts                    # Global test setup and mocks
├── utils/
│   └── test-helpers.ts        # Test utilities and helpers
├── lib/                        # Library function tests
│   ├── auth/
│   │   └── password.test.ts
│   ├── email/
│   │   └── email-logger.test.ts
│   ├── email-builder/
│   │   ├── renderer.test.ts
│   │   └── types.test.ts
│   └── templates/
│       └── predefined-templates.test.ts
├── app/                        # Application tests
│   ├── actions/               # Server action tests
│   │   ├── notifications.test.ts
│   │   ├── templates.test.ts
│   │   ├── campaigns.test.ts
│   │   └── smtp.test.ts
│   └── api/                   # API route tests
│       └── email/
│           └── send.test.ts
├── components/                # Component tests
│   └── ui/
│       └── button.test.tsx
└── integration/              # Integration tests
    └── template-flow.test.ts
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with UI
```bash
npm run test:ui
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test tests/lib/auth/password.test.ts
```

## Test Categories

### Unit Tests
- **Library Functions**: Core utilities, helpers, and business logic
- **Server Actions**: Server-side action functions
- **Components**: React component rendering and behavior

### Integration Tests
- **Template Flow**: End-to-end template creation and retrieval
- **Language Switching**: Multi-language template management
- **Database Operations**: Prisma queries and transactions

### API Tests
- **Email Sending**: Email API endpoints
- **Authentication**: Auth-related API routes

## Test Utilities

### Test Helpers (`tests/utils/test-helpers.ts`)
- `createTestUser()` - Create a test user
- `createTestOrganization()` - Create a test organization
- `createTestTemplate()` - Create a test template
- `createTestSmtpProfile()` - Create a test SMTP profile
- `cleanupTestData()` - Clean up test data
- `createMockPrisma()` - Create a mocked Prisma client

### Setup (`tests/setup.ts`)
- Mocks Next.js navigation hooks
- Mocks NextAuth session
- Sets up environment variables
- Global test configuration

## Writing Tests

### Example Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { functionToTest } from '@/path/to/function';

describe('Function Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should do something', () => {
    // Test implementation
    expect(result).toBe(expected);
  });
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

### Mocking Server Actions

```typescript
vi.mock('@/lib/auth/session', () => ({
  getCurrentUser: vi.fn(),
}));
```

## Coverage Goals

- **Unit Tests**: 80%+ coverage for core functions
- **Integration Tests**: Cover critical user flows
- **Component Tests**: Test UI interactions and rendering

## Continuous Integration

Tests should be run in CI/CD pipeline:
- On every pull request
- Before deployment
- On main branch commits

## Notes

- Tests use Vitest as the test runner
- React Testing Library for component tests
- Prisma is mocked for unit tests
- Integration tests use a test database

