/**
 * Base error for auth persistence layer failures.
 */
export class AuthPersistenceError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/**
 * Raised when a persistence unique constraint is violated.
 */
export class AuthPersistenceUniqueConstraintError extends AuthPersistenceError {}

/**
 * Raised when a persistence not-found operation fails.
 */
export class AuthPersistenceNotFoundError extends AuthPersistenceError {}

/**
 * Raised when persisted data fails domain contract validation.
 */
export class AuthContractValidationError extends AuthPersistenceError {}

/**
 * Raised for unexpected persistence failures.
 */
export class AuthPersistenceUnexpectedError extends AuthPersistenceError {}
