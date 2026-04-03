import type { z } from 'zod';
import type { UserEventPayloadSchema } from '../schemas';

export type UserEventPayload = z.infer<typeof UserEventPayloadSchema>;
