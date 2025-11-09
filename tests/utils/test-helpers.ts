import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/lib/auth/password';
import { vi } from 'vitest';

export const prisma = new PrismaClient();

/**
 * Create a test user
 */
export async function createTestUser(data?: {
  email?: string;
  password?: string;
  name?: string;
  role?: string;
}) {
  const email = data?.email || `test-${Date.now()}@example.com`;
  const password = data?.password || 'Test123!@#';
  const hashedPassword = await hashPassword(password);

  return await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: data?.name || 'Test User',
      role: (data?.role as any) || 'OWNER',
    },
  });
}

/**
 * Create a test organization
 */
export async function createTestOrganization(data?: {
  name?: string;
  defaultLanguage?: string;
}) {
  return await prisma.organization.create({
    data: {
      name: data?.name || 'Test Organization',
      defaultLanguage: data?.defaultLanguage || 'en',
    },
  });
}

/**
 * Create an organization member
 */
export async function createTestOrganizationMember(data: {
  userId: string;
  organizationId: string;
  role?: string;
}) {
  return await prisma.organizationMember.create({
    data: {
      userId: data.userId,
      organizationId: data.organizationId,
      role: (data.role as any) || 'OWNER',
    },
  });
}

/**
 * Create a test template
 */
export async function createTestTemplate(data: {
  organizationId: string;
  createdBy: string;
  name?: string;
  defaultLanguage?: string;
}) {
  return await prisma.template.create({
    data: {
      organizationId: data.organizationId,
      createdBy: data.createdBy,
      name: data.name || 'Test Template',
      defaultLanguage: data.defaultLanguage || 'en',
    },
  });
}

/**
 * Create a test SMTP profile
 */
export async function createTestSmtpProfile(data: {
  organizationId: string;
  name?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
}) {
  return await prisma.smtpProfile.create({
    data: {
      organizationId: data.organizationId,
      name: data.name || 'Test SMTP',
      host: data.host || 'smtp.example.com',
      port: data.port || 587,
      username: data.username || 'test@example.com',
      password: data.password || 'encrypted-password',
      fromEmail: 'test@example.com',
      fromName: 'Test',
      encryption: 'TLS',
    },
  });
}

/**
 * Clean up test data
 */
export async function cleanupTestData() {
  await prisma.notification.deleteMany({});
  await prisma.emailLog.deleteMany({});
  await prisma.campaign.deleteMany({});
  await prisma.templateLanguage.deleteMany({});
  await prisma.templateVersion.deleteMany({});
  await prisma.template.deleteMany({});
  await prisma.smtpProfile.deleteMany({});
  await prisma.organizationMember.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.user.deleteMany({});
}

/**
 * Mock Prisma client for unit tests
 */
export function createMockPrisma() {
  return {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    organizationMember: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    template: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    smtpProfile: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    notification: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
  } as any;
}

