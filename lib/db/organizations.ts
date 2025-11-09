import { prisma } from "./prisma";
import { Role } from "@prisma/client";

export interface CreateOrganizationData {
  name: string;
}

export interface UpdateOrganizationData {
  name?: string;
}

export async function createOrganization(data: CreateOrganizationData, userId: string) {
  try {
    return await prisma.organization.create({
      data: {
        name: data.name,
        members: {
          create: {
            userId,
            role: Role.OWNER,
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error creating organization:", error);
    throw error;
  }
}

export async function getOrganization(id: string) {
  try {
    return await prisma.organization.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching organization:", error);
    throw error;
  }
}

export async function getUserOrganizations(userId: string) {
  try {
    return await prisma.organization.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          where: {
            userId,
          },
          include: {
            user: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user organizations:", error);
    throw error;
  }
}

export async function updateOrganization(id: string, data: UpdateOrganizationData) {
  try {
    return await prisma.organization.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error("Error updating organization:", error);
    throw error;
  }
}

export async function deleteOrganization(id: string) {
  try {
    return await prisma.organization.delete({
      where: { id },
    });
  } catch (error) {
    console.error("Error deleting organization:", error);
    throw error;
  }
}

export async function addMember(orgId: string, userId: string, role: Role) {
  try {
    return await prisma.organizationMember.create({
      data: {
        organizationId: orgId,
        userId,
        role,
      },
      include: {
        user: true,
      },
    });
  } catch (error) {
    console.error("Error adding member:", error);
    throw error;
  }
}

export async function removeMember(orgId: string, userId: string) {
  try {
    return await prisma.organizationMember.delete({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
    });
  } catch (error) {
    console.error("Error removing member:", error);
    throw error;
  }
}

export async function updateMemberRole(orgId: string, userId: string, role: Role) {
  try {
    return await prisma.organizationMember.update({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
      data: { role },
      include: {
        user: true,
      },
    });
  } catch (error) {
    console.error("Error updating member role:", error);
    throw error;
  }
}

