import type { z } from 'zod';
import type {
  AuthRefreshTokenWithSessionSchema,
  AuthRefreshTokenEntitySchema,
  AuthSessionEntitySchema,
  AuthSessionWithUserSchema,
  AuthSessionSchema,
  CreateRefreshTokenInputSchema,
} from '../schemas';

export type AuthSession = z.infer<typeof AuthSessionSchema>;
export type AuthSessionEntity = z.infer<typeof AuthSessionEntitySchema>;
export type AuthRefreshTokenEntity = z.infer<typeof AuthRefreshTokenEntitySchema>;
export type CreateRefreshTokenInput = z.infer<typeof CreateRefreshTokenInputSchema>;
export type AuthSessionWithUser = z.infer<typeof AuthSessionWithUserSchema>;
export type AuthRefreshTokenWithSession = z.infer<typeof AuthRefreshTokenWithSessionSchema>;
