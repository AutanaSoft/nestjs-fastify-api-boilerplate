import { AuthUserRegisteredEvent } from '@/modules/auth/events';
import type { CurrentUser } from '@/modules/auth/interfaces';
import { UsersGetByEmailService } from '@/modules/users/services';
import { Test, type TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import type { Socket } from 'socket.io';
import { WebsocketsAuthService } from './websockets-auth.service';
import { WebsocketsEmitterService } from './websockets-emitter.service';
import { WebsocketsUserRegisteredService } from './websockets-user-registered.service';

describe('WebsocketsUserRegisteredService', () => {
  let service: WebsocketsUserRegisteredService;
  let usersGetByEmailService: jest.Mocked<Pick<UsersGetByEmailService, 'getUserByEmail'>>;
  let websocketsAuthService: jest.Mocked<Pick<WebsocketsAuthService, 'getSocketCurrentUser'>>;
  let websocketsEmitterService: jest.Mocked<
    Pick<WebsocketsEmitterService, 'buildUserRegisteredRoomName' | 'emitUserRegistered'>
  >;
  let logger: jest.Mocked<Pick<PinoLogger, 'setContext' | 'warn' | 'error'>>;

  const currentUser: CurrentUser = {
    id: '550e8400-e29b-41d4-a716-446655441211',
    email: 'registered-user@example.com',
    userName: 'registered-user',
    role: 'USER',
    status: 'ACTIVE',
    sessionId: '550e8400-e29b-41d4-a716-446655441212',
  };

  const baseUser = {
    id: '550e8400-e29b-41d4-a716-446655441211',
    email: 'registered-user@example.com',
    userName: 'registered-user',
    password: 'hashed-password',
    role: 'USER' as const,
    status: 'ACTIVE' as const,
    emailVerifiedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    usersGetByEmailService = {
      getUserByEmail: jest.fn(),
    };
    websocketsAuthService = {
      getSocketCurrentUser: jest.fn(),
    };
    websocketsEmitterService = {
      buildUserRegisteredRoomName: jest.fn(),
      emitUserRegistered: jest.fn(),
    };
    logger = {
      setContext: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebsocketsUserRegisteredService,
        { provide: UsersGetByEmailService, useValue: usersGetByEmailService },
        { provide: WebsocketsAuthService, useValue: websocketsAuthService },
        { provide: WebsocketsEmitterService, useValue: websocketsEmitterService },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<WebsocketsUserRegisteredService>(WebsocketsUserRegisteredService);
  });

  it('should subscribe authenticated client to userRegistered room', async () => {
    websocketsAuthService.getSocketCurrentUser.mockReturnValue(currentUser);
    websocketsEmitterService.buildUserRegisteredRoomName.mockReturnValue('users:registered');
    const client = {
      join: jest.fn(),
    } as unknown as Socket;

    await service.subscribeUserRegistered(client);

    expect(client.join).toHaveBeenCalledWith('users:registered');
  });

  it('should process AUTH.USER_REGISTERED and emit userRegistered', async () => {
    usersGetByEmailService.getUserByEmail.mockResolvedValue(baseUser);

    await service.processUserRegisteredEvent(
      new AuthUserRegisteredEvent({
        id: baseUser.id,
        email: baseUser.email,
        userName: baseUser.userName,
        token: 'verification-token',
      }),
    );

    expect(websocketsEmitterService.emitUserRegistered).toHaveBeenCalledWith(
      expect.objectContaining({ id: baseUser.id }),
    );
  });

  it('should ignore invalid auth payload', async () => {
    await service.processUserRegisteredEvent(
      new AuthUserRegisteredEvent({
        email: 'invalid-email',
        userName: '',
        token: '',
      } as never),
    );

    expect(websocketsEmitterService.emitUserRegistered).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });
});
