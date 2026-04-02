import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../interfaces';

export const ROLES_METADATA_KEY = 'roles';

/**
 * Defines required roles metadata for route handlers.
 */
export const Roles = (...roles: UserRole[]): ReturnType<typeof SetMetadata> => {
  return SetMetadata(ROLES_METADATA_KEY, roles);
};
