import type { z } from 'zod';
import type { CurrentUserSchema } from '../schemas';

export type CurrentUser = z.infer<typeof CurrentUserSchema>;
