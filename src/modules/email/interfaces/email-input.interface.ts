import type { z } from 'zod';
import type { EmailRecipientSchema, EmailRecipientTokenSchema } from '../schemas';

/** Recipient contract for email sending use cases. */
export type EmailRecipient = z.infer<typeof EmailRecipientSchema>;

/** Recipient contract for email use cases that require a token. */
export type EmailRecipientToken = z.infer<typeof EmailRecipientTokenSchema>;
