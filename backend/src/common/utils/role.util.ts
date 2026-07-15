import { UserRole } from '../enums/user-role.enum';

export function isModerator(user?: {
  userId?: string;
  role?: UserRole | string;
}): boolean {
  if (!user) return false;
  return (
    user?.role === UserRole.MODERATOR || user?.role === UserRole.SUPER_ADMIN
  );
}

export function isSuperAdmin(role?: string | null) {
  return role === UserRole.SUPER_ADMIN;
}
