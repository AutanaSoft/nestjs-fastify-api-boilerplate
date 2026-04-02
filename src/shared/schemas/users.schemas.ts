import { z } from 'zod';

export const USER_ROLES = ['ADMIN', 'USER', 'GUEST'] as const;

export const USER_STATUSES = [
  'REGISTERED',
  'ACTIVE',
  'BANNED',
  'PENDING_PAYMENT',
  'PAYMENT_FROZEN',
  'FROZEN',
] as const;

/** User roles enum schema. */
export const UserRolesEnumSchema = z.enum(USER_ROLES);

/** User status enum schema. */
export const UserStatusEnumSchema = z.enum(USER_STATUSES);

/** Base rules for UUID identifiers. */
export const UuidSchema = z.uuid({ message: 'id must be a valid UUID' });

/** Base rules for user email addresses. Normalizes input (trim + lowercase). */
export const EmailSchema = z
  .email({ message: 'email format is invalid' })
  .min(6, 'email must be at least 6 characters long')
  .max(50, 'email must be at most 50 characters long')
  .transform((val) => val.trim().toLowerCase());

/** Base rules for usernames. Preprocess trims input then validates pattern and length. */
export const UserNameSchema = z
  .string({ message: 'userName is required' })
  .nonempty({ message: 'userName cannot be empty' })
  .regex(
    /^[a-zA-Z0-9._-]+$/,
    'userName can only contain letters, numbers, underscores, hyphens, and periods',
  )
  .min(4, 'userName must be at least 4 characters long')
  .max(20, 'userName must be at most 20 characters long')
  .transform((val) => val.trim());

/**
 * Base rules for passwords.
 * Consolidates multiple regex checks into a single pattern (lookaheads) for performance
 * and clearer error messaging. Keeps trimming behavior.
 */
export const PasswordSchema = z
  .string()
  .nonempty({ message: 'password cannot be empty' })
  .regex(
    /^(?=.{6,16}$)(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=_\s])[A-Za-z0-9!@#$%^&*()_+\-=_\s]+$/,
    'password must be 6-16 chars, include uppercase, lowercase, number and special character',
  )
  .transform((val) => val.trim());

/** Exported inferred types for convenience */
export type EmailType = z.infer<typeof EmailSchema>;
export type UserNameType = z.infer<typeof UserNameSchema>;
export type PasswordType = z.infer<typeof PasswordSchema>;
export type UUIDType = z.infer<typeof UuidSchema>;
export type UserRoleEnumType = z.infer<typeof UserRolesEnumSchema>;
export type UserStatusEnumType = z.infer<typeof UserStatusEnumSchema>;
