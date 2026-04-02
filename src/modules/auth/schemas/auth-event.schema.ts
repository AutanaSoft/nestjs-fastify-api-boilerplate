import { z } from 'zod';

/** Shared event payload with email and userName. */
export const EmailPayloadSchema = z.object({
  email: z.email(),
  userName: z.string().min(1),
});

/** Shared event payload with email, userName and token. */
export const EmailTokenPayloadSchema = EmailPayloadSchema.extend({
  token: z.string().min(1),
});
