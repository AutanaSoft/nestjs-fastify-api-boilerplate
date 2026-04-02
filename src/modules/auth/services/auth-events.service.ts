import { EventEmitter2 } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';
import { EVENT_NAMES } from '@shared/constants/event-names.constants';
import type { EmailPayload, EmailTokenPayload } from '../interfaces';
import { EmailPayloadSchema, EmailTokenPayloadSchema } from '../schemas';
import {
  AuthEmailVerifiedEvent,
  AuthPasswordResetEvent,
  AuthPasswordResetRequestedEvent,
  AuthUserRegisteredEvent,
} from '../events';

/**
 * Emits auth domain events for email workflows.
 */
@Injectable()
export class AuthEventsService {
  constructor(private readonly _eventEmitter: EventEmitter2) {}

  /**
   * Emits the auth user-registered event used by verification email listeners.
   *
   * @param payload Email payload with token contract.
   * @returns `void`.
   */
  emitUserRegistered(payload: EmailTokenPayload): void {
    const parsedPayload = EmailTokenPayloadSchema.parse(payload);

    this._eventEmitter.emit(
      EVENT_NAMES.AUTH.USER_REGISTERED,
      new AuthUserRegisteredEvent(parsedPayload),
    );
  }

  /**
   * Emits the auth email-verified event.
   *
   * @param payload Email payload contract.
   * @returns `void`.
   */
  emitEmailVerified(payload: EmailPayload): void {
    const parsedPayload = EmailPayloadSchema.parse(payload);

    this._eventEmitter.emit(
      EVENT_NAMES.AUTH.EMAIL_VERIFIED,
      new AuthEmailVerifiedEvent(parsedPayload),
    );
  }

  /**
   * Emits the auth password-reset-requested event.
   *
   * @param payload Email payload with token contract.
   * @returns `void`.
   */
  emitPasswordResetRequested(payload: EmailTokenPayload): void {
    const parsedPayload = EmailTokenPayloadSchema.parse(payload);

    this._eventEmitter.emit(
      EVENT_NAMES.AUTH.PASSWORD_RESET_REQUESTED,
      new AuthPasswordResetRequestedEvent(parsedPayload),
    );
  }

  /**
   * Emits the auth password-reset event.
   *
   * @param payload Email payload contract.
   * @returns `void`.
   */
  emitPasswordReset(payload: EmailPayload): void {
    const parsedPayload = EmailPayloadSchema.parse(payload);

    this._eventEmitter.emit(
      EVENT_NAMES.AUTH.PASSWORD_RESET,
      new AuthPasswordResetEvent(parsedPayload),
    );
  }
}
