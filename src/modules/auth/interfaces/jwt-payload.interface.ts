import type { z } from 'zod';
import type {
  JwtAccessPayloadSchema,
  JwtCustomPayloadSchema,
  SignAccessTokenInputSchema,
  SignCustomTokenInputSchema,
  SignedAccessTokenSchema,
} from '../schemas';

export type JwtAccessPayload = z.infer<typeof JwtAccessPayloadSchema>;
export type JwtCustomPayload = z.infer<typeof JwtCustomPayloadSchema>;
export type SignAccessTokenInput = z.infer<typeof SignAccessTokenInputSchema>;
export type SignCustomTokenInput = z.infer<typeof SignCustomTokenInputSchema>;
export type SignedAccessToken = z.infer<typeof SignedAccessTokenSchema>;
