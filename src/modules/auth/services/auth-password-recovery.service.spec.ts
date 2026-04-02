import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PasswordHashService } from '@modules/security/services';
import { PinoLogger } from 'nestjs-pino';
import { TokenType } from '../enum';
import {
  AuthContractValidationError,
  AuthPersistenceNotFoundError,
  AuthPersistenceUnexpectedError,
  AuthPersistenceUniqueConstraintError,
} from '../errors';
import { AuthRepository } from '../repositories';
import { AuthPasswordRecoveryService } from './auth-password-recovery.service';
import { AuthEventsService } from './auth-events.service';
import { JwtTokenService } from './jwt-token.service';

describe('AuthPasswordRecoveryService', () => {
  let service: AuthPasswordRecoveryService;
  let authRepository: jest.Mocked<AuthRepository>;
  let jwtTokenService: jest.Mocked<Pick<JwtTokenService, 'signCustomToken' | 'verifyCustomToken'>>;
  let passwordHashService: jest.Mocked<Pick<PasswordHashService, 'hashPassword'>>;
  let authEventsService: jest.Mocked<
    Pick<AuthEventsService, 'emitPasswordResetRequested' | 'emitPasswordReset'>
  >;
  let logger: jest.Mocked<Pick<PinoLogger, 'setContext' | 'error' | 'warn'>>;

  const user = {
    id: '550e8400-e29b-41d4-a716-446655440101',
    email: 'recover-user@example.com',
    userName: 'recover-user',
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

    passwordHashService = {
      hashPassword: jest.fn(),
    };

    authEventsService = {
      emitPasswordResetRequested: jest.fn(),
      emitPasswordReset: jest.fn(),
    };

    logger = {
      setContext: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthPasswordRecoveryService,
        { provide: AuthRepository, useValue: authRepository },
        { provide: JwtTokenService, useValue: jwtTokenService },
        { provide: PasswordHashService, useValue: passwordHashService },
        { provide: AuthEventsService, useValue: authEventsService },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<AuthPasswordRecoveryService>(AuthPasswordRecoveryService);
  });

  describe('forgotPassword', () => {
    it('should do nothing for unknown email (anti-enumeration)', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);

      await expect(
        service.forgotPassword({ email: 'unknown@example.com' }),
      ).resolves.toBeUndefined();
      expect(jwtTokenService.signCustomToken).not.toHaveBeenCalled();
      expect(authEventsService.emitPasswordResetRequested).not.toHaveBeenCalled();
    });

    it('should emit password reset requested event when user exists', async () => {
      authRepository.findUserByEmail.mockResolvedValue(user);
      jwtTokenService.signCustomToken.mockResolvedValue('reset-token');

      await expect(service.forgotPassword({ email: user.email })).resolves.toBeUndefined();

      expect(jwtTokenService.signCustomToken).toHaveBeenCalledWith({
        userId: user.id,
        email: user.email,
        userName: user.userName,
        purpose: TokenType.RESET_PASSWORD,
      });
      expect(authEventsService.emitPasswordResetRequested).toHaveBeenCalledWith({
        email: user.email,
        userName: user.userName,
        token: 'reset-token',
      });
    });

    it('should map persistence errors to InternalServerErrorException', async () => {
      authRepository.findUserByEmail.mockRejectedValue(
        new AuthPersistenceUnexpectedError('Unexpected persistence error'),
      );

      await expect(service.forgotPassword({ email: user.email })).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should throw BadRequestException when passwords do not match', async () => {
      await expect(
        service.resetPassword({
          token: 'any-token',
          newPassword: 'Password123_',
          confirmPassword: 'Different123_',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when token is invalid or expired', async () => {
      jwtTokenService.verifyCustomToken.mockRejectedValue(new Error('invalid token'));

      await expect(
        service.resetPassword({
          token: 'invalid-token',
          newPassword: 'Password123_',
          confirmPassword: 'Password123_',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when token purpose is invalid', async () => {
      jwtTokenService.verifyCustomToken.mockResolvedValue({
        sub: user.id,
        email: user.email,
        userName: user.userName,
        type: 'custom',
        purpose: TokenType.VERIFY_EMAIL,
      });

      await expect(
        service.resetPassword({
          token: 'wrong-purpose-token',
          newPassword: 'Password123_',
          confirmPassword: 'Password123_',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when target user does not exist', async () => {
      jwtTokenService.verifyCustomToken.mockResolvedValue({
        sub: user.id,
        email: user.email,
        userName: user.userName,
        type: 'custom',
        purpose: TokenType.RESET_PASSWORD,
      });
      authRepository.findUserById.mockResolvedValue(null);

      await expect(
        service.resetPassword({
          token: 'valid-token',
          newPassword: 'Password123_',
          confirmPassword: 'Password123_',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should reset password and emit password reset event', async () => {
      jwtTokenService.verifyCustomToken.mockResolvedValue({
        sub: user.id,
        email: user.email,
        userName: user.userName,
        type: 'custom',
        purpose: TokenType.RESET_PASSWORD,
      });
      authRepository.findUserById.mockResolvedValue(user);
      passwordHashService.hashPassword.mockResolvedValue('new-hashed-password');
      authRepository.updateUserPasswordById.mockResolvedValue({
        ...user,
        password: 'new-hashed-password',
      });

      await expect(
        service.resetPassword({
          token: 'valid-token',
          newPassword: 'Password123_',
          confirmPassword: 'Password123_',
        }),
      ).resolves.toBeUndefined();

      expect(passwordHashService.hashPassword).toHaveBeenCalledWith('Password123_');
      expect(authRepository.updateUserPasswordById).toHaveBeenCalledWith(
        user.id,
        'new-hashed-password',
      );
      expect(authEventsService.emitPasswordReset).toHaveBeenCalledWith({
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
        purpose: TokenType.RESET_PASSWORD,
      });
      authRepository.findUserById.mockRejectedValue(
        new AuthPersistenceUnexpectedError('Unexpected persistence error'),
      );

      await expect(
        service.resetPassword({
          token: 'valid-token',
          newPassword: 'Password123_',
          confirmPassword: 'Password123_',
        }),
      ).rejects.toThrow(InternalServerErrorException);

      expect(logger.error).toHaveBeenCalled();
    });

    it('should map known persistence and contract errors to InternalServerErrorException', async () => {
      jwtTokenService.verifyCustomToken.mockResolvedValue({
        sub: user.id,
        email: user.email,
        userName: user.userName,
        type: 'custom',
        purpose: TokenType.RESET_PASSWORD,
      });

      for (const error of [
        new AuthContractValidationError('Contract failed'),
        new AuthPersistenceNotFoundError('Not found'),
        new AuthPersistenceUniqueConstraintError('Unique failed'),
      ]) {
        authRepository.findUserById.mockRejectedValueOnce(error);

        await expect(
          service.resetPassword({
            token: 'valid-token',
            newPassword: 'Password123_',
            confirmPassword: 'Password123_',
          }),
        ).rejects.toThrow(InternalServerErrorException);
      }
    });
  });
});
