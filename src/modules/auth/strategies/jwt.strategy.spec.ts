import { Test, type TestingModule } from '@nestjs/testing';
import type { ConfigType } from '@nestjs/config';
import authConfig from '@/config/auth.config';
import { JwtTokenService } from '../services';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let jwtTokenService: jest.Mocked<Pick<JwtTokenService, 'validateAccessPayload'>>;

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

  const payload: unknown = {
    sub: '550e8400-e29b-41d4-a716-446655440401',
    email: 'strategy-user@example.com',
    userName: 'strategy-user',
    role: 'USER' as const,
    status: 'ACTIVE' as const,
    sessionId: '550e8400-e29b-41d4-a716-446655440402',
    type: 'access' as const,
  };

  beforeEach(async () => {
    jwtTokenService = {
      validateAccessPayload: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: authConfig.KEY, useValue: config },
        { provide: JwtTokenService, useValue: jwtTokenService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should delegate payload validation to JwtTokenService', async () => {
    jwtTokenService.validateAccessPayload.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440401',
      email: 'strategy-user@example.com',
      userName: 'strategy-user',
      role: 'USER',
      status: 'ACTIVE',
      sessionId: '550e8400-e29b-41d4-a716-446655440402',
    });

    await expect(strategy.validate(payload)).resolves.toEqual({
      id: '550e8400-e29b-41d4-a716-446655440401',
      email: 'strategy-user@example.com',
      userName: 'strategy-user',
      role: 'USER',
      status: 'ACTIVE',
      sessionId: '550e8400-e29b-41d4-a716-446655440402',
    });
    expect(jwtTokenService.validateAccessPayload).toHaveBeenCalledWith(payload);
  });
});
