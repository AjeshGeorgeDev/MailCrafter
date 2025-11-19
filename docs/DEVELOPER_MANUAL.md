# MailCrafter Developer Manual

**Version:** 1.0  
**Last Updated:** December 2024

Complete guide for developers working on MailCrafter - from setup to deployment.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Architecture Overview](#architecture-overview)
3. [Project Structure](#project-structure)
4. [Development Environment](#development-environment)
5. [Core Concepts](#core-concepts)
6. [API Development](#api-development)
7. [Component Development](#component-development)
8. [Database & Prisma](#database--prisma)
9. [Testing](#testing)
10. [Authentication & Security](#authentication--security)
11. [Email Builder System](#email-builder-system)
12. [Deployment](#deployment)
13. [Contributing](#contributing)
14. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ or **yarn** 1.22+
- **PostgreSQL** 14+ (or Docker)
- **Redis** 6+ (optional, for queue)
- **Git** 2.30+

### Initial Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/mailcrafter.git
   cd mailcrafter
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/mailcrafter"
   
   # NextAuth
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Redis (optional)
   REDIS_URL="redis://localhost:6379"
   
   # Encryption (optional)
   ENCRYPTION_KEY="your-encryption-key"
   ```

4. **Start Docker services:**
   ```bash
   docker-compose up -d
   ```
   
   This starts:
   - PostgreSQL database
   - Redis (if configured)

5. **Run database migrations:**
   ```bash
   npx prisma migrate dev
   ```

6. **Seed the database:**
   ```bash
   npx prisma db seed
   ```

7. **Start development server:**
   ```bash
   npm run dev
   ```

8. **Access the application:**
   - Web: http://localhost:3000
   - Prisma Studio: `npx prisma studio`

### Development Scripts

```bash
# Development
npm run dev              # Start Next.js dev server + worker
npm run dev:next         # Start only Next.js dev server
npm run worker           # Start email worker (tsx watch)

# Building
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:ui          # Run tests with UI
npm run test:coverage    # Generate coverage report

# Database
npx prisma studio        # Open Prisma Studio
npx prisma migrate dev    # Create and apply migrations
npx prisma generate      # Generate Prisma Client
npx prisma db seed       # Seed database

# Linting
npm run lint             # Run ESLint
```

---

## Architecture Overview

### Technology Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5.9+
- **UI Library:** React 19
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** PostgreSQL (Prisma ORM)
- **Authentication:** NextAuth.js
- **Queue:** Bull (Redis-based)
- **Email:** Nodemailer
- **Testing:** Vitest + React Testing Library
- **Rich Text:** TipTap

### Architecture Patterns

#### 1. **Server Components & Server Actions**

Next.js App Router uses React Server Components by default:

```typescript
// app/dashboard/templates/page.tsx
export default async function TemplatesPage() {
  const templates = await getTemplates(); // Server-side data fetching
  
  return <TemplatesClient templates={templates} />;
}
```

#### 2. **Server Actions**

For mutations, use Server Actions:

```typescript
// app/actions/templates.ts
'use server'

export async function createTemplate(data: TemplateData) {
  // Server-side logic
  const template = await db.template.create({ data });
  return { success: true, template };
}
```

#### 3. **Client Components**

Mark components that need interactivity with `"use client"`:

```typescript
'use client'

export function InteractiveComponent() {
  const [state, setState] = useState();
  // Client-side logic
}
```

### Data Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Next.js App    │
│  (Server/Client)│
└──────┬──────────┘
       │
       ├──► Server Actions ──► Prisma ──► PostgreSQL
       │
       ├──► API Routes ──► Services ──► External APIs
       │
       └──► Client Components ──► React State ──► UI
```

---

## Project Structure

```
mailcrafter/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   └── register/
│   ├── (public)/                 # Public routes
│   │   ├── unsubscribe/
│   │   └── preferences/
│   ├── dashboard/                # Protected dashboard
│   │   ├── templates/
│   │   ├── campaigns/
│   │   ├── analytics/
│   │   └── settings/
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   ├── email/
│   │   ├── templates/
│   │   └── track/
│   ├── actions/                  # Server actions
│   │   ├── templates.ts
│   │   ├── campaigns.ts
│   │   └── smtp.ts
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Home page
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── email-builder/            # Email builder components
│   ├── templates/                # Template components
│   ├── campaigns/                # Campaign components
│   ├── dashboard/                # Dashboard components
│   └── shared/                   # Shared components
│
├── lib/                          # Library code
│   ├── auth/                     # Authentication
│   ├── db/                       # Database utilities
│   ├── email/                    # Email services
│   ├── email-builder/            # Email builder logic
│   ├── templates/                # Template utilities
│   ├── queue/                    # Queue management
│   └── utils.ts                  # Utilities
│
├── prisma/                       # Database
│   ├── schema.prisma             # Prisma schema
│   ├── migrations/               # Migration files
│   └── seed.ts                   # Seed script
│
├── workers/                      # Background workers
│   └── email-worker.ts           # Email queue worker
│
├── tests/                        # Test files
│   ├── setup.ts                  # Test setup
│   ├── app/                      # App tests
│   ├── components/               # Component tests
│   ├── lib/                      # Library tests
│   └── integration/              # Integration tests
│
├── public/                       # Static assets
├── docs/                         # Documentation
├── docker-compose.yml            # Docker services
├── next.config.js                # Next.js config
├── tailwind.config.ts            # Tailwind config
├── tsconfig.json                 # TypeScript config
└── vitest.config.ts              # Vitest config
```

---

## Development Environment

### IDE Setup

**Recommended:** VS Code with extensions:

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Prisma** - Prisma syntax highlighting
- **Tailwind CSS IntelliSense** - Tailwind autocomplete
- **TypeScript** - TypeScript support

**VS Code Settings** (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

### Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secret for NextAuth.js
- `NEXTAUTH_URL` - Application URL

**Optional:**
- `REDIS_URL` - Redis connection (for queue)
- `ENCRYPTION_KEY` - Encryption key (defaults to dev key)

### Database Management

**Prisma Studio:**
```bash
npx prisma studio
```

**Create Migration:**
```bash
npx prisma migrate dev --name migration-name
```

**Reset Database:**
```bash
npx prisma migrate reset
```

**Generate Prisma Client:**
```bash
npx prisma generate
```

---

## Core Concepts

### 1. Server Actions

Server Actions are async functions that run on the server:

```typescript
// app/actions/templates.ts
'use server'

import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';

export async function createTemplate(data: TemplateData) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const template = await db.template.create({
    data: {
      ...data,
      userId: user.id,
    },
  });

  return { success: true, template };
}
```

**Usage in Client Components:**
```typescript
'use client'

import { createTemplate } from '@/app/actions/templates';

export function TemplateForm() {
  async function handleSubmit(formData: FormData) {
    const result = await createTemplate({
      name: formData.get('name'),
      // ...
    });
    
    if (result.success) {
      // Handle success
    }
  }
  
  return <form action={handleSubmit}>...</form>;
}
```

### 2. API Routes

For REST APIs, use Next.js API routes:

```typescript
// app/api/templates/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const template = await db.template.findUnique({
    where: { id: params.id },
  });

  return NextResponse.json(template);
}
```

### 3. Authentication

**Get Current User:**
```typescript
import { getCurrentUser } from '@/lib/auth/session';

const user = await getCurrentUser();
if (!user) {
  redirect('/login');
}
```

**Check Permissions:**
```typescript
import { hasPermission } from '@/lib/auth/permissions';

if (!hasPermission(user.role, 'templates.create')) {
  return { success: false, error: 'Insufficient permissions' };
}
```

### 4. Error Handling

**Server Actions:**
```typescript
export async function action() {
  try {
    // Logic
    return { success: true, data };
  } catch (error) {
    console.error('Action failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
```

**API Routes:**
```typescript
export async function GET() {
  try {
    // Logic
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## API Development

### Creating Server Actions

1. **Create action file:**
   ```typescript
   // app/actions/my-feature.ts
   'use server'
   
   import { getCurrentUser } from '@/lib/auth/session';
   import { db } from '@/lib/db';
   ```

2. **Add validation:**
   ```typescript
   import { z } from 'zod';
   
   const schema = z.object({
     name: z.string().min(1),
     email: z.string().email(),
   });
   ```

3. **Implement action:**
   ```typescript
   export async function createItem(data: unknown) {
     const user = await getCurrentUser();
     if (!user) {
       return { success: false, error: 'Unauthorized' };
     }
     
     const validated = schema.parse(data);
     // ... implementation
   }
   ```

### Creating API Routes

```typescript
// app/api/items/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Handle GET
}

export async function POST(request: NextRequest) {
  // Handle POST
}

// app/api/items/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Handle GET with ID
}
```

### API Key Authentication

For programmatic access:

```typescript
import { verifyApiKey } from '@/lib/auth/api-keys';

export async function apiAction(request: Request) {
  const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!apiKey) {
    return { success: false, error: 'API key required' };
  }
  
  const user = await verifyApiKey(apiKey);
  if (!user) {
    return { success: false, error: 'Invalid API key' };
  }
  
  // Proceed with authenticated request
}
```

---

## Component Development

### Component Structure

```typescript
'use client' // Only if needed

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const [state, setState] = useState();
  
  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={onAction}>Action</Button>
    </div>
  );
}
```

### Using shadcn/ui Components

```typescript
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent>
        <Input placeholder="Enter text" />
        <Button>Submit</Button>
      </CardContent>
    </Card>
  );
}
```

### Form Handling

**With React Hook Form:**
```typescript
'use client'

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export function MyForm() {
  const form = useForm({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: z.infer<typeof schema>) {
    const result = await createItem(data);
    // Handle result
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

---

## Database & Prisma

### Schema Definition

```prisma
// prisma/schema.prisma
model Template {
  id        String   @id @default(cuid())
  name      String
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@map("templates")
}
```

### Database Queries

**Using Prisma Client:**
```typescript
import { db } from '@/lib/db';

// Create
const template = await db.template.create({
  data: {
    name: 'My Template',
    userId: user.id,
  },
});

// Read
const template = await db.template.findUnique({
  where: { id: templateId },
  include: { user: true },
});

// Update
const updated = await db.template.update({
  where: { id: templateId },
  data: { name: 'New Name' },
});

// Delete
await db.template.delete({
  where: { id: templateId },
});

// Query with relations
const templates = await db.template.findMany({
  where: { userId: user.id },
  include: {
    user: true,
    versions: true,
  },
  orderBy: { createdAt: 'desc' },
});
```

### Transactions

```typescript
await db.$transaction(async (tx) => {
  const template = await tx.template.create({ data });
  await tx.templateVersion.create({
    data: { templateId: template.id },
  });
});
```

---

## Testing

### Writing Tests

**Unit Test Example:**
```typescript
// tests/lib/my-feature.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from '@/lib/my-feature';

describe('myFunction', () => {
  it('should return expected result', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

**Component Test Example:**
```typescript
// tests/components/MyComponent.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

**Server Action Test:**
```typescript
// tests/app/actions/my-action.test.ts
import { describe, it, expect, vi } from 'vitest';
import { myAction } from '@/app/actions/my-action';

vi.mock('@/lib/auth/session', () => ({
  getCurrentUser: vi.fn(() => ({ id: 'user-1' })),
}));

describe('myAction', () => {
  it('should create item', async () => {
    const result = await myAction({ name: 'Test' });
    expect(result.success).toBe(true);
  });
});
```

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# With UI
npm run test:ui

# Coverage
npm run test:coverage

# Specific file
npm test tests/lib/my-feature.test.ts
```

### Test Structure

- **Unit tests:** `tests/lib/`
- **Component tests:** `tests/components/`
- **Server action tests:** `tests/app/actions/`
- **API tests:** `tests/app/api/`
- **Integration tests:** `tests/integration/`

---

## Authentication & Security

### User Authentication

**NextAuth Configuration:**
```typescript
// lib/auth/auth.config.ts
export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      // Configuration
    }),
  ],
  // ...
};
```

### Password Hashing

```typescript
import { hashPassword, comparePassword } from '@/lib/auth/password';

// Hash password
const hashed = await hashPassword('plain-password');

// Verify password
const isValid = await comparePassword('plain-password', hashed);
```

### API Key Management

```typescript
import { hashApiKey, verifyApiKey } from '@/lib/auth/api-keys';

// Hash API key for storage
const hashed = await hashApiKey(apiKey);

// Verify API key
const user = await verifyApiKey(apiKey);
```

### Permissions

```typescript
import { hasPermission, getRolePermissions } from '@/lib/auth/permissions';

// Check permission
if (hasPermission(user.role, 'templates.create')) {
  // Allow action
}

// Get all permissions for role
const permissions = getRolePermissions(user.role);
```

---

## Email Builder System

### Email Builder Architecture

The email builder uses a block-based system:

```typescript
// lib/email-builder/types.ts
export interface EmailBuilderDocument {
  root: ContainerBlock;
}

export interface Block {
  id: string;
  type: BlockType;
  data: BlockData;
}

export type BlockType = 
  | 'Container'
  | 'Text'
  | 'Heading'
  | 'Button'
  | 'Image'
  | 'Spacer'
  | 'Divider'
  | 'SocialLinks'
  | 'Footer';
```

### Creating Custom Blocks

1. **Define block type:**
   ```typescript
   // lib/email-builder/types.ts
   export type BlockType = 'Container' | 'Text' | 'MyCustomBlock';
   ```

2. **Create block component:**
   ```typescript
   // components/email-builder/blocks/MyCustomBlock.tsx
   export function MyCustomBlock({ block, blockId }: BlockProps) {
     // Render block
   }
   ```

3. **Add to renderer:**
   ```typescript
   // components/email-builder/BlockRenderer.tsx
   case 'MyCustomBlock':
     return <MyCustomBlock block={block} blockId={blockId} />;
   ```

### Email Rendering

```typescript
import { renderToStaticMarkup } from '@/lib/email/renderer';

const html = renderToStaticMarkup(document, {
  variables: { user: { name: 'John' } },
  language: 'en',
});
```

---

## Deployment

### Production Build

```bash
# Build
npm run build

# Start
npm start
```

### Environment Variables

Set in production:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `REDIS_URL` (if using queue)
- `ENCRYPTION_KEY`

### Docker Deployment

**Dockerfile:**
```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

### Vercel Deployment

1. Connect GitHub repository
2. Configure environment variables
3. Deploy automatically on push

### Database Migrations

In production:
```bash
npx prisma migrate deploy
```

---

## Contributing

### Development Workflow

1. **Create feature branch:**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes:**
   - Write code
   - Add tests
   - Update documentation

3. **Run tests:**
   ```bash
   npm test
   npm run lint
   ```

4. **Commit:**
   ```bash
   git commit -m "feat: add my feature"
   ```

5. **Push and create PR:**
   ```bash
   git push origin feature/my-feature
   ```

### Code Style

- **TypeScript:** Strict mode enabled
- **Formatting:** Prettier
- **Linting:** ESLint
- **Naming:** camelCase for variables, PascalCase for components

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance

### Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Request review
4. Address feedback
5. Merge after approval

---

## Troubleshooting

### Common Issues

#### Database Connection

**Error:** `Can't reach database server`

**Solutions:**
- Check Docker is running: `docker ps`
- Verify `DATABASE_URL` in `.env`
- Restart Docker: `docker-compose restart`

#### Prisma Client Not Generated

**Error:** `Cannot find module '@prisma/client'`

**Solution:**
```bash
npx prisma generate
```

#### Build Errors

**Error:** TypeScript errors in build

**Solutions:**
- Run `npm run lint` to find issues
- Check `tsconfig.json` settings
- Ensure all types are defined

#### Test Failures

**Error:** Tests failing

**Solutions:**
- Clear cache: `rm -rf node_modules/.cache`
- Reinstall: `rm -rf node_modules && npm install`
- Check test setup: `tests/setup.ts`

### Debugging

**Enable Debug Logging:**
```typescript
// Add to .env
DEBUG=*
```

**Prisma Debug:**
```typescript
// Enable query logging
const db = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

**Next.js Debug:**
```bash
NODE_OPTIONS='--inspect' npm run dev
```

---

## Additional Resources

### Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Internal Documentation

- [API Documentation](./API_DOCUMENTATION.md)
- [User Manual](./USER_MANUAL.md)
- [Testing Guide](./TESTING.md)

### Support

- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions
- **Email:** dev@mailcrafter.com

---

**Happy Coding! 🚀**

