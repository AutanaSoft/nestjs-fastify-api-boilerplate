import type { z } from 'zod';
import type { EmailPayloadSchema, EmailTokenPayloadSchema } from '../schemas';

export type EmailPayload = z.infer<typeof EmailPayloadSchema>;
export type EmailTokenPayload = z.infer<typeof EmailTokenPayloadSchema>;
