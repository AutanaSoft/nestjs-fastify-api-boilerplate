import type { z } from 'zod';
import type { CreateAuthUserInputSchema, UserAuthEntitySchema } from '../schemas';

export type UserAuthEntity = z.infer<typeof UserAuthEntitySchema>;
export type CreateAuthUserInput = z.infer<typeof CreateAuthUserInputSchema>;
