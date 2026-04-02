import { ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';
import {
  UsersContractValidationError,
  UsersPersistenceNotFoundError,
  UsersPersistenceUnexpectedError,
  UsersPersistenceUniqueConstraintError,
} from './users-persistence.errors';

type HandleUsersPersistenceErrorInput = {
  error: unknown;
  logger: PinoLogger;
  fallbackMessage: string;
  userId?: string;
};

/**
 * Maps users persistence-layer errors to HTTP exceptions.
 * Falls back to a generic internal error while preserving detailed logs.
 */
export function handleUsersPersistenceError({
  error,
  logger,
  fallbackMessage,
  userId,
}: HandleUsersPersistenceErrorInput): never {
  if (error instanceof UsersPersistenceUniqueConstraintError) {
    throw new ConflictException(error.message);
  }

  if (error instanceof UsersPersistenceNotFoundError) {
    throw new NotFoundException(userId ? `User ${userId} not found` : error.message);
  }

  if (
    error instanceof UsersContractValidationError ||
    error instanceof UsersPersistenceUnexpectedError
  ) {
    logger.error({ error, userId }, fallbackMessage);
    throw new InternalServerErrorException('Internal server error');
  }

  logger.error({ error, userId }, fallbackMessage);
  throw new InternalServerErrorException('Internal server error');
}
