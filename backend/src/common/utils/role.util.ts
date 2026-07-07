import { UserRole } from '../enums/user-role.enum';

export function isModeratorOrAdmin(role?: string | null) {
  return role === UserRole.MODERATOR || role === UserRole.SUPER_ADMIN;
}

export function isSuperAdmin(role?: string | null) {
  return role === UserRole.SUPER_ADMIN;
}
