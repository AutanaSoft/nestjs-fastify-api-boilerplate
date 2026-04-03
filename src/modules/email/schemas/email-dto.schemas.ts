import { z } from 'zod';

/**
 * Validation schema for email use-case input payload.
 */
export const EmailInputSchema = z.object({
  /**
   * Recipient email address.
   * @example 'test@example.com'
   */
  to: z.email().max(100, 'Email must contain fewer than 100 characters'),
  /**
   * Recipient name.
   * @example 'Juan J. Perez G.'
   */
  name: z
    .string({ message: 'Name is required' })
    .regex(
      /^[a-zA-Z0-9\s.\-_]+$/,
      'Name can only contain alphanumeric characters, spaces, dots, hyphens, and underscores',
    )
    .min(4, 'Name must contain at least 4 characters')
    .max(20, 'Name must contain fewer than 20 characters')
    .describe('Recipient name'),
});

/**
 * Validation schema for auth email actions that require a JWT token.
 */
export const EmailTokenInputSchema = EmailInputSchema.extend({
  token: z.string().min(1, 'JWT token is required'),
});
