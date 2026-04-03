import type { z } from 'zod';
import type { GetUsersResponseSchema, OperationResponseSchema } from '../schemas';

export type GetUsersResponse = z.infer<typeof GetUsersResponseSchema>;
export type OperationResponse = z.infer<typeof OperationResponseSchema>;
