import { InternalServerErrorException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import {
  AuthContractValidationError,
  AuthPersistenceNotFoundError,
  AuthPersistenceUnexpectedError,
  AuthPersistenceUniqueConstraintError,
} from '../errors';
import { AuthSignOutService } from './auth-sign-out.service';
import { RefreshTokenService } from './refresh-token.service';

describe('AuthSignOutService', () => {
  let service: AuthSignOutService;
  let refreshTokenService: jest.Mocked<Pick<RefreshTokenService, 'revokeSession'>>;
  let logger: jest.Mocked<Pick<PinoLogger, 'setContext' | 'error'>>;

  const currentUser = {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'user@example.com',
    userName: 'test-user',
    role: 'USER' as const,
    status: 'ACTIVE' as const,
    sessionId: '550e8400-e29b-41d4-a716-446655440003',
  };

  beforeEach(async () => {
    refreshTokenService = {
      revokeSession: jest.fn(),
    };

    logger = {
      setContext: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthSignOutService,
        { provide: RefreshTokenService, useValue: refreshTokenService },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<AuthSignOutService>(AuthSignOutService);
  });

  it('should revoke current session', async () => {
    refreshTokenService.revokeSession.mockResolvedValue(undefined);

    await expect(service.signOut(currentUser)).resolves.toBeUndefined();
    expect(refreshTokenService.revokeSession).toHaveBeenCalledWith(currentUser.sessionId);
  });

  it('should map contract validation errors to InternalServerErrorException', async () => {
    refreshTokenService.revokeSession.mockRejectedValue(
      new AuthContractValidationError('Contract validation failed'),
    );

    await expect(service.signOut(currentUser)).rejects.toThrow(InternalServerErrorException);
    expect(logger.error).toHaveBeenCalled();
  });

  it('should map persistence errors to InternalServerErrorException', async () => {
    refreshTokenService.revokeSession.mockRejectedValue(
      new AuthPersistenceUnexpectedError('Unexpected persistence error'),
    );

    await expect(service.signOut(currentUser)).rejects.toThrow(InternalServerErrorException);
    expect(logger.error).toHaveBeenCalled();
  });

  it('should map known not found persistence errors to InternalServerErrorException', async () => {
    refreshTokenService.revokeSession.mockRejectedValue(
      new AuthPersistenceNotFoundError('Not found'),
    );

    await expect(service.signOut(currentUser)).rejects.toThrow(InternalServerErrorException);
    expect(logger.error).toHaveBeenCalled();
  });

  it('should map known unique persistence errors to InternalServerErrorException', async () => {
    refreshTokenService.revokeSession.mockRejectedValue(
      new AuthPersistenceUniqueConstraintError('Unique constraint violation'),
    );

    await expect(service.signOut(currentUser)).rejects.toThrow(InternalServerErrorException);
    expect(logger.error).toHaveBeenCalled();
  });
});
