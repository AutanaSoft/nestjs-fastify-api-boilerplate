import { EmailSchema, UserNameSchema } from '@/shared/schemas';
import { z } from 'zod';

/**
 * Schema that validates the recipient data for internal email delivery use cases.
 */
export const EmailRecipientSchema = z.object({
  /**
   * Recipient email address.
   */
  to: EmailSchema,
  /**
   * Recipient display name used by templates.
   */
  name: UserNameSchema,
});

/**
 * Schema that validates recipient data when the email flow requires a JWT token.
 */
export const EmailRecipientTokenSchema = EmailRecipientSchema.extend({
  /**
   * JWT token required by verification and password recovery flows.
   */
  token: z.string().min(1, 'JWT token is required'),
});
