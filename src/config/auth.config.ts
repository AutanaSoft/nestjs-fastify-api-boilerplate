import { registerAs } from '@nestjs/config';
import { z } from 'zod';

/**
 * Validation schema for authentication configuration.
 */
export const AuthConfigSchema = z.object({
  AUTH_JWT_SECRET: z.string().min(32, 'AUTH_JWT_SECRET must be at least 32 characters long'),
  AUTH_JWT_ISSUER: z.string().min(1),
  AUTH_JWT_AUDIENCE: z.string().min(1),
  AUTH_ACCESS_TOKEN_TTL: z.string().regex(/^\d+[smhd]$/),
  AUTH_REFRESH_TOKEN_TTL: z.string().regex(/^\d+[smhd]$/),
  AUTH_VERIFY_EMAIL_TOKEN_TTL: z.string().regex(/^\d+[smhd]$/),
  AUTH_RESET_PASSWORD_TOKEN_TTL: z.string().regex(/^\d+[smhd]$/),
  AUTH_ARGON2_MEMORY_COST: z.coerce.number().int().positive().default(19456),
  AUTH_ARGON2_TIME_COST: z.coerce.number().int().positive().default(2),
  AUTH_ARGON2_PARALLELISM: z.coerce.number().int().positive().default(1),
  AUTH_ARGON2_HASH_LENGTH: z.coerce.number().int().positive().default(32),
});

/**
 * Inferred auth configuration type.
 */
export type AuthConfig = z.infer<typeof AuthConfigSchema>;

/**
 * Parses and validates auth configuration.
 */
export const authConfigFactory = (): AuthConfig => {
  return AuthConfigSchema.parse(process.env);
};

/**
 * Registers auth config under authConfig namespace.
 */
export default registerAs<AuthConfig>('authConfig', authConfigFactory);
