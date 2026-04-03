import {
  createPaginatedResponseSchema,
  IsoDateTimeFromDateSchema,
  NullableIsoDateTimeFromDateSchema,
} from '@/shared/schemas';
import { z } from 'zod';
import { UserEntitySchema } from './user-entity.schema';

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

/** Output schema for users listing endpoint. */
export const GetUsersResponseSchema = createPaginatedResponseSchema(UserModelSchema);

/** Output schema for simple operation responses. */
export const OperationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
