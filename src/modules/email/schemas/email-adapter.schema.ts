import { z } from 'zod';

/**
 * Schema that validates the normalized payload consumed by delivery adapters.
 */
export const EmailAdapterSchema = z.object({
  /**
   * Recipient email address.
   */
  to: z.email(),
  /**
   * Email subject line.
   */
  subject: z.string(),
  /**
   * Rendered HTML content for the email body.
   */
  html: z.string(),
});
