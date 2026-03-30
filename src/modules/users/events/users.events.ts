import type { UserEntity } from '../schemas';

/**
 * Event emitted when a user is created.
 */
export class UserCreatedEvent {
  constructor(public readonly payload: UserEntity) {}
}

/**
 * Event emitted when a user is updated.
 */
export class UserPasswordUpdatedEvent {
  constructor(public readonly payload: UserEntity) {}
}

/**
 * Event emitted when a user is updated.
 */
export class UserEmailVerifiedEvent {
  constructor(public readonly payload: UserEntity) {}
}
