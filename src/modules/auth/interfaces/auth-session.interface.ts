import type { z } from 'zod';
import type {
  AuthRefreshTokenEntitySchema,
  AuthSessionEntitySchema,
  AuthSessionSchema,
} from '../schemas';

export type AuthSession = z.infer<typeof AuthSessionSchema>;
export type AuthSessionEntity = z.infer<typeof AuthSessionEntitySchema>;
export type AuthRefreshTokenEntity = z.infer<typeof AuthRefreshTokenEntitySchema>;
