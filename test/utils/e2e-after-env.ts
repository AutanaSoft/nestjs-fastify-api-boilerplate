import { closeAppInstance } from './test-client';

/**
 * Close the E2E app instance in the same worker process that created it.
 * This avoids leaked handles when Jest runs E2E specs in parallel workers.
 */
afterAll(async () => {
  await closeAppInstance();
});
