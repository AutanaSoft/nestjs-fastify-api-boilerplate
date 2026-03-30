import { ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { mapPrismaErrorToHttpException } from '@database/errors';
import type { PinoLogger } from 'nestjs-pino';
import { handleUsersPersistenceError } from './users-persistence-error.helper';

jest.mock('@database/errors', () => ({
  mapPrismaErrorToHttpException: jest.fn(),
}));

describe('handleUsersPersistenceError', () => {
  const mapPrismaErrorToHttpExceptionMock = mapPrismaErrorToHttpException as jest.MockedFunction<
    typeof mapPrismaErrorToHttpException
  >;

  let logger: jest.Mocked<Pick<PinoLogger, 'error'>>;

  beforeEach(() => {
    logger = {
      error: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw mapped conflict exception when mapper returns one', () => {
    const conflict = new ConflictException('duplicated');
    mapPrismaErrorToHttpExceptionMock.mockReturnValue(conflict);

    expect(() =>
      handleUsersPersistenceError({
        error: new Error('p2002'),
        logger: logger as PinoLogger,
        fallbackMessage: 'Could not create user',
      }),
    ).toThrow(ConflictException);
  });

  it('should throw mapped not found exception when mapper returns one', () => {
    const notFound = new NotFoundException('missing');
    mapPrismaErrorToHttpExceptionMock.mockReturnValue(notFound);

    expect(() =>
      handleUsersPersistenceError({
        error: new Error('p2025'),
        logger: logger as PinoLogger,
        fallbackMessage: 'Could not update user',
        userId: '550e8400-e29b-41d4-a716-446655440000',
      }),
    ).toThrow(NotFoundException);
  });

  it('should log and throw InternalServerErrorException when mapper returns null', () => {
    const rawError = new Error('unexpected');
    mapPrismaErrorToHttpExceptionMock.mockReturnValue(null);

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
