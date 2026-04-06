import type { CurrentUser } from '@/modules/auth/interfaces';
import { JwtTokenService } from '@/modules/auth/services';
import { UnauthorizedException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { Socket } from 'socket.io';
import { WebsocketsAuthService } from './websockets-auth.service';

describe('WebsocketsAuthService', () => {
  let service: WebsocketsAuthService;
  let jwtTokenService: jest.Mocked<Pick<JwtTokenService, 'verifyAccessToken'>>;

  const currentUser: CurrentUser = {
    id: '550e8400-e29b-41d4-a716-446655440401',
    email: 'socket-user@example.com',
    userName: 'socket-user',
    role: 'USER',
    status: 'ACTIVE',
    sessionId: '550e8400-e29b-41d4-a716-446655440402',
  };

  beforeEach(async () => {
    jwtTokenService = {
      verifyAccessToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [WebsocketsAuthService, { provide: JwtTokenService, useValue: jwtTokenService }],
    }).compile();

    service = module.get<WebsocketsAuthService>(WebsocketsAuthService);
  });

  it('should authenticate using handshake auth token', async () => {
    jwtTokenService.verifyAccessToken.mockResolvedValue(currentUser);
    const client = {
      handshake: {
        auth: { token: 'handshake-token' },
        headers: {},
      },
      data: {},
    } as unknown as Socket;

    await expect(service.authenticateClient(client)).resolves.toEqual(currentUser);
    expect(jwtTokenService.verifyAccessToken).toHaveBeenCalledWith('handshake-token');
  });

  it('should authenticate using bearer header when handshake auth is missing', async () => {
    jwtTokenService.verifyAccessToken.mockResolvedValue(currentUser);
    const client = {
      handshake: {
        auth: {},
        headers: {
          authorization: 'Bearer header-token',
        },
      },
      data: {},
    } as unknown as Socket;

    await expect(service.authenticateClient(client)).resolves.toEqual(currentUser);
    expect(jwtTokenService.verifyAccessToken).toHaveBeenCalledWith('header-token');
  });

  it('should throw UnauthorizedException when token is missing', async () => {
    const client = {
      handshake: {
        auth: {},
        headers: {},
      },
      data: {},
    } as unknown as Socket;

    await expect(service.authenticateClient(client)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when bearer header format is invalid', async () => {
    const client = {
      handshake: {
        auth: {},
        headers: {
          authorization: 'Invalid token',
        },
      },
      data: {},
    } as unknown as Socket;

    await expect(service.authenticateClient(client)).rejects.toThrow(UnauthorizedException);
  });

  it('should return authenticated current user from socket data', () => {
    const client = {
      data: {
        currentUser,
      },
    } as unknown as Socket;

    expect(service.getSocketCurrentUser(client)).toEqual(currentUser);
  });

  it('should throw UnauthorizedException when socket current user is invalid', () => {
    const client = {
      data: {
        currentUser: {
          id: 'not-a-uuid',
        },
      },
    } as unknown as Socket;

    expect(() => service.getSocketCurrentUser(client)).toThrow(UnauthorizedException);
  });
});
