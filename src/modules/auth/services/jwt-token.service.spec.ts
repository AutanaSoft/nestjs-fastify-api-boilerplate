import { UnauthorizedException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { PinoLogger } from 'nestjs-pino';
import type { ConfigType } from '@nestjs/config';
import authConfig from '@/config/auth.config';
import { TokenType } from '../enum';
import { AuthRepository } from '../repositories';
import { JwtTokenService } from './jwt-token.service';

describe('JwtTokenService', () => {
  let service: JwtTokenService;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync' | 'verifyAsync' | 'verify'>>;
  let authRepository: jest.Mocked<AuthRepository>;
  let logger: jest.Mocked<Pick<PinoLogger, 'setContext' | 'warn' | 'error'>>;

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

  beforeEach(async () => {
    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
      verify: jest.fn(),
    };

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

    logger = {
      setContext: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtTokenService,
        { provide: authConfig.KEY, useValue: config },
        { provide: JwtService, useValue: jwtService },
        { provide: AuthRepository, useValue: authRepository },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<JwtTokenService>(JwtTokenService);
  });

  it('should sign access token and return token metadata', async () => {
    jwtService.signAsync.mockResolvedValue('access-token');
    jwtService.verify.mockReturnValue({ exp: 1_800_000 });

    const result = await service.signAccessToken({
      sub: '550e8400-e29b-41d4-a716-446655440300',
      email: 'user@example.com',
      userName: 'jwt-user',
      role: 'USER',
      status: 'ACTIVE',
      sessionId: '550e8400-e29b-41d4-a716-446655440301',
    });

    expect(result.token).toBe('access-token');
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.expiresAt).toEqual(new Date(1_800_000 * 1_000));
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ type: TokenType.ACCESS }),
      expect.objectContaining({ expiresIn: config.AUTH_ACCESS_TOKEN_TTL }),
    );
  });

  it('should throw UnauthorizedException when generated access token has invalid exp', async () => {
    jwtService.signAsync.mockResolvedValue('access-token');
    jwtService.verify.mockReturnValue({} as never);

    await expect(
      service.signAccessToken({
        sub: '550e8400-e29b-41d4-a716-446655440302',
        email: 'user@example.com',
        userName: 'jwt-user',
        role: 'USER',
        status: 'ACTIVE',
        sessionId: '550e8400-e29b-41d4-a716-446655440303',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should sign verify-email custom token with verify-email ttl', async () => {
    jwtService.signAsync.mockResolvedValue('verify-token');

    const token = await service.signCustomToken({
      userId: '550e8400-e29b-41d4-a716-446655440304',
      email: 'user@example.com',
      userName: 'jwt-user',
      purpose: TokenType.VERIFY_EMAIL,
    });

    expect(token).toBe('verify-token');
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ purpose: TokenType.VERIFY_EMAIL, type: 'custom' }),
      expect.objectContaining({ expiresIn: config.AUTH_VERIFY_EMAIL_TOKEN_TTL }),
    );
  });

  it('should sign reset-password custom token with reset-password ttl', async () => {
    jwtService.signAsync.mockResolvedValue('reset-token');

    const token = await service.signCustomToken({
      userId: '550e8400-e29b-41d4-a716-446655440305',
      email: 'user@example.com',
      userName: 'jwt-user',
      purpose: TokenType.RESET_PASSWORD,
    });

    expect(token).toBe('reset-token');
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ purpose: TokenType.RESET_PASSWORD, type: 'custom' }),
      expect.objectContaining({ expiresIn: config.AUTH_RESET_PASSWORD_TOKEN_TTL }),
    );
  });

  it('should verify and parse custom token payload', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: '550e8400-e29b-41d4-a716-446655440306',
      email: 'user@example.com',
      userName: 'jwt-user',
      purpose: TokenType.VERIFY_EMAIL,
      type: 'custom',
    });

    await expect(service.verifyCustomToken('custom-token')).resolves.toEqual({
      sub: '550e8400-e29b-41d4-a716-446655440306',
      email: 'user@example.com',
      userName: 'jwt-user',
      purpose: TokenType.VERIFY_EMAIL,
      type: 'custom',
    });
  });

  it('should throw UnauthorizedException when custom token verify fails', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));

    await expect(service.verifyCustomToken('invalid-token')).rejects.toThrow(UnauthorizedException);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when custom token payload is invalid', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'not-a-uuid',
      type: 'custom',
    });

    await expect(service.verifyCustomToken('invalid-payload-token')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should verify access token and return current user when session is valid', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: '550e8400-e29b-41d4-a716-446655440307',
      email: 'user@example.com',
      userName: 'jwt-user',
      role: 'USER',
      status: 'ACTIVE',
      sessionId: '550e8400-e29b-41d4-a716-446655440308',
      type: TokenType.ACCESS,
    });
    authRepository.findSessionById.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440308',
      userId: '550e8400-e29b-41d4-a716-446655440307',
      revokedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    await expect(service.verifyAccessToken('valid-access-token')).resolves.toEqual({
      id: '550e8400-e29b-41d4-a716-446655440307',
      email: 'user@example.com',
      userName: 'jwt-user',
      role: 'USER',
      status: 'ACTIVE',
      sessionId: '550e8400-e29b-41d4-a716-446655440308',
    });
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-access-token', {
      secret: config.AUTH_JWT_SECRET,
      issuer: config.AUTH_JWT_ISSUER,
      audience: config.AUTH_JWT_AUDIENCE,
    });
  });

  it('should throw UnauthorizedException when access token payload is invalid', async () => {
    jwtService.verifyAsync.mockResolvedValue({ invalid: true });

    await expect(service.verifyAccessToken('invalid-access-token')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when access session is revoked', async () => {
    authRepository.findSessionById.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440309',
      userId: '550e8400-e29b-41d4-a716-446655440310',
      revokedAt: new Date('2026-01-01T00:10:00.000Z'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:10:00.000Z'),
    });

    await expect(
      service.validateAccessPayload({
        sub: '550e8400-e29b-41d4-a716-446655440310',
        email: 'user@example.com',
        userName: 'jwt-user',
        role: 'USER',
        status: 'ACTIVE',
        sessionId: '550e8400-e29b-41d4-a716-446655440309',
        type: TokenType.ACCESS,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
