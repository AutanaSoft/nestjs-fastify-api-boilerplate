import type { Prisma } from '@/modules/database/prisma/generated/client';
import { ConflictException, type HttpException, NotFoundException } from '@nestjs/common';

const PRISMA_UNIQUE_CONSTRAINT = 'P2002';
const PRISMA_NOT_FOUND = 'P2025';

/**
 * Type guard for known Prisma request errors.
 *
 * @param error Unknown error to evaluate.
 * @returns `true` when the error matches `PrismaClientKnownRequestError`.
 */
export const isKnownPrismaError = (
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError => {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
  );
};

interface PrismaErrorMappingOptions {
  uniqueConstraintMessage: string;
  notFoundMessage: string;
}

/**
 * Maps known Prisma errors into NestJS HTTP exceptions.
 *
 * @param error Unknown error to map.
 * @param options Domain-specific messages for mapped exceptions.
 * @returns A mapped `HttpException` when known, otherwise `null`.
 */
export const mapPrismaErrorToHttpException = (
  error: unknown,
  options: PrismaErrorMappingOptions,
): HttpException | null => {
  if (!isKnownPrismaError(error)) {
    return null;
  }

  if (error.code === PRISMA_UNIQUE_CONSTRAINT) {
    return new ConflictException(options.uniqueConstraintMessage);
  }

  if (error.code === PRISMA_NOT_FOUND) {
    return new NotFoundException(options.notFoundMessage);
  }

  return null;
};
