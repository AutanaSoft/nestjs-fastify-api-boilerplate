import type { UserEntity } from '../interfaces';

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
