import type { UserEventPayload } from '../interfaces';

/**
 * Event emitted when a user is created.
 */
export class UserCreatedEvent {
  constructor(public readonly payload: UserEventPayload) {}
}

/**
 * Event emitted when a user password is updated.
 */
export class UserPasswordUpdatedEvent {
  constructor(public readonly payload: UserEventPayload) {}
}
