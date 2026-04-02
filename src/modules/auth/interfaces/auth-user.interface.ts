import type { z } from 'zod';
import type {
  CreateAuthUserInputSchema,
  UserAuthEntitySchema,
  UserRoleSchema,
  UserStatusSchema,
} from '../schemas';

export type UserAuthEntity = z.infer<typeof UserAuthEntitySchema>;
export type CreateAuthUserInput = z.infer<typeof CreateAuthUserInputSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type UserStatus = z.infer<typeof UserStatusSchema>;
