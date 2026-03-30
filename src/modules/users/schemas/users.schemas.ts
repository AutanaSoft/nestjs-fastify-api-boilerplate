import { UserRole, UserStatus } from '@/modules/database/prisma/generated/enums';
import {
  createPaginatedResponseSchema,
  EmailSchema,
  IsoDateTimeFromDateSchema,
  NullableIsoDateTimeFromDateSchema,
  PaginationQuerySchema,
  PasswordSchema,
  UserNameSchema,
  UserRolesEnumSchema,
  UserStatusEnumSchema,
  UuidSchema,
} from '@/shared/schemas';
import { z } from 'zod';

/** User entity schema. */
export const UserEntitySchema = z.object({
  id: z.uuid(),
  userName: z.string(),
  email: z.email(),
  password: z.string(),
  role: z.enum(UserRole),
  status: z.enum(UserStatus),
  emailVerifiedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * User model schema for API responses.
 *
 * This schema accepts internal `Date` values and serializes them as ISO datetime strings.
 * It also omits the password field from external payloads.
 */
export const UserModelSchema = UserEntitySchema.omit({ password: true }).extend({
  emailVerifiedAt: NullableIsoDateTimeFromDateSchema,
  createdAt: IsoDateTimeFromDateSchema,
  updatedAt: IsoDateTimeFromDateSchema,
});

/** Create user schema. */
export const CreateUserInputSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  userName: UserNameSchema,
  role: UserRolesEnumSchema.optional(),
  status: UserStatusEnumSchema.optional(),
});

/** Update user schema. */
export const UpdateUserInputSchema = z
  .object({
    userName: UserNameSchema.optional(),
    role: UserRolesEnumSchema.optional(),
    status: UserStatusEnumSchema.optional(),
  })
  .refine((payload) => Object.values(payload).some((value) => value !== undefined), {
    message: 'at least one field must be provided for update',
  });

/** Update password schema. */
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

/** Find user by id schema. */
export const GetUserByIdInputSchema = z.object({
  id: UuidSchema,
});

/** Find user by email schema. */
export const GetUserByEmailInputSchema = z.object({
  email: EmailSchema,
});

/** List users query schema. */
const VerifiedQuerySchema = z.union([
  z.boolean(),
  z.enum(['true', 'false']).transform((value) => value === 'true'),
]);

export const GetUsersQuerySchema = PaginationQuerySchema.extend({
  role: UserRolesEnumSchema.optional(),
  status: UserStatusEnumSchema.optional(),
  verified: VerifiedQuerySchema.optional(),
  email: EmailSchema.optional(),
  userName: UserNameSchema.optional(),
});

/** List users response schema. */
export const GetUsersResponseSchema = createPaginatedResponseSchema(UserModelSchema);

/** Simple operation response schema. */
export const OperationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type UserEntity = z.infer<typeof UserEntitySchema>;
export type UserModel = z.infer<typeof UserModelSchema>;
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;
export type UpdatePasswordInput = z.infer<typeof UpdatePasswordInputSchema>;
export type GetUserByIdInput = z.infer<typeof GetUserByIdInputSchema>;
export type GetUserByEmailInput = z.infer<typeof GetUserByEmailInputSchema>;
export type GetUsersInput = z.infer<typeof GetUsersQuerySchema>;
export type GetUsersResponse = z.infer<typeof GetUsersResponseSchema>;
export type OperationResponse = z.infer<typeof OperationResponseSchema>;
