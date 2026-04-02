import type { EmailPayload, EmailTokenPayload } from '../interfaces';

/**
 * Event emitted after user registration to request email verification.
 */
export class AuthUserRegisteredEvent {
  constructor(public readonly payload: EmailTokenPayload) {}
}

/**
 * Event emitted after user email verification.
 */
export class AuthEmailVerifiedEvent {
  constructor(public readonly payload: EmailPayload) {}
}

/**
 * Event emitted to request password reset email.
 */
export class AuthPasswordResetRequestedEvent {
  constructor(public readonly payload: EmailTokenPayload) {}
}

/**
 * Event emitted after a successful password reset.
 */
export class AuthPasswordResetEvent {
  constructor(public readonly payload: EmailPayload) {}
}
