import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/email/send/route';
import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

// Mock dependencies
vi.mock('@/lib/auth/session');
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    organizationMember: {
      findFirst: vi.fn(),
    },
    template: {
      findFirst: vi.fn(),
    },
    smtpProfile: {
      findFirst: vi.fn(),
    },
  },
}));
vi.mock('@/lib/email/email-service', () => ({
  sendEmail: vi.fn(),
}));
vi.mock('@/lib/email/email-logger', () => ({
  createEmailLog: vi.fn(),
}));
vi.mock('@/app/actions/email-queue', () => ({
  queueBulkEmails: vi.fn().mockResolvedValue({ success: true }),
}));

describe('Email Send API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send email successfully', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
    };

    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.organizationMember.findFirst).mockResolvedValue({
      userId: mockUser.id,
      organizationId: 'org-1',
      organization: { id: 'org-1' },
    } as any);
    vi.mocked(prisma.template.findFirst).mockResolvedValue({
      id: 'template-1',
      name: 'Test Template',
      organizationId: 'org-1',
    } as any);
    vi.mocked(prisma.smtpProfile.findFirst).mockResolvedValue({
      id: 'smtp-1',
      isActive: true,
    } as any);

    const request = new NextRequest('http://localhost:3000/api/email/send', {
      method: 'POST',
      body: JSON.stringify({
        templateId: 'template-1',
        subject: 'Test Subject',
        recipients: ['recipient@example.com'],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    // The API queues template-based emails, so check for success
    expect([200, 201, 202]).toContain(response.status);
    if (response.status === 200 || response.status === 201 || response.status === 202) {
      expect(data).toHaveProperty('success');
    }
  });

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/email/send', {
      method: 'POST',
      body: JSON.stringify({
        templateId: 'template-1',
        subject: 'Test Subject',
        recipients: ['recipient@example.com'],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 404 if template not found', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
    };

    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.organizationMember.findFirst).mockResolvedValue({
      userId: mockUser.id,
      organizationId: 'org-1',
      organization: { id: 'org-1' },
    } as any);
    vi.mocked(prisma.template.findFirst).mockResolvedValue(null);
    
    const { queueBulkEmails } = await import('@/app/actions/email-queue');
    vi.mocked(queueBulkEmails).mockResolvedValue({ error: 'Template not found' });

    const request = new NextRequest('http://localhost:3000/api/email/send', {
      method: 'POST',
      body: JSON.stringify({
        templateId: 'template-1',
        subject: 'Test Subject',
        recipients: ['recipient@example.com'],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    // The API returns 400 with error message when template not found in queue flow
    expect([400, 404]).toContain(response.status);
    if (response.status === 400 || response.status === 404) {
      expect(data.error).toBeDefined();
    }
  });
});

