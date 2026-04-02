/** Base error for users persistence layer failures. */
export class UsersPersistenceError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** Raised when a persistence unique constraint is violated. */
export class UsersPersistenceUniqueConstraintError extends UsersPersistenceError {}

/** Raised when a persistence not-found operation fails. */
export class UsersPersistenceNotFoundError extends UsersPersistenceError {}

/** Raised when persisted data fails users contract validation. */
export class UsersContractValidationError extends UsersPersistenceError {}

/** Raised for unexpected persistence failures. */
export class UsersPersistenceUnexpectedError extends UsersPersistenceError {}
