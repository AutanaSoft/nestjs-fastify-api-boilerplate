import type { z } from 'zod';
import type {
  CreateUserDataSchema,
  CreateUserInputSchema,
  GetUserByEmailInputSchema,
  GetUserByIdInputSchema,
  GetUsersQuerySchema,
  UpdatePasswordInputSchema,
  UpdateUserInputSchema,
} from '../schemas';

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;
export type CreateUserData = z.infer<typeof CreateUserDataSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;
export type UpdatePasswordInput = z.infer<typeof UpdatePasswordInputSchema>;
export type GetUserByIdInput = z.infer<typeof GetUserByIdInputSchema>;
export type GetUserByEmailInput = z.infer<typeof GetUserByEmailInputSchema>;
export type GetUsersInput = z.infer<typeof GetUsersQuerySchema>;
