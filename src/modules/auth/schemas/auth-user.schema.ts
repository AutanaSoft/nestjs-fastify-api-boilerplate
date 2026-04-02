import { UserRolesEnumSchema, UserStatusEnumSchema } from '@/shared/schemas';
import { z } from 'zod';

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  GUEST: 'GUEST',
} as const;

export const USER_STATUSES = {
  REGISTERED: 'REGISTERED',
  ACTIVE: 'ACTIVE',
  BANNED: 'BANNED',
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PAYMENT_FROZEN: 'PAYMENT_FROZEN',
  FROZEN: 'FROZEN',
} as const;

export const UserRoleSchema = UserRolesEnumSchema;
export const UserStatusSchema = UserStatusEnumSchema;

/** Persisted auth user entity shape. */
export const UserAuthEntitySchema = z.object({
  id: z.uuid(),
  userName: z.string(),
  email: z.email(),
  password: z.string(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  emailVerifiedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/** Authenticated user context shape attached to requests. */
export const CurrentUserSchema = UserAuthEntitySchema.omit({
  password: true,
  emailVerifiedAt: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  sessionId: z.uuid(),
});
