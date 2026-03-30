import { z } from 'zod';

/**
 * Preprocesses Date objects into ISO strings before validating with zod's built-in ISO date/time schemas.
 */
export const IsoDateTimeFromDateSchema = z.preprocess(
  (value) => (value instanceof Date ? value.toISOString() : value),
  z.iso.datetime(),
);

/**
 * Same as above but allows null values (useful for nullable database date fields).
 */
export const NullableIsoDateTimeFromDateSchema = z.preprocess(
  (value) => (value instanceof Date ? value.toISOString() : value),
  z.iso.datetime().nullable(),
);
