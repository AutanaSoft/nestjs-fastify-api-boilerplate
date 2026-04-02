import { IsoDateTimeFromDateSchema, UuidSchema } from '@/shared/schemas';
import { z } from 'zod';
import { UserAuthEntitySchema } from './auth-user.schema';

/** Public auth session response shape. */
export const AuthSessionSchema = z.object({
  createdAt: IsoDateTimeFromDateSchema,
  expiredAt: IsoDateTimeFromDateSchema,
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

/** Persisted auth session entity shape. */
export const AuthSessionEntitySchema = z.object({
  id: UuidSchema,
  userId: UuidSchema,
  revokedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/** Persisted auth refresh token entity shape. */
export const AuthRefreshTokenEntitySchema = z.object({
  id: UuidSchema,
  sessionId: UuidSchema,
  tokenHash: z.string().min(1),
  expiresAt: z.date(),
  revokedAt: z.date().nullable(),
  usedAt: z.date().nullable(),
  rotatedFromId: UuidSchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/** Input schema for creating a persisted refresh token. */
export const CreateRefreshTokenInputSchema = z.object({
  sessionId: UuidSchema,
  tokenHash: z.string().min(1),
  expiresAt: z.date(),
  rotatedFromId: UuidSchema.optional(),
});

/** Session entity enriched with its owning user. */
export const AuthSessionWithUserSchema = AuthSessionEntitySchema.extend({
  user: UserAuthEntitySchema,
});

/** Refresh token entity enriched with session and user. */
export const AuthRefreshTokenWithSessionSchema = AuthRefreshTokenEntitySchema.extend({
  session: AuthSessionWithUserSchema,
});
