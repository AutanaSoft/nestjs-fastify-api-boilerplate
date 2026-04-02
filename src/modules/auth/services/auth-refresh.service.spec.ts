import { InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import {
  AuthContractValidationError,
  AuthPersistenceNotFoundError,
  AuthPersistenceUnexpectedError,
  AuthPersistenceUniqueConstraintError,
} from '../errors';
import { AuthRefreshService } from './auth-refresh.service';
import { RefreshTokenService } from './refresh-token.service';

describe('AuthRefreshService', () => {
  let service: AuthRefreshService;
  let refreshTokenService: jest.Mocked<Pick<RefreshTokenService, 'rotateTokens'>>;
  let logger: jest.Mocked<Pick<PinoLogger, 'setContext' | 'error'>>;

  const refreshPayload = {
    refreshToken: 'valid-refresh-token',
  };

  const authSession = {
    createdAt: '2026-01-01T00:00:00.000Z',
    expiredAt: '2026-01-01T00:15:00.000Z',
    accessToken: 'next-access-token',
    refreshToken: 'next-refresh-token',
  };

  beforeEach(async () => {
    refreshTokenService = {
      rotateTokens: jest.fn(),
    };

    logger = {
      setContext: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthRefreshService,
        { provide: RefreshTokenService, useValue: refreshTokenService },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<AuthRefreshService>(AuthRefreshService);
  });

  it('should rotate tokens and return a new auth session', async () => {
    refreshTokenService.rotateTokens.mockResolvedValue(authSession);

    await expect(service.refresh(refreshPayload)).resolves.toEqual(authSession);
    expect(refreshTokenService.rotateTokens).toHaveBeenCalledWith(refreshPayload.refreshToken);
  });

  it('should preserve UnauthorizedException from token service', async () => {
    refreshTokenService.rotateTokens.mockRejectedValue(
      new UnauthorizedException('Invalid refresh token'),
    );

    await expect(service.refresh(refreshPayload)).rejects.toThrow(UnauthorizedException);
  });

  it('should map contract errors to InternalServerErrorException', async () => {
    refreshTokenService.rotateTokens.mockRejectedValue(
      new AuthContractValidationError('Contract validation failed'),
    );

    await expect(service.refresh(refreshPayload)).rejects.toThrow(InternalServerErrorException);
    expect(logger.error).toHaveBeenCalled();
  });

  it('should map persistence errors to InternalServerErrorException', async () => {
    refreshTokenService.rotateTokens.mockRejectedValue(
      new AuthPersistenceUnexpectedError('Unexpected persistence error'),
    );

    await expect(service.refresh(refreshPayload)).rejects.toThrow(InternalServerErrorException);
    expect(logger.error).toHaveBeenCalled();
  });

  it('should map known not found persistence errors to InternalServerErrorException', async () => {
    refreshTokenService.rotateTokens.mockRejectedValue(
      new AuthPersistenceNotFoundError('Not found'),
    );

    await expect(service.refresh(refreshPayload)).rejects.toThrow(InternalServerErrorException);
    expect(logger.error).toHaveBeenCalled();
  });

  it('should map known unique persistence errors to InternalServerErrorException', async () => {
    refreshTokenService.rotateTokens.mockRejectedValue(
      new AuthPersistenceUniqueConstraintError('Unique constraint violation'),
    );

    await expect(service.refresh(refreshPayload)).rejects.toThrow(InternalServerErrorException);
    expect(logger.error).toHaveBeenCalled();
  });
});
