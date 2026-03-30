import { z } from 'zod';

/**
 * Validation schema for adapter-level email payloads.
 */
export const EmailAdapterSchema = z.object({
  /**
   * Recipient email address.
   * @example 'test@example.com'
   */
  to: z.email(),
  /**
   * Email subject.
   * @example 'Email verification'
   */
  subject: z.string(),
  /**
   * Email HTML content.
   * @example '<h1>Email verification</h1>'
   */
  html: z.string(),
});

/**
 * Types inferred from schema definitions.
 */
export type EmailAdapter = z.infer<typeof EmailAdapterSchema>;
