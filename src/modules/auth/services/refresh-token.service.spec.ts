import { UnauthorizedException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import type { ConfigType } from '@nestjs/config';
import authConfig from '@/config/auth.config';
import { AuthPersistenceUnexpectedError } from '../errors';
import { AuthRepository } from '../repositories';
import { RefreshTokenService } from './refresh-token.service';
import { JwtTokenService } from './jwt-token.service';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let authRepository: jest.Mocked<AuthRepository>;
  let jwtTokenService: jest.Mocked<Pick<JwtTokenService, 'signAccessToken'>>;
  let logger: jest.Mocked<Pick<PinoLogger, 'setContext' | 'error'>>;

  const config: ConfigType<typeof authConfig> = {
    AUTH_JWT_SECRET: '12345678901234567890123456789012',
    AUTH_JWT_ISSUER: 'test-issuer',
    AUTH_JWT_AUDIENCE: 'test-audience',
    AUTH_ACCESS_TOKEN_TTL: '15m',
    AUTH_REFRESH_TOKEN_TTL: '7d',
    AUTH_VERIFY_EMAIL_TOKEN_TTL: '1d',
    AUTH_RESET_PASSWORD_TOKEN_TTL: '30m',
    AUTH_ARGON2_MEMORY_COST: 19456,
    AUTH_ARGON2_TIME_COST: 2,
    AUTH_ARGON2_PARALLELISM: 1,
    AUTH_ARGON2_HASH_LENGTH: 32,
  };

  const user = {
    id: '550e8400-e29b-41d4-a716-446655440200',
    email: 'token-user@example.com',
    userName: 'token-user',
    password: 'hashed-password',
    role: 'USER' as const,
    status: 'ACTIVE' as const,
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
      signAccessToken: jest.fn(),
    };

    logger = {
      setContext: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        { provide: authConfig.KEY, useValue: config },
        { provide: AuthRepository, useValue: authRepository },
        { provide: JwtTokenService, useValue: jwtTokenService },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<RefreshTokenService>(RefreshTokenService);

    jest.spyOn(service as never, 'generateOpaqueToken').mockReturnValue('opaque-refresh-token');
    jest.spyOn(service as never, 'hashOpaqueToken').mockImplementation((value: string) => {
      if (value === 'opaque-refresh-token') {
        return 'opaque-hash';
      }

      return 'incoming-hash';
    });
  });

  it('should issue tokens by creating session and refresh token', async () => {
    authRepository.createSession.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440201',
      userId: user.id,
      revokedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    jwtTokenService.signAccessToken.mockResolvedValue({
      token: 'signed-access-token',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      expiresAt: new Date('2026-01-01T00:15:00.000Z'),
    });

    authRepository.createRefreshToken.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440202',
      sessionId: '550e8400-e29b-41d4-a716-446655440201',
      tokenHash: 'opaque-hash',
      expiresAt: new Date('2026-01-08T00:00:00.000Z'),
      revokedAt: null,
      usedAt: null,
      rotatedFromId: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const session = await service.issueTokens(user);

    expect(session).toEqual({
      createdAt: '2026-01-01T00:00:00.000Z',
      expiredAt: '2026-01-01T00:15:00.000Z',
      accessToken: 'signed-access-token',
      refreshToken: 'opaque-refresh-token',
    });

    expect(authRepository.createSession).toHaveBeenCalledWith(user.id);
    expect(authRepository.createRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: '550e8400-e29b-41d4-a716-446655440201',
        tokenHash: 'opaque-hash',
      }),
    );
  });

  it('should throw UnauthorizedException when refresh token does not exist', async () => {
    authRepository.findRefreshTokenByHash.mockResolvedValue(null);

    await expect(service.rotateTokens('incoming-token')).rejects.toThrow(UnauthorizedException);
  });

  it('should revoke full session when revoked refresh token is reused', async () => {
    authRepository.findRefreshTokenByHash.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440203',
      sessionId: '550e8400-e29b-41d4-a716-446655440204',
      tokenHash: 'incoming-hash',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date('2026-01-01T00:05:00.000Z'),
      usedAt: null,
      rotatedFromId: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      session: {
        id: '550e8400-e29b-41d4-a716-446655440204',
        userId: user.id,
        revokedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        user,
      },
    });

    await expect(service.rotateTokens('incoming-token')).rejects.toThrow(UnauthorizedException);

    expect(authRepository.revokeSessionById).toHaveBeenCalled();
    expect(authRepository.revokeRefreshTokensBySessionId).toHaveBeenCalled();
  });

  it('should revoke token and reject when refresh token is expired', async () => {
    authRepository.findRefreshTokenByHash.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440205',
      sessionId: '550e8400-e29b-41d4-a716-446655440206',
      tokenHash: 'incoming-hash',
      expiresAt: new Date(Date.now() - 1_000),
      revokedAt: null,
      usedAt: null,
      rotatedFromId: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      session: {
        id: '550e8400-e29b-41d4-a716-446655440206',
        userId: user.id,
        revokedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        user,
      },
    });

    await expect(service.rotateTokens('incoming-token')).rejects.toThrow(UnauthorizedException);
    expect(authRepository.revokeRefreshTokenById).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440205',
      expect.any(Date),
    );
  });

  it('should reject when session is already revoked', async () => {
    authRepository.findRefreshTokenByHash.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440207',
      sessionId: '550e8400-e29b-41d4-a716-446655440208',
      tokenHash: 'incoming-hash',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      usedAt: null,
      rotatedFromId: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      session: {
        id: '550e8400-e29b-41d4-a716-446655440208',
        userId: user.id,
        revokedAt: new Date('2026-01-01T00:03:00.000Z'),
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:03:00.000Z'),
        user,
      },
    });

    await expect(service.rotateTokens('incoming-token')).rejects.toThrow(UnauthorizedException);
  });

  it('should rotate tokens when refresh token and session are valid', async () => {
    authRepository.findRefreshTokenByHash.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440209',
      sessionId: '550e8400-e29b-41d4-a716-446655440210',
      tokenHash: 'incoming-hash',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      usedAt: null,
      rotatedFromId: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      session: {
        id: '550e8400-e29b-41d4-a716-446655440210',
        userId: user.id,
        revokedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        user,
      },
    });

    jwtTokenService.signAccessToken.mockResolvedValue({
      token: 'rotated-access-token',
      createdAt: new Date('2026-01-01T01:00:00.000Z'),
      expiresAt: new Date('2026-01-01T01:15:00.000Z'),
    });

    authRepository.createRefreshToken.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440211',
      sessionId: '550e8400-e29b-41d4-a716-446655440210',
      tokenHash: 'opaque-hash',
      expiresAt: new Date('2026-01-08T01:00:00.000Z'),
      revokedAt: null,
      usedAt: null,
      rotatedFromId: '550e8400-e29b-41d4-a716-446655440209',
      createdAt: new Date('2026-01-01T01:00:00.000Z'),
      updatedAt: new Date('2026-01-01T01:00:00.000Z'),
    });

    const result = await service.rotateTokens('incoming-token');

    expect(result).toEqual({
      createdAt: '2026-01-01T01:00:00.000Z',
      expiredAt: '2026-01-01T01:15:00.000Z',
      accessToken: 'rotated-access-token',
      refreshToken: 'opaque-refresh-token',
    });
    expect(authRepository.markRefreshTokenAsUsed).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440209',
      expect.any(Date),
    );
    expect(authRepository.revokeRefreshTokenById).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440209',
      expect.any(Date),
    );
  });

  it('should map unknown errors to AuthPersistenceUnexpectedError', async () => {
    authRepository.findRefreshTokenByHash.mockRejectedValue(new Error('database exploded'));

    await expect(service.rotateTokens('incoming-token')).rejects.toThrow(
      AuthPersistenceUnexpectedError,
    );
    expect(logger.error).toHaveBeenCalled();
  });
});
