import { getServerSession } from "next-auth";
import { authOptions } from "./auth.config";
import { getUserByEmail } from "@/lib/db/users";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.user?.email) {
    return null;
  }

  return await getUserByEmail(session.user.email);
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

