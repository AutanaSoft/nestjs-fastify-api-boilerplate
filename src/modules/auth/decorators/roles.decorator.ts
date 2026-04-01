import type { UserRole } from '@/modules/database/prisma/generated/enums';
import { SetMetadata } from '@nestjs/common';

export const ROLES_METADATA_KEY = 'roles';

/**
 * Defines required roles metadata for route handlers.
 */
export const Roles = (...roles: UserRole[]): ReturnType<typeof SetMetadata> => {
  return SetMetadata(ROLES_METADATA_KEY, roles);
};
