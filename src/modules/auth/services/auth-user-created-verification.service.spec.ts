import type { UserEventPayload } from '@modules/users/interfaces';
import { Test, type TestingModule } from '@nestjs/testing';
import { EVENT_NAMES } from '@shared/constants/event-names.constants';
import { PinoLogger } from 'nestjs-pino';
import { TokenType } from '../enum';
import { AuthRepository } from '../repositories';
import { AuthEventsService } from './auth-events.service';
import { AuthUserCreatedVerificationService } from './auth-user-created-verification.service';
import { JwtTokenService } from './jwt-token.service';

describe('AuthUserCreatedVerificationService', () => {
  let service: AuthUserCreatedVerificationService;
  let authRepository: jest.Mocked<AuthRepository>;
  let jwtTokenService: jest.Mocked<Pick<JwtTokenService, 'signCustomToken'>>;
  let authEventsService: jest.Mocked<Pick<AuthEventsService, 'emitUserRegistered'>>;
  let logger: jest.Mocked<Pick<PinoLogger, 'setContext' | 'info' | 'warn' | 'error'>>;

  const payload: UserEventPayload = {
    id: '550e8400-e29b-41d4-a716-446655440100',
    email: 'service-user@example.com',
    userName: 'service-user',
  };

  const user = {
    id: payload.id,
    email: payload.email,
    userName: payload.userName,
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
    };

    authEventsService = {
      emitUserRegistered: jest.fn(),
    };

    logger = {
      setContext: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthUserCreatedVerificationService,
        { provide: AuthRepository, useValue: authRepository },
        { provide: JwtTokenService, useValue: jwtTokenService },
        { provide: AuthEventsService, useValue: authEventsService },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<AuthUserCreatedVerificationService>(AuthUserCreatedVerificationService);
  });

  it('should emit tokenized auth event when user is valid and unverified', async () => {
    authRepository.findUserById.mockResolvedValue(user);
    jwtTokenService.signCustomToken.mockResolvedValue('verify-token');

    await service.processUserCreated(payload);

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
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should skip when auth user does not exist', async () => {
    authRepository.findUserById.mockResolvedValue(null);

    await service.processUserCreated(payload);

    expect(jwtTokenService.signCustomToken).not.toHaveBeenCalled();
    expect(authEventsService.emitUserRegistered).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: EVENT_NAMES.USER.CREATED, userId: payload.id }),
      'Skipping verification token emission: auth user not found',
    );
  });

  it('should skip when user is already verified', async () => {
    authRepository.findUserById.mockResolvedValue({
      ...user,
      emailVerifiedAt: new Date('2026-01-02T00:00:00.000Z'),
    });

    await service.processUserCreated(payload);

    expect(jwtTokenService.signCustomToken).not.toHaveBeenCalled();
    expect(authEventsService.emitUserRegistered).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: EVENT_NAMES.USER.CREATED, userId: payload.id }),
      'Skipping verification token emission: user is already verified',
    );
  });

  it('should log and swallow orchestration errors', async () => {
    authRepository.findUserById.mockResolvedValue(user);
    jwtTokenService.signCustomToken.mockRejectedValue(new Error('token-error'));

    await expect(service.processUserCreated(payload)).resolves.toBeUndefined();

    expect(authEventsService.emitUserRegistered).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: EVENT_NAMES.USER.CREATED, userId: payload.id }),
      'Failed to orchestrate verification token emission from user-created event',
    );
  });
});
