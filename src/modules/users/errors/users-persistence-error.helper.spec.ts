import { ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';
import {
  UsersContractValidationError,
  UsersPersistenceNotFoundError,
  UsersPersistenceUnexpectedError,
  UsersPersistenceUniqueConstraintError,
} from './users-persistence.errors';
import { handleUsersPersistenceError } from './users-persistence-error.helper';

describe('handleUsersPersistenceError', () => {
  let logger: jest.Mocked<Pick<PinoLogger, 'error'>>;

  beforeEach(() => {
    logger = {
      error: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ConflictException for unique constraint errors', () => {
    expect(() =>
      handleUsersPersistenceError({
        error: new UsersPersistenceUniqueConstraintError('Email or userName is already in use'),
        logger: logger as PinoLogger,
        fallbackMessage: 'Could not create user',
      }),
    ).toThrow(ConflictException);
  });

  it('should throw NotFoundException for persistence not found errors', () => {
    expect(() =>
      handleUsersPersistenceError({
        error: new UsersPersistenceNotFoundError('User not found'),
        logger: logger as PinoLogger,
        fallbackMessage: 'Could not update user',
        userId: '550e8400-e29b-41d4-a716-446655440000',
      }),
    ).toThrow(NotFoundException);
  });

  it('should log and throw InternalServerErrorException for contract validation errors', () => {
    const rawError = new UsersContractValidationError('invalid contract');

    expect(() =>
      handleUsersPersistenceError({
        error: rawError,
        logger: logger as PinoLogger,
        fallbackMessage: 'Could not list users',
      }),
    ).toThrow(InternalServerErrorException);

    expect(logger.error).toHaveBeenCalledWith(
      { error: rawError, userId: undefined },
      'Could not list users',
    );
  });

  it('should log and throw InternalServerErrorException for unexpected persistence errors', () => {
    const rawError = new UsersPersistenceUnexpectedError('unexpected');

    expect(() =>
      handleUsersPersistenceError({
        error: rawError,
        logger: logger as PinoLogger,
        fallbackMessage: 'Could not list users',
      }),
    ).toThrow(InternalServerErrorException);

    expect(logger.error).toHaveBeenCalledWith(
      { error: rawError, userId: undefined },
      'Could not list users',
    );
  });

  it('should log and throw InternalServerErrorException for unknown errors', () => {
    const rawError = new Error('unknown');

    expect(() =>
      handleUsersPersistenceError({
        error: rawError,
        logger: logger as PinoLogger,
        fallbackMessage: 'Could not list users',
      }),
    ).toThrow(InternalServerErrorException);

    expect(logger.error).toHaveBeenCalledWith(
      { error: rawError, userId: undefined },
      'Could not list users',
    );
  });
});
