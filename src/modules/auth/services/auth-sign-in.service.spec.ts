import {
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PasswordHashService } from '@modules/security/services';
import { PinoLogger } from 'nestjs-pino';
import {
  AuthContractValidationError,
  AuthPersistenceNotFoundError,
  AuthPersistenceUnexpectedError,
  AuthPersistenceUniqueConstraintError,
} from '../errors';
import { AuthRepository } from '../repositories';
import { USER_STATUSES } from '../schemas';
import { AuthSignInService } from './auth-sign-in.service';
import { RefreshTokenService } from './refresh-token.service';

describe('AuthSignInService', () => {
  let service: AuthSignInService;
  let authRepository: jest.Mocked<AuthRepository>;
  let passwordHashService: jest.Mocked<Pick<PasswordHashService, 'verifyPassword'>>;
  let refreshTokenService: jest.Mocked<Pick<RefreshTokenService, 'issueTokens'>>;
  let logger: jest.Mocked<Pick<PinoLogger, 'setContext' | 'error'>>;

  const signInPayload = {
    email: 'user@example.com',
    password: 'Password123!',
  };

  const baseUser = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: signInPayload.email,
    userName: 'test-user',
    password: 'hashed-password',
    role: 'USER' as const,
    status: USER_STATUSES.ACTIVE,
    emailVerifiedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const authSession = {
    createdAt: '2026-01-01T00:00:00.000Z',
    expiredAt: '2026-01-01T00:15:00.000Z',
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  beforeEach(async () => {
    authRepository = {
      createUser: jest.fn(),
      findUserById: jest.fn(),
      findUserByEmail: jest.fn(),
      findUserByUserName: jest.fn(),
      verifyUserEmailById: jest.fn(),
      updateUserPasswordById: jest.fn(),
      createSession: jest.fn(),
      findSessionById: jest.fn(),
      revokeSessionById: jest.fn(),
      createRefreshToken: jest.fn(),
      findRefreshTokenByHash: jest.fn(),
      markRefreshTokenAsUsed: jest.fn(),
      revokeRefreshTokenById: jest.fn(),
      revokeRefreshTokensBySessionId: jest.fn(),
    };

    passwordHashService = {
      verifyPassword: jest.fn(),
    };

    refreshTokenService = {
      issueTokens: jest.fn(),
    };

    logger = {
      setContext: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthSignInService,
        { provide: AuthRepository, useValue: authRepository },
        { provide: PasswordHashService, useValue: passwordHashService },
        { provide: RefreshTokenService, useValue: refreshTokenService },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<AuthSignInService>(AuthSignInService);
  });

  it('should sign in with valid email and password', async () => {
    authRepository.findUserByEmail.mockResolvedValue(baseUser);
    passwordHashService.verifyPassword.mockResolvedValue(true);
    refreshTokenService.issueTokens.mockResolvedValue(authSession);

    await expect(service.signIn(signInPayload)).resolves.toEqual(authSession);
    expect(authRepository.findUserByEmail).toHaveBeenCalledWith(signInPayload.email);
    expect(passwordHashService.verifyPassword).toHaveBeenCalledWith(
      signInPayload.password,
      baseUser.password,
    );
    expect(refreshTokenService.issueTokens).toHaveBeenCalledWith(baseUser);
  });

  it('should throw UnauthorizedException when user is not found', async () => {
    authRepository.findUserByEmail.mockResolvedValue(null);

    await expect(service.signIn(signInPayload)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when password is invalid', async () => {
    authRepository.findUserByEmail.mockResolvedValue(baseUser);
    passwordHashService.verifyPassword.mockResolvedValue(false);

    await expect(service.signIn(signInPayload)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw ForbiddenException when user status is BANNED', async () => {
    authRepository.findUserByEmail.mockResolvedValue({
      ...baseUser,
      status: USER_STATUSES.BANNED,
    });
    passwordHashService.verifyPassword.mockResolvedValue(true);

    await expect(service.signIn(signInPayload)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when user status is FROZEN', async () => {
    authRepository.findUserByEmail.mockResolvedValue({
      ...baseUser,
      status: USER_STATUSES.FROZEN,
    });
    passwordHashService.verifyPassword.mockResolvedValue(true);

    await expect(service.signIn(signInPayload)).rejects.toThrow(ForbiddenException);
  });

  it('should map persistence errors to InternalServerErrorException', async () => {
    authRepository.findUserByEmail.mockRejectedValue(
      new AuthPersistenceUnexpectedError('Unexpected persistence error'),
    );

    await expect(service.signIn(signInPayload)).rejects.toThrow(InternalServerErrorException);
    expect(logger.error).toHaveBeenCalled();
  });

  it('should map contract validation errors to InternalServerErrorException', async () => {
    authRepository.findUserByEmail.mockRejectedValue(
      new AuthContractValidationError('Persisted user contract validation failed'),
    );

    await expect(service.signIn(signInPayload)).rejects.toThrow(InternalServerErrorException);
    expect(logger.error).toHaveBeenCalled();
  });

  it('should map known persistence not found errors to InternalServerErrorException', async () => {
    authRepository.findUserByEmail.mockRejectedValue(new AuthPersistenceNotFoundError('Not found'));

    await expect(service.signIn(signInPayload)).rejects.toThrow(InternalServerErrorException);
    expect(logger.error).toHaveBeenCalled();
  });

  it('should map known persistence unique errors to InternalServerErrorException', async () => {
    authRepository.findUserByEmail.mockRejectedValue(
      new AuthPersistenceUniqueConstraintError('Unique constraint violation'),
    );

    await expect(service.signIn(signInPayload)).rejects.toThrow(InternalServerErrorException);
    expect(logger.error).toHaveBeenCalled();
  });
});
