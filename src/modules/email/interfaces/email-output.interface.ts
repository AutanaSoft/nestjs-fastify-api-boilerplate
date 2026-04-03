import type { z } from 'zod';
import type { EmailResponseSchema } from '../schemas';

/** Output contract for email delivery responses. */
export type EmailResponse = z.infer<typeof EmailResponseSchema>;
