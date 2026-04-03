import type { z } from 'zod';
import type { EmailInputSchema, EmailTokenInputSchema } from '../schemas';

/** Generic input contract for email sending use cases. */
export type EmailInput = z.infer<typeof EmailInputSchema>;

/** Input contract for email use cases that require a token. */
export type EmailTokenInput = z.infer<typeof EmailTokenInputSchema>;
