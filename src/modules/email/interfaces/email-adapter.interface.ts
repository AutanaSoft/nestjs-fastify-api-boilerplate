import type { z } from 'zod';
import type { EmailAdapterSchema } from '../schemas';

/** Email payload contract consumed by delivery adapters. */
export type EmailAdapter = z.infer<typeof EmailAdapterSchema>;
