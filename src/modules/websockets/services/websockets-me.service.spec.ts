import { UserPasswordUpdatedEvent, UserUpdatedEvent } from '@/modules/users/events';
import { UsersGetByIdService } from '@/modules/users/services';
import type { CurrentUser } from '@/modules/auth/interfaces';
import { Test, type TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import type { Socket } from 'socket.io';
import { WebsocketsAuthService } from './websockets-auth.service';
import { WebsocketsEmitterService } from './websockets-emitter.service';
import { WebsocketsMeService } from './websockets-me.service';

describe('WebsocketsMeService', () => {
  let service: WebsocketsMeService;
  let usersGetByIdService: jest.Mocked<Pick<UsersGetByIdService, 'getUserById'>>;
  let websocketsAuthService: jest.Mocked<Pick<WebsocketsAuthService, 'getSocketCurrentUser'>>;
  let websocketsEmitterService: jest.Mocked<
    Pick<WebsocketsEmitterService, 'buildUserRoomName' | 'emitMeUpdated'>
  >;
  let logger: jest.Mocked<Pick<PinoLogger, 'setContext' | 'warn' | 'error'>>;

  const currentUser: CurrentUser = {
    id: '550e8400-e29b-41d4-a716-446655441111',
    email: 'me-user@example.com',
    userName: 'me-user',
    role: 'USER',
    status: 'ACTIVE',
    sessionId: '550e8400-e29b-41d4-a716-446655441112',
  };

  const baseUser = {
    id: '550e8400-e29b-41d4-a716-446655441111',
    email: 'me-user@example.com',
    userName: 'me-user',
    password: 'hashed-password',
    role: 'USER' as const,
    status: 'ACTIVE' as const,
    emailVerifiedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    usersGetByIdService = {
      getUserById: jest.fn(),
    };
    websocketsAuthService = {
      getSocketCurrentUser: jest.fn(),
    };
    websocketsEmitterService = {
      buildUserRoomName: jest.fn(),
      emitMeUpdated: jest.fn(),
    };
    logger = {
      setContext: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebsocketsMeService,
        { provide: UsersGetByIdService, useValue: usersGetByIdService },
        { provide: WebsocketsAuthService, useValue: websocketsAuthService },
        { provide: WebsocketsEmitterService, useValue: websocketsEmitterService },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<WebsocketsMeService>(WebsocketsMeService);
  });

  it('should subscribe authenticated client to me room', async () => {
    websocketsAuthService.getSocketCurrentUser.mockReturnValue(currentUser);
    websocketsEmitterService.buildUserRoomName.mockReturnValue(`user:${currentUser.id}`);
    const client = {
      join: jest.fn(),
    } as unknown as Socket;

    await service.subscribeMe(client);

    expect(client.join).toHaveBeenCalledWith(`user:${currentUser.id}`);
  });

  it('should process USER.UPDATED event and emit me update', async () => {
    usersGetByIdService.getUserById.mockResolvedValue(baseUser);

    await service.processUserUpdatedEvent(
      new UserUpdatedEvent({
        id: baseUser.id,
        email: baseUser.email,
        userName: baseUser.userName,
      }),
    );

    expect(websocketsEmitterService.emitMeUpdated).toHaveBeenCalledWith(
      baseUser.id,
      expect.objectContaining({ id: baseUser.id }),
    );
  });

  it('should process USER.UPDATED_PASSWORD event and emit me update', async () => {
    usersGetByIdService.getUserById.mockResolvedValue(baseUser);

    await service.processUserUpdatedEvent(
      new UserPasswordUpdatedEvent({
        id: baseUser.id,
        email: baseUser.email,
        userName: baseUser.userName,
      }),
    );

    expect(websocketsEmitterService.emitMeUpdated).toHaveBeenCalledWith(
      baseUser.id,
      expect.objectContaining({ id: baseUser.id }),
    );
  });

  it('should ignore invalid USER.UPDATED payload', async () => {
    await service.processUserUpdatedEvent(
      new UserUpdatedEvent({
        id: 'invalid-id',
        email: 'invalid-email',
        userName: '',
      } as never),
    );

    expect(websocketsEmitterService.emitMeUpdated).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });
});
