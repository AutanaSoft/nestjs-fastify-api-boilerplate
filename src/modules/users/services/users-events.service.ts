import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENT_NAMES } from '@shared/constants/event-names.constants';
import { PinoLogger } from 'nestjs-pino';
import { UserCreatedEvent, UserPasswordUpdatedEvent, UserUpdatedEvent } from '../events';
import type { UserEntity } from '../interfaces';
import { UserEventPayloadSchema } from '../schemas';

/**
 * Emits users domain events across the system.
 *
 * Centralizing the EventEmitter here avoids polluting other domain services
 * with event orchestration logic, adhering to the Single Responsibility Principle.
 */
@Injectable()
export class UsersEventsService {
  constructor(
    private readonly _eventEmitter: EventEmitter2,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(UsersEventsService.name);
  }

  /**
   * Emits a domain event signaling the successful creation of a new user.
   *
   * @param {UserEntity} user The newly created user payload.
   */
  emitUserCreated(user: UserEntity): void {
    const payload = UserEventPayloadSchema.parse(user);

    this._eventEmitter.emit(EVENT_NAMES.USER.CREATED, new UserCreatedEvent(payload));
    this._logger.debug({ userId: payload.id }, 'Emitted USER.CREATED');
  }

  /**
   * Emits a domain event signaling that a user profile has been updated.
   *
   * @param {UserEntity} user The updated user payload.
   */
  emitUserUpdated(user: UserEntity): void {
    const payload = UserEventPayloadSchema.parse(user);

    this._eventEmitter.emit(EVENT_NAMES.USER.UPDATED, new UserUpdatedEvent(payload));
    this._logger.debug({ userId: payload.id }, 'Emitted USER.UPDATED');
  }

  /**
   * Emits a domain event signaling that a user's password has been updated.
   *
   * @param {UserEntity} user The updated user payload.
   */
  emitUserPasswordUpdated(user: UserEntity): void {
    const payload = UserEventPayloadSchema.parse(user);

    this._eventEmitter.emit(
      EVENT_NAMES.USER.UPDATED_PASSWORD,
      new UserPasswordUpdatedEvent(payload),
    );
    this._logger.debug({ userId: payload.id }, 'Emitted USER.UPDATED_PASSWORD');
  }
}
