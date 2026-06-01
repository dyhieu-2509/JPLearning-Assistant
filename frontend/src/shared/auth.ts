import type { UserResponse } from "./models";

const adminRoles = new Set(["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ROLE_SUPER_ADMIN"]);

export function isAdminRole(role?: string | null): boolean {
  return role ? adminRoles.has(role.toUpperCase()) : false;
}

export function homePathForUser(user?: UserResponse | null): string {
  return isAdminRole(user?.role) ? "/admin" : "/learner";
}
