import {
  EmailSchema,
  IsoDateTimeFromDateSchema,
  NullableIsoDateTimeFromDateSchema,
  UserNameSchema,
  UserRolesEnumSchema,
  UserStatusEnumSchema,
  UuidSchema,
} from '@/shared/schemas';
import { z } from 'zod';

/** User entity schema used at persistence and domain boundaries. */
export const UserEntitySchema = z.object({
  id: UuidSchema,
  userName: UserNameSchema,
  email: EmailSchema,
  password: z.string().min(1),
  role: UserRolesEnumSchema,
  status: UserStatusEnumSchema,
  emailVerifiedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * User model schema for external API responses.
 *
 * Accepts internal `Date` values and serializes them as ISO datetime strings,
 * while omitting sensitive fields.
 */
export const UserModelSchema = UserEntitySchema.omit({ password: true }).extend({
  emailVerifiedAt: NullableIsoDateTimeFromDateSchema,
  createdAt: IsoDateTimeFromDateSchema,
  updatedAt: IsoDateTimeFromDateSchema,
});
