/**
 * Tests for Setup Server Actions
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isSetupNeeded,
  setupSuperAdmin,
} from "@/app/actions/setup";
import { prisma } from "@/lib/db/prisma";
import { Role } from "@prisma/client";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    organization: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db/users", () => ({
  createUser: vi.fn(),
}));

vi.mock("@/lib/db/organizations", () => ({
  createOrganization: vi.fn(),
}));

vi.mock("@/lib/auth/password", () => ({
  hashPassword: vi.fn((password) => Promise.resolve(`hashed_${password}`)),
  validatePasswordStrength: vi.fn(() => ({ valid: true, errors: [] })),
}));

describe("Setup Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isSetupNeeded", () => {
    it("should return needsSetup=true when no OWNER users exist", async () => {
      (prisma.user.count as any).mockResolvedValue(0);

      const result = await isSetupNeeded();

      expect(result.needsSetup).toBe(true);
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: { role: Role.OWNER },
      });
    });

    it("should return needsSetup=false when OWNER users exist", async () => {
      (prisma.user.count as any).mockResolvedValue(1);

      const result = await isSetupNeeded();

      expect(result.needsSetup).toBe(false);
    });

    it("should default to needsSetup=true on error", async () => {
      (prisma.user.count as any).mockRejectedValue(new Error("Database error"));

      const result = await isSetupNeeded();

      expect(result.needsSetup).toBe(true);
    });
  });

  describe("setupSuperAdmin", () => {
    const validData = {
      name: "Super Admin",
      email: "admin@example.com",
      password: "SecurePass123!",
      confirmPassword: "SecurePass123!",
      organizationName: "My Organization",
    };

    it("should create super admin and organization successfully", async () => {
      const { createUser } = await import("@/lib/db/users");
      const { createOrganization } = await import("@/lib/db/organizations");

      (prisma.user.count as any).mockResolvedValue(0);
      (prisma.user.findUnique as any).mockResolvedValue(null);
      (createUser as any).mockResolvedValue({
        id: "user-1",
        email: validData.email,
        name: validData.name,
        role: Role.OWNER,
      });
      (prisma.user.update as any).mockResolvedValue({});
      (createOrganization as any).mockResolvedValue({});

      const result = await setupSuperAdmin(validData);

      expect(result.success).toBe(true);
      expect(createUser).toHaveBeenCalledWith({
        email: validData.email,
        password: expect.stringContaining("hashed_"),
        name: validData.name,
        role: Role.OWNER,
      });
      expect(createOrganization).toHaveBeenCalled();
    });

    it("should return error if setup already completed", async () => {
      (prisma.user.count as any).mockResolvedValue(1);

      const result = await setupSuperAdmin(validData);

      expect(result.error).toContain("already been completed");
    });

    it("should return error if user already exists", async () => {
      (prisma.user.count as any).mockResolvedValue(0);
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "existing-user",
        email: validData.email,
      });

      const result = await setupSuperAdmin(validData);

      expect(result.error).toContain("already exists");
    });

    it("should return error if password validation fails", async () => {
      const { validatePasswordStrength } = await import("@/lib/auth/password");
      (prisma.user.count as any).mockResolvedValue(0);
      (prisma.user.findUnique as any).mockResolvedValue(null);
      (validatePasswordStrength as any).mockReturnValue({
        valid: false,
        errors: ["Password too weak"],
      });

      const result = await setupSuperAdmin(validData);

      expect(result.error).toContain("Password too weak");
    });

    it("should return error if passwords don't match", async () => {
      const invalidData = {
        ...validData,
        confirmPassword: "DifferentPassword123!",
      };

      const result = await setupSuperAdmin(invalidData);

      expect(result.error).toBeDefined();
    });

    it("should return error if validation fails", async () => {
      const invalidData = {
        name: "",
        email: "invalid-email",
        password: "123",
        confirmPassword: "123",
        organizationName: "",
      };

      const result = await setupSuperAdmin(invalidData);

      expect(result.error).toBeDefined();
    });
  });
});

