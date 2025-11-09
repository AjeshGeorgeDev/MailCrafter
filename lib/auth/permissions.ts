/**
 * Permissions System
 * Role-Based Access Control (RBAC) for MailCrafter
 */

import type { Role } from "@prisma/client";

export type Permission =
  | "templates.create"
  | "templates.edit"
  | "templates.delete"
  | "templates.view"
  | "campaigns.create"
  | "campaigns.edit"
  | "campaigns.delete"
  | "campaigns.view"
  | "campaigns.send"
  | "smtp.create"
  | "smtp.edit"
  | "smtp.delete"
  | "smtp.view"
  | "analytics.view"
  | "team.invite"
  | "team.edit"
  | "team.remove"
  | "team.view"
  | "organization.edit"
  | "organization.delete"
  | "settings.edit"
  | "logs.view"
  | "bounces.view"
  | "bounces.manage"
  | "api_keys.create"
  | "api_keys.edit"
  | "api_keys.delete"
  | "api_keys.view";

/**
 * Permission mapping for each role
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: [
    // All permissions
    "templates.create",
    "templates.edit",
    "templates.delete",
    "templates.view",
    "campaigns.create",
    "campaigns.edit",
    "campaigns.delete",
    "campaigns.view",
    "campaigns.send",
    "smtp.create",
    "smtp.edit",
    "smtp.delete",
    "smtp.view",
    "analytics.view",
    "team.invite",
    "team.edit",
    "team.remove",
    "team.view",
    "organization.edit",
    "organization.delete",
    "settings.edit",
    "logs.view",
    "bounces.view",
    "bounces.manage",
    "api_keys.create",
    "api_keys.edit",
    "api_keys.delete",
    "api_keys.view",
  ],
  ADMIN: [
    "templates.create",
    "templates.edit",
    "templates.delete",
    "templates.view",
    "campaigns.create",
    "campaigns.edit",
    "campaigns.delete",
    "campaigns.view",
    "campaigns.send",
    "smtp.create",
    "smtp.edit",
    "smtp.delete",
    "smtp.view",
    "analytics.view",
    "team.invite",
    "team.edit",
    "team.remove",
    "team.view",
    "organization.edit",
    "settings.edit",
    "logs.view",
    "bounces.view",
    "bounces.manage",
    "api_keys.create",
    "api_keys.edit",
    "api_keys.delete",
    "api_keys.view",
  ],
  EDITOR: [
    "templates.create",
    "templates.edit",
    "templates.view",
    "campaigns.create",
    "campaigns.edit",
    "campaigns.view",
    "campaigns.send",
    "smtp.view",
    "analytics.view",
    "team.view",
    "logs.view",
    "bounces.view",
  ],
  VIEWER: [
    "templates.view",
    "campaigns.view",
    "smtp.view",
    "analytics.view",
    "team.view",
    "logs.view",
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if user can perform action (for server-side checks)
 */
export function canPerformAction(
  userRole: Role,
  permission: Permission
): boolean {
  return hasPermission(userRole, permission);
}

/**
 * Require permission (throws error if not allowed)
 */
export function requirePermission(
  userRole: Role,
  permission: Permission
): void {
  if (!hasPermission(userRole, permission)) {
    throw new Error(
      `Permission denied: ${permission} required. Current role: ${userRole}`
    );
  }
}

