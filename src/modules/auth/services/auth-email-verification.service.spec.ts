import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { TokenType } from '../enum';
import {
  AuthContractValidationError,
  AuthPersistenceNotFoundError,
  AuthPersistenceUnexpectedError,
  AuthPersistenceUniqueConstraintError,
} from '../errors';
import { AuthRepository } from '../repositories';
import { AuthEmailVerificationService } from './auth-email-verification.service';
import { AuthEventsService } from './auth-events.service';
import { JwtTokenService } from './jwt-token.service';

describe('AuthEmailVerificationService', () => {
  let service: AuthEmailVerificationService;
  let authRepository: jest.Mocked<AuthRepository>;
  let jwtTokenService: jest.Mocked<Pick<JwtTokenService, 'signCustomToken' | 'verifyCustomToken'>>;
  let authEventsService: jest.Mocked<
    Pick<AuthEventsService, 'emitUserRegistered' | 'emitEmailVerified'>
  >;
  let logger: jest.Mocked<Pick<PinoLogger, 'setContext' | 'error' | 'warn'>>;

  const user = {
    id: '550e8400-e29b-41d4-a716-446655440100',
    email: 'verify-user@example.com',
    userName: 'verify-user',
    password: 'hashed-password',
    role: 'USER' as const,
    status: 'REGISTERED' as const,
    emailVerifiedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
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

    jwtTokenService = {
      signCustomToken: jest.fn(),
      verifyCustomToken: jest.fn(),
    };

    authEventsService = {
      emitUserRegistered: jest.fn(),
      emitEmailVerified: jest.fn(),
    };

    logger = {
      setContext: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthEmailVerificationService,
        { provide: AuthRepository, useValue: authRepository },
        { provide: JwtTokenService, useValue: jwtTokenService },
        { provide: AuthEventsService, useValue: authEventsService },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<AuthEmailVerificationService>(AuthEmailVerificationService);
  });

  describe('requestVerificationEmail', () => {
    it('should do nothing for unknown email (anti-enumeration)', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);

      await expect(
        service.requestVerificationEmail({ email: 'unknown@example.com' }),
      ).resolves.toBeUndefined();

      expect(jwtTokenService.signCustomToken).not.toHaveBeenCalled();
      expect(authEventsService.emitUserRegistered).not.toHaveBeenCalled();
    });

    it('should do nothing when email is already verified (anti-enumeration)', async () => {
      authRepository.findUserByEmail.mockResolvedValue({
        ...user,
        emailVerifiedAt: new Date('2026-01-02T00:00:00.000Z'),
      });

      await expect(
        service.requestVerificationEmail({ email: user.email }),
      ).resolves.toBeUndefined();

      expect(jwtTokenService.signCustomToken).not.toHaveBeenCalled();
      expect(authEventsService.emitUserRegistered).not.toHaveBeenCalled();
    });

    it('should send verification email token when user exists and is unverified', async () => {
      authRepository.findUserByEmail.mockResolvedValue(user);
      jwtTokenService.signCustomToken.mockResolvedValue('verify-token');

      await expect(
        service.requestVerificationEmail({ email: user.email }),
      ).resolves.toBeUndefined();

      expect(jwtTokenService.signCustomToken).toHaveBeenCalledWith({
        userId: user.id,
        email: user.email,
        userName: user.userName,
        purpose: TokenType.VERIFY_EMAIL,
      });

      expect(authEventsService.emitUserRegistered).toHaveBeenCalledWith({
        email: user.email,
        userName: user.userName,
        token: 'verify-token',
      });
    });
  });

  describe('verifyEmail', () => {
    it('should throw BadRequestException when token is invalid or expired', async () => {
      jwtTokenService.verifyCustomToken.mockRejectedValue(new Error('invalid token'));

      await expect(service.verifyEmail({ token: 'invalid-token' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException when token purpose is invalid', async () => {
      jwtTokenService.verifyCustomToken.mockResolvedValue({
        sub: user.id,
        email: user.email,
        userName: user.userName,
        type: 'custom',
        purpose: TokenType.RESET_PASSWORD,
      });

      await expect(service.verifyEmail({ token: 'wrong-purpose-token' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException when target user does not exist', async () => {
      jwtTokenService.verifyCustomToken.mockResolvedValue({
        sub: user.id,
        email: user.email,
        userName: user.userName,
        type: 'custom',
        purpose: TokenType.VERIFY_EMAIL,
      });
      authRepository.findUserById.mockResolvedValue(null);

      await expect(service.verifyEmail({ token: 'valid-token' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException when email is already verified', async () => {
      jwtTokenService.verifyCustomToken.mockResolvedValue({
        sub: user.id,
        email: user.email,
        userName: user.userName,
        type: 'custom',
        purpose: TokenType.VERIFY_EMAIL,
      });
      authRepository.findUserById.mockResolvedValue({
        ...user,
        emailVerifiedAt: new Date('2026-01-02T00:00:00.000Z'),
      });

      await expect(service.verifyEmail({ token: 'valid-token' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should verify email and emit email-verified event', async () => {
      jwtTokenService.verifyCustomToken.mockResolvedValue({
        sub: user.id,
        email: user.email,
        userName: user.userName,
        type: 'custom',
        purpose: TokenType.VERIFY_EMAIL,
      });
      authRepository.findUserById.mockResolvedValue(user);
      authRepository.verifyUserEmailById.mockResolvedValue({
        ...user,
        emailVerifiedAt: new Date('2026-01-02T00:00:00.000Z'),
      });

      await expect(service.verifyEmail({ token: 'valid-token' })).resolves.toBeUndefined();

      expect(authRepository.verifyUserEmailById).toHaveBeenCalledWith(user.id, expect.any(Date));
      expect(authEventsService.emitEmailVerified).toHaveBeenCalledWith({
        email: user.email,
        userName: user.userName,
      });
    });

    it('should map persistence errors to InternalServerErrorException', async () => {
      jwtTokenService.verifyCustomToken.mockResolvedValue({
        sub: user.id,
        email: user.email,
        userName: user.userName,
        type: 'custom',
        purpose: TokenType.VERIFY_EMAIL,
      });
      authRepository.findUserById.mockRejectedValue(
        new AuthPersistenceUnexpectedError('Unexpected persistence error'),
      );

      await expect(service.verifyEmail({ token: 'valid-token' })).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(logger.error).toHaveBeenCalled();
    });

    it('should map known persistence and contract errors to InternalServerErrorException', async () => {
      jwtTokenService.verifyCustomToken.mockResolvedValue({
        sub: user.id,
        email: user.email,
        userName: user.userName,
        type: 'custom',
        purpose: TokenType.VERIFY_EMAIL,
      });

      for (const error of [
        new AuthContractValidationError('Contract failed'),
        new AuthPersistenceNotFoundError('Not found'),
        new AuthPersistenceUniqueConstraintError('Unique failed'),
      ]) {
        authRepository.findUserById.mockRejectedValueOnce(error);

        await expect(service.verifyEmail({ token: 'valid-token' })).rejects.toThrow(
          InternalServerErrorException,
        );
      }
    });
  });
});
