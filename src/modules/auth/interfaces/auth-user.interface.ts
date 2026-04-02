import type { z } from 'zod';
import type {
  CreateAuthUserDataSchema,
  UserAuthEntitySchema,
  UserRoleSchema,
  UserStatusSchema,
} from '../schemas';

export type UserAuthEntity = z.infer<typeof UserAuthEntitySchema>;
export type CreateAuthUserData = z.infer<typeof CreateAuthUserDataSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type UserStatus = z.infer<typeof UserStatusSchema>;
