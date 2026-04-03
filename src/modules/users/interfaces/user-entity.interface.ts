import type { z } from 'zod';
import type { UserEntitySchema, UserModelSchema } from '../schemas';

export type UserEntity = z.infer<typeof UserEntitySchema>;
export type UserModel = z.infer<typeof UserModelSchema>;
