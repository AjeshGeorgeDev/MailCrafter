"use server";

import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

const createCustomVariableSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  path: z.string().min(1, "Path is required").regex(/^[a-zA-Z][a-zA-Z0-9_.]*$/, "Path must start with a letter and contain only letters, numbers, dots, and underscores"),
  description: z.string().optional(),
  type: z.enum(["string", "number", "boolean", "object", "array"]).default("string"),
  sampleValue: z.any().optional(),
  category: z.string().default("Custom"),
});

const updateCustomVariableSchema = createCustomVariableSchema.partial();

/**
 * Get all custom variables for the current organization
 */
export async function getCustomVariables() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Get user's organization
    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: { organization: true },
    });

    if (!orgMember?.organization) {
      return { variables: [] };
    }

    const variables = await prisma.customVariable.findMany({
      where: {
        organizationId: orgMember.organization.id,
      },
      orderBy: {
        name: "asc",
      },
    });

    return { success: true, variables };
  } catch (error) {
    console.error("Get custom variables error:", error);
    return { error: "Failed to get custom variables" };
  }
}

/**
 * Create a new custom variable
 */
export async function createCustomVariable(data: z.infer<typeof createCustomVariableSchema>) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Get user's organization
    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: { organization: true },
    });

    if (!orgMember?.organization) {
      return { error: "User is not part of an organization" };
    }

    // Check permissions (only OWNER, ADMIN, EDITOR can create)
    if (orgMember.role === "VIEWER") {
      return { error: "Insufficient permissions" };
    }

    const validated = createCustomVariableSchema.parse(data);

    // Ensure path starts with "custom." prefix
    const path = validated.path.startsWith("custom.") 
      ? validated.path 
      : `custom.${validated.path}`;

    // Check if path already exists
    const existing = await prisma.customVariable.findFirst({
      where: {
        organizationId: orgMember.organization.id,
        path,
      },
    });

    if (existing) {
      return { error: "A variable with this path already exists" };
    }

    const variable = await prisma.customVariable.create({
      data: {
        ...validated,
        path,
        organizationId: orgMember.organization.id,
      },
    });

    revalidatePath("/dashboard/templates");
    return { success: true, variable };
  } catch (error) {
    console.error("Create custom variable error:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to create custom variable" };
  }
}

/**
 * Update a custom variable
 */
export async function updateCustomVariable(
  id: string,
  data: z.infer<typeof updateCustomVariableSchema>
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Get user's organization
    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: { organization: true },
    });

    if (!orgMember?.organization) {
      return { error: "User is not part of an organization" };
    }

    // Check permissions
    if (orgMember.role === "VIEWER") {
      return { error: "Insufficient permissions" };
    }

    // Verify variable belongs to organization
    const variable = await prisma.customVariable.findFirst({
      where: {
        id,
        organizationId: orgMember.organization.id,
      },
    });

    if (!variable) {
      return { error: "Variable not found or access denied" };
    }

    const validated = updateCustomVariableSchema.parse(data);
    
    // Handle path update
    let path = validated.path;
    if (path && !path.startsWith("custom.")) {
      path = `custom.${path}`;
    }

    // Check if new path conflicts with existing variable
    if (path && path !== variable.path) {
      const existing = await prisma.customVariable.findFirst({
        where: {
          organizationId: orgMember.organization.id,
          path,
          id: { not: id },
        },
      });

      if (existing) {
        return { error: "A variable with this path already exists" };
      }
    }

    const updated = await prisma.customVariable.update({
      where: { id },
      data: {
        ...validated,
        path: path || undefined,
      },
    });

    revalidatePath("/dashboard/templates");
    return { success: true, variable: updated };
  } catch (error) {
    console.error("Update custom variable error:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to update custom variable" };
  }
}

/**
 * Delete a custom variable
 */
export async function deleteCustomVariable(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Get user's organization
    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: { organization: true },
    });

    if (!orgMember?.organization) {
      return { error: "User is not part of an organization" };
    }

    // Check permissions
    if (orgMember.role === "VIEWER") {
      return { error: "Insufficient permissions" };
    }

    // Verify variable belongs to organization
    const variable = await prisma.customVariable.findFirst({
      where: {
        id,
        organizationId: orgMember.organization.id,
      },
    });

    if (!variable) {
      return { error: "Variable not found or access denied" };
    }

    await prisma.customVariable.delete({
      where: { id },
    });

    revalidatePath("/dashboard/templates");
    return { success: true };
  } catch (error) {
    console.error("Delete custom variable error:", error);
    return { error: "Failed to delete custom variable" };
  }
}

