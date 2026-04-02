import type { z } from 'zod';
import type { AuthTokenPurposeSchema } from '../schemas';

export type AuthTokenPurpose = z.infer<typeof AuthTokenPurposeSchema>;
