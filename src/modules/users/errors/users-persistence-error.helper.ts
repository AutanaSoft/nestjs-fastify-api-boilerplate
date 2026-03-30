import { mapPrismaErrorToHttpException } from '@database/errors';
import { InternalServerErrorException } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';

type HandleUsersPersistenceErrorInput = {
  error: unknown;
  logger: PinoLogger;
  fallbackMessage: string;
  userId?: string;
};

/**
 * Maps persistence errors to HTTP exceptions for the users module.
 * Falls back to a generic internal error while preserving detailed logs.
 */
export function handleUsersPersistenceError({
  error,
  logger,
  fallbackMessage,
  userId,
}: HandleUsersPersistenceErrorInput): never {
  const mappedException = mapPrismaErrorToHttpException(error, {
    uniqueConstraintMessage: 'Email or userName is already in use',
    notFoundMessage: userId ? `User ${userId} not found` : 'User not found',
  });

  if (mappedException) {
    throw mappedException;
  }

  logger.error({ error, userId }, fallbackMessage);
  throw new InternalServerErrorException('Internal server error');
}
