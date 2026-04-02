import { registerAs } from '@nestjs/config';
import { z } from 'zod';

/**
 * Auth configuration module using NestJS Config and Zod for validation.
 */
const ttlSchema = z.string().regex(/^\d+[smhd]$/, 'TTL must be a string like "15m", "1h", etc.');
const argon2ConfigSchema = z.coerce.number().int().positive();

/**
 * Validation schema for authentication configuration.
 */
export const AuthConfigSchema = z.object({
  AUTH_JWT_SECRET: z.string().min(32, 'AUTH_JWT_SECRET must be at least 32 characters long'),
  AUTH_JWT_ISSUER: z.string().min(1),
  AUTH_JWT_AUDIENCE: z.string().min(1),
  AUTH_ACCESS_TOKEN_TTL: ttlSchema,
  AUTH_REFRESH_TOKEN_TTL: ttlSchema,
  AUTH_VERIFY_EMAIL_TOKEN_TTL: ttlSchema,
  AUTH_RESET_PASSWORD_TOKEN_TTL: ttlSchema,
  AUTH_ARGON2_MEMORY_COST: argon2ConfigSchema.default(19456),
  AUTH_ARGON2_TIME_COST: argon2ConfigSchema.default(2),
  AUTH_ARGON2_PARALLELISM: argon2ConfigSchema.default(1),
  AUTH_ARGON2_HASH_LENGTH: argon2ConfigSchema.default(32),
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
