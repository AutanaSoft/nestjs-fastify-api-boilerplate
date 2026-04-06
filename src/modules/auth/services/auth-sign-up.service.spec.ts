import { ConflictException, InternalServerErrorException } from '@nestjs/common';
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
import { TokenType } from '../enum';
import { AuthEventsService } from './auth-events.service';
import { AuthSignUpService } from './auth-sign-up.service';
import { JwtTokenService } from './jwt-token.service';
import { RefreshTokenService } from './refresh-token.service';

describe('AuthSignUpService', () => {
  let service: AuthSignUpService;
  let authRepository: jest.Mocked<AuthRepository>;
  let passwordHashService: jest.Mocked<Pick<PasswordHashService, 'hashPassword'>>;
  let refreshTokenService: jest.Mocked<Pick<RefreshTokenService, 'issueTokens'>>;
  let jwtTokenService: jest.Mocked<Pick<JwtTokenService, 'signCustomToken'>>;
  let authEventsService: jest.Mocked<Pick<AuthEventsService, 'emitUserRegistered'>>;
  let logger: jest.Mocked<Pick<PinoLogger, 'setContext' | 'error'>>;

  const signUpPayload = {
    email: 'new-user@example.com',
    userName: 'new.user',
    password: 'Password123!',
  };

  const createdUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: signUpPayload.email,
    userName: signUpPayload.userName,
    password: 'hashed-password',
    role: 'USER' as const,
    status: 'REGISTERED' as const,
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
      hashPassword: jest.fn(),
    };

    refreshTokenService = {
      issueTokens: jest.fn(),
    };

    jwtTokenService = {
      signCustomToken: jest.fn(),
    };

    authEventsService = {
      emitUserRegistered: jest.fn(),
    };

    logger = {
      setContext: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthSignUpService,
        { provide: AuthRepository, useValue: authRepository },
        { provide: PasswordHashService, useValue: passwordHashService },
        { provide: RefreshTokenService, useValue: refreshTokenService },
        { provide: JwtTokenService, useValue: jwtTokenService },
        { provide: AuthEventsService, useValue: authEventsService },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<AuthSignUpService>(AuthSignUpService);
  });

  it('should create user, issue session and emit user registered event', async () => {
    passwordHashService.hashPassword.mockResolvedValue(createdUser.password);
    authRepository.createUser.mockResolvedValue(createdUser);
    refreshTokenService.issueTokens.mockResolvedValue(authSession);
    jwtTokenService.signCustomToken.mockResolvedValue('verify-token');

    const result = await service.signUp(signUpPayload);

    expect(result).toEqual(authSession);
    expect(passwordHashService.hashPassword).toHaveBeenCalledWith(signUpPayload.password);
    expect(authRepository.createUser).toHaveBeenCalledWith({
      ...signUpPayload,
      password: createdUser.password,
    });
    expect(refreshTokenService.issueTokens).toHaveBeenCalledWith(createdUser);
    expect(jwtTokenService.signCustomToken).toHaveBeenCalledWith({
      userId: createdUser.id,
      email: createdUser.email,
      userName: createdUser.userName,
      purpose: TokenType.VERIFY_EMAIL,
    });
    expect(authEventsService.emitUserRegistered).toHaveBeenCalledWith({
      id: createdUser.id,
      email: createdUser.email,
      userName: createdUser.userName,
      token: 'verify-token',
    });
  });

  it('should throw ConflictException when createUser fails with unique constraint', async () => {
    passwordHashService.hashPassword.mockResolvedValue(createdUser.password);
    authRepository.createUser.mockRejectedValue(
      new AuthPersistenceUniqueConstraintError('Email or userName is already in use'),
    );

    await expect(service.signUp(signUpPayload)).rejects.toThrow(ConflictException);
  });

  it('should throw InternalServerErrorException when createUser fails with contract validation', async () => {
    passwordHashService.hashPassword.mockResolvedValue(createdUser.password);
    authRepository.createUser.mockRejectedValue(
      new AuthContractValidationError('Persisted user contract validation failed'),
    );

    await expect(service.signUp(signUpPayload)).rejects.toThrow(InternalServerErrorException);
    expect(logger.error).toHaveBeenCalled();
  });

  it('should throw InternalServerErrorException when createUser fails with unexpected persistence error', async () => {
    passwordHashService.hashPassword.mockResolvedValue(createdUser.password);
    authRepository.createUser.mockRejectedValue(
      new AuthPersistenceUnexpectedError('Unexpected persistence error'),
    );

    await expect(service.signUp(signUpPayload)).rejects.toThrow(InternalServerErrorException);
    expect(logger.error).toHaveBeenCalled();
  });

  it('should throw InternalServerErrorException when createUser fails with not found persistence error', async () => {
    passwordHashService.hashPassword.mockResolvedValue(createdUser.password);
    authRepository.createUser.mockRejectedValue(
      new AuthPersistenceNotFoundError('Resource not found'),
    );

    await expect(service.signUp(signUpPayload)).rejects.toThrow(InternalServerErrorException);
    expect(logger.error).toHaveBeenCalled();
  });
});
