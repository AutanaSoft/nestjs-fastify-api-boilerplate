import { EmailSchema, UserNameSchema, UuidSchema } from '@/shared/schemas';
import { z } from 'zod';

/** Minimal payload contract for users domain events consumed across modules. */
export const UserEventPayloadSchema = z.object({
  id: UuidSchema,
  email: EmailSchema,
  userName: UserNameSchema,
});
