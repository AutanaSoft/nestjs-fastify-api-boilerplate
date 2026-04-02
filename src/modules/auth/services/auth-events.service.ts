import { EventEmitter2 } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';
import { EVENT_NAMES } from '@shared/constants/event-names.constants';
import type { EmailPayload, EmailTokenPayload } from '../interfaces';
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

  emitUserRegistered(payload: EmailTokenPayload): void {
    this._eventEmitter.emit(EVENT_NAMES.AUTH.USER_REGISTERED, new AuthUserRegisteredEvent(payload));
  }

  emitEmailVerified(payload: EmailPayload): void {
    this._eventEmitter.emit(EVENT_NAMES.AUTH.EMAIL_VERIFIED, new AuthEmailVerifiedEvent(payload));
  }

  emitPasswordResetRequested(payload: EmailTokenPayload): void {
    this._eventEmitter.emit(
      EVENT_NAMES.AUTH.PASSWORD_RESET_REQUESTED,
      new AuthPasswordResetRequestedEvent(payload),
    );
  }

  emitPasswordReset(payload: EmailPayload): void {
    this._eventEmitter.emit(EVENT_NAMES.AUTH.PASSWORD_RESET, new AuthPasswordResetEvent(payload));
  }
}
