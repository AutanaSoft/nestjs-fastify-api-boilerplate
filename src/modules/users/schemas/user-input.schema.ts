import {
  EmailSchema,
  PaginationQuerySchema,
  PasswordSchema,
  UserNameSchema,
  UserRolesEnumSchema,
  UserStatusEnumSchema,
  UuidSchema,
} from '@/shared/schemas';
import { z } from 'zod';

/** Input schema to create a user from external requests. */
export const CreateUserInputSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  userName: UserNameSchema,
  role: UserRolesEnumSchema.optional(),
  status: UserStatusEnumSchema.optional(),
});

/**
 * Internal persistence data schema to create a user.
 *
 * Password is expected to be already hashed by the service layer.
 */
export const CreateUserDataSchema = CreateUserInputSchema.extend({
  password: z.string().min(1),
});

/** Input schema to update a user profile. */
export const UpdateUserInputSchema = z
  .object({
    userName: UserNameSchema.optional(),
    role: UserRolesEnumSchema.optional(),
    status: UserStatusEnumSchema.optional(),
  })
  .refine((payload) => Object.values(payload).some((value) => value !== undefined), {
    message: 'at least one field must be provided for update',
  });

/** Input schema to update user password. */
export const UpdatePasswordInputSchema = z
  .object({
    current: PasswordSchema,
    new: PasswordSchema,
    confirm: PasswordSchema,
  })
  .refine((payload) => payload.new === payload.confirm, {
    message: 'new and confirm must match',
    path: ['confirm'],
  });

/** Input schema to find a user by id. */
export const GetUserByIdInputSchema = z.object({
  id: UuidSchema,
});

/** Input schema to find a user by email. */
export const GetUserByEmailInputSchema = z.object({
  email: EmailSchema,
});

const VerifiedQuerySchema = z.union([
  z.boolean(),
  z.enum(['true', 'false']).transform((value) => value === 'true'),
]);

/** Query schema to list users with pagination and filters. */
export const GetUsersQuerySchema = PaginationQuerySchema.extend({
  role: UserRolesEnumSchema.optional(),
  status: UserStatusEnumSchema.optional(),
  verified: VerifiedQuerySchema.optional(),
  email: EmailSchema.optional(),
  userName: UserNameSchema.optional(),
});
