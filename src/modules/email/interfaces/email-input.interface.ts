import type { z } from 'zod';
import type { EmailRecipientSchema, EmailRecipientTokenSchema } from '../schemas';

/** Generic input contract for email sending use cases. */
export type EmailInput = z.infer<typeof EmailRecipientSchema>;

/** Input contract for email use cases that require a token. */
export type EmailTokenInput = z.infer<typeof EmailRecipientTokenSchema>;
