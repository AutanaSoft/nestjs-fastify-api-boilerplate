/**
 * Global dictionary mapping domain events to string constants for the event emitter.
 *
 * It serves as the single source of truth for event names across the application,
 * ensuring type safety and preventing typos when dispatching or listening to internal events.
 */
export const EVENT_NAMES = {
  /** User domain events. */
  USER: {
    /** Fired when a new user is created. */
    CREATED: 'user.created',
    /** Fired when a user profile is updated. */
    UPDATED: 'user.updated',
    /** Fired when a user changes their password. */
    UPDATED_PASSWORD: 'user.updated.password',
    /** Fired when a user successfully verifies their email address. */
    VERIFIED_EMAIL: 'user.verified.email',
  },
} as const;
