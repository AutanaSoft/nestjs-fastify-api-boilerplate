import { createPaginatedResponseSchema } from '@/shared/schemas';
import { z } from 'zod';
import { UserModelSchema } from './user-entity.schema';

/** Output schema for users listing endpoint. */
export const GetUsersResponseSchema = createPaginatedResponseSchema(UserModelSchema);

/** Output schema for simple operation responses. */
export const OperationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
