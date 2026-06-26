import type { UserRole, UserStatus } from "@prisma/client";

export const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: "超级管理员",
  ADMIN: "管理员",
  SALES: "销售",
  VIEWER: "只读"
};

export const userStatusLabels: Record<UserStatus, string> = {
  ACTIVE: "启用",
  DISABLED: "禁用"
};

export function canCreateCustomer(role: UserRole) {
  return role !== "VIEWER";
}

export function canManageUsers(role: UserRole) {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function canManageProducts(role: UserRole) {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function manageableRolesFor(actorRole: UserRole): UserRole[] {
  if (actorRole === "SUPER_ADMIN") {
    return ["SUPER_ADMIN", "ADMIN", "SALES", "VIEWER"];
  }

  if (actorRole === "ADMIN") {
    return ["SALES", "VIEWER"];
  }

  return [];
}

export function canManageTargetUser(actorRole: UserRole, targetRole: UserRole) {
  if (actorRole === "SUPER_ADMIN") {
    return true;
  }

  if (actorRole === "ADMIN") {
    return targetRole === "SALES" || targetRole === "VIEWER";
  }

  return false;
}

export function canAssignRole(actorRole: UserRole, role: UserRole) {
  return manageableRolesFor(actorRole).includes(role);
}
