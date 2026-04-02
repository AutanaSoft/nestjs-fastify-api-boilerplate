import { IsoDateTimeFromDateSchema, UuidSchema } from '@/shared/schemas';
import { z } from 'zod';

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
