import { mapPrismaErrorToHttpException } from '@database/errors';
import { InternalServerErrorException } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';

type HandleAuthPersistenceErrorInput = {
  error: unknown;
  logger: PinoLogger;
  fallbackMessage: string;
  userId?: string;
};

/**
 * Maps persistence errors into HTTP errors for auth workflows.
 */
export function handleAuthPersistenceError({
  error,
  logger,
  fallbackMessage,
  userId,
}: HandleAuthPersistenceErrorInput): never {
  const mappedException = mapPrismaErrorToHttpException(error, {
    uniqueConstraintMessage: 'Email or userName is already in use',
    notFoundMessage: userId ? `User ${userId} not found` : 'Resource not found',
  });

  if (mappedException) {
    throw mappedException;
  }

  logger.error({ error, userId }, fallbackMessage);
  throw new InternalServerErrorException('Internal server error');
}
