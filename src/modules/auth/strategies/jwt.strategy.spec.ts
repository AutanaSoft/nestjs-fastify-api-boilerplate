import { UnauthorizedException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { ConfigType } from '@nestjs/config';
import authConfig from '@/config/auth.config';
import { AuthRepository } from '../repositories';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authRepository: jest.Mocked<AuthRepository>;

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

  const payload = {
    sub: '550e8400-e29b-41d4-a716-446655440401',
    email: 'strategy-user@example.com',
    userName: 'strategy-user',
    role: 'USER' as const,
    status: 'ACTIVE' as const,
    sessionId: '550e8400-e29b-41d4-a716-446655440402',
    type: 'access' as const,
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: authConfig.KEY, useValue: config },
        { provide: AuthRepository, useValue: authRepository },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should throw UnauthorizedException when payload is invalid', async () => {
    await expect(strategy.validate({ invalid: true })).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when session is missing', async () => {
    authRepository.findSessionById.mockResolvedValue(null);

    await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when session is revoked', async () => {
    authRepository.findSessionById.mockResolvedValue({
      id: payload.sessionId,
      userId: payload.sub,
      revokedAt: new Date('2026-01-01T00:10:00.000Z'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:10:00.000Z'),
    });

    await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
  });

  it('should return current user payload when token and session are valid', async () => {
    authRepository.findSessionById.mockResolvedValue({
      id: payload.sessionId,
      userId: payload.sub,
      revokedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    await expect(strategy.validate(payload)).resolves.toEqual({
      id: payload.sub,
      email: payload.email,
      userName: payload.userName,
      role: payload.role,
      status: payload.status,
      sessionId: payload.sessionId,
    });
  });
});
