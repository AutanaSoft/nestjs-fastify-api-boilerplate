import { z } from 'zod';

/**
 * Query params accepted for offset-based pagination.
 * - `take`: items per page (default 25, max 100)
 * - `skip`: offset (default 0)
 */
export const PaginationQuerySchema = z.object({
  take: z.coerce.number().int().positive().max(100, 'take must be at most 100').default(25),
  skip: z.coerce.number().int().min(0).default(0),
});

/**
 * Pagination metadata returned alongside collection responses.
 * `total`: total number of items in the collection
 * `count`: number of items in the current page
 * `page`: current page number (1-based)
 * `totalPages`: total number of pages
 * `start`: index of the first item in the current page (0-based)
 * `end`: index of the last item in the current page (0-based)
 */
export const PaginationMetaSchema = z.object({
  total: z.number().int().min(0),
  count: z.number().int().min(0),
  page: z.number().int().positive(),
  totalPages: z.number().int().min(0),
  start: z.number().int().min(0),
  end: z.number().int().min(0),
});

/**
 * Helper to create a paginated response schema for any item schema.
 * Result shape: { data: T[], meta: PaginationMetaSchema, links?: PaginationLinksSchema }
 */
export const createPaginatedResponseSchema = <T>(items: z.ZodType<T>) =>
  z.object({
    data: z.array(items),
    meta: PaginationMetaSchema,
  });

/** Exported TypeScript inferred types */
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;
export type PaginatedResponse<T> = z.infer<ReturnType<typeof createPaginatedResponseSchema<T>>>;
