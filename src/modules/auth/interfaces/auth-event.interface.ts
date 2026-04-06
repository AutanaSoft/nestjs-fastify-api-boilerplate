import type { z } from 'zod';
import type { AuthEventSchema, AuthWithTokenEventSchema } from '../schemas';

export type AuthEventPayload = z.infer<typeof AuthEventSchema>;
export type AuthWithTokenEventPayload = z.infer<typeof AuthWithTokenEventSchema>;
