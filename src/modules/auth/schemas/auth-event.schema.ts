import { z } from 'zod';

/** Shared event payload with email and userName. */
export const AuthEventSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  userName: z.string().min(1),
});

/** Shared event payload with email, userName and token. */
export const AuthWithTokenEventSchema = AuthEventSchema.extend({
  token: z.string().min(1),
});
