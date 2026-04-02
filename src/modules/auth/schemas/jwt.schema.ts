import { z } from 'zod';
import { TokenType } from '../enum';
import { AuthTokenPurposeSchema } from './auth-token-purpose.schema';
import { CurrentUserSchema } from './auth-user.schema';

/** Decoded access token payload shape. */
export const JwtAccessPayloadSchema = CurrentUserSchema.omit({
  id: true,
}).extend({
  sub: z.uuid(),
  type: z.literal(TokenType.ACCESS),
});

/** Decoded custom token payload shape. */
export const JwtCustomPayloadSchema = z.object({
  sub: z.uuid(),
  email: z.email(),
  userName: z.string().min(1),
  purpose: AuthTokenPurposeSchema,
  type: z.literal('custom'),
});

/** Input payload used to sign access tokens. */
export const SignAccessTokenInputSchema = JwtAccessPayloadSchema.omit({ type: true });

/** Input payload used to sign custom-purpose tokens. */
export const SignCustomTokenInputSchema = z.object({
  userId: z.uuid(),
  email: z.email(),
  userName: z.string().min(1),
  purpose: AuthTokenPurposeSchema,
});

/** Internal signed access token metadata. */
export const SignedAccessTokenSchema = z.object({
  token: z.string().min(1),
  createdAt: z.date(),
  expiresAt: z.date(),
});
