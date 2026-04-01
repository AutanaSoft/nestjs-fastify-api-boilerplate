export interface EmailTokenPayload {
  email: string;
  userName: string;
  token: string;
}

export interface EmailPayload {
  email: string;
  userName: string;
}

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
