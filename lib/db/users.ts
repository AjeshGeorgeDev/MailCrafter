import { prisma } from "./prisma";
import { Role } from "@prisma/client";

export interface CreateUserData {
  email: string;
  password: string;
  name?: string;
  role?: Role;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: Role;
  image?: string;
}

export async function createUser(data: CreateUserData) {
  try {
    return await prisma.user.create({
      data,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

export async function getUserById(id: string) {
  try {
    return await prisma.user.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    throw error;
  }
}

export async function getUserByEmail(email: string) {
  try {
    return await prisma.user.findUnique({
      where: { email },
    });
  } catch (error) {
    console.error("Error fetching user by email:", error);
    throw error;
  }
}

export async function updateUser(id: string, data: UpdateUserData) {
  try {
    return await prisma.user.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

export async function deleteUser(id: string) {
  try {
    // Soft delete - you might want to add a deletedAt field instead
    return await prisma.user.delete({
      where: { id },
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

