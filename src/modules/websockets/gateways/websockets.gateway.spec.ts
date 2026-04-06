import type { CurrentUser } from '@/modules/auth/interfaces';
import { UnauthorizedException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import type { Server, Socket } from 'socket.io';
import type { WebSocketPingEvent, WebSocketPongEvent } from '../interfaces';
import {
  WebsocketsAuthService,
  WebsocketsEmitterService,
  WebsocketsEventsService,
} from '../services';
import { WebsocketsMeService } from '../services/websockets-me.service';
import { WebsocketsUserRegisteredService } from '../services/websockets-user-registered.service';
import { WebsocketsGateway } from './websockets.gateway';

describe('WebsocketsGateway', () => {
  let gateway: WebsocketsGateway;
  let websocketsAuthService: jest.Mocked<
    Pick<
      WebsocketsAuthService,
      'authenticateClient' | 'getSocketCurrentUser' | 'buildUnauthorizedErrorPayload'
    >
  >;
  let websocketsEventsService: jest.Mocked<
    Pick<WebsocketsEventsService, 'parsePingPayload' | 'buildPongPayload'>
  >;
  let websocketsUserRegisteredService: jest.Mocked<
    Pick<WebsocketsUserRegisteredService, 'subscribeUserRegistered'>
  >;
  let websocketsMeService: jest.Mocked<Pick<WebsocketsMeService, 'subscribeMe'>>;
  let websocketsEmitterService: jest.Mocked<Pick<WebsocketsEmitterService, 'registerServer'>>;

  const currentUser: CurrentUser = {
    id: '550e8400-e29b-41d4-a716-446655440601',
    email: 'gateway-user@example.com',
    userName: 'gateway-user',
    role: 'USER',
    status: 'ACTIVE',
    sessionId: '550e8400-e29b-41d4-a716-446655440602',
  };

  beforeEach(async () => {
    websocketsAuthService = {
      authenticateClient: jest.fn(),
      getSocketCurrentUser: jest.fn(),
      buildUnauthorizedErrorPayload: jest.fn(),
    };
    websocketsEventsService = {
      parsePingPayload: jest.fn(),
      buildPongPayload: jest.fn(),
    };
    websocketsUserRegisteredService = {
      subscribeUserRegistered: jest.fn(),
    };
    websocketsMeService = {
      subscribeMe: jest.fn(),
    };
    websocketsEmitterService = {
      registerServer: jest.fn(),
    };
    const logger: jest.Mocked<Pick<PinoLogger, 'setContext' | 'info' | 'warn'>> = {
      setContext: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebsocketsGateway,
        { provide: WebsocketsAuthService, useValue: websocketsAuthService },
        { provide: WebsocketsEventsService, useValue: websocketsEventsService },
        { provide: WebsocketsMeService, useValue: websocketsMeService },
        {
          provide: WebsocketsUserRegisteredService,
          useValue: websocketsUserRegisteredService,
        },
        { provide: WebsocketsEmitterService, useValue: websocketsEmitterService },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    gateway = module.get<WebsocketsGateway>(WebsocketsGateway);
  });

  it('should register server on gateway initialization', () => {
    const server = {} as Server;
    gateway.server = server;

    gateway.afterInit();

    expect(websocketsEmitterService.registerServer).toHaveBeenCalledWith(server);
  });

  it('should authenticate and attach current user on connection', async () => {
    websocketsAuthService.authenticateClient.mockResolvedValue(currentUser);
    const client = {
      id: 'socket-1',
      data: {},
      emit: jest.fn(),
      disconnect: jest.fn(),
    } as unknown as Socket;

    await gateway.handleConnection(client);

    expect((client.data as Record<string, unknown>).currentUser).toEqual(currentUser);
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('should emit auth error and disconnect on auth failure', async () => {
    websocketsAuthService.authenticateClient.mockRejectedValue(new UnauthorizedException());
    websocketsAuthService.buildUnauthorizedErrorPayload.mockReturnValue({
      code: 'UNAUTHORIZED',
      message: 'Unauthorized socket connection',
    });
    const client = {
      id: 'socket-2',
      data: {},
      emit: jest.fn(),
      disconnect: jest.fn(),
    } as unknown as Socket;

    await gateway.handleConnection(client);

    expect(client.emit).toHaveBeenCalledWith('ws.error', {
      code: 'UNAUTHORIZED',
      message: 'Unauthorized socket connection',
    });
    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('should emit typed pong payload on ws.ping', () => {
    websocketsAuthService.getSocketCurrentUser.mockReturnValue(currentUser);
    websocketsEventsService.parsePingPayload.mockReturnValue({
      message: 'ping',
    } as WebSocketPingEvent);
    websocketsEventsService.buildPongPayload.mockReturnValue({
      message: 'pong',
      echoedMessage: 'ping',
      userId: currentUser.id,
      sentAt: '2026-01-01T00:00:00.000Z',
    } as WebSocketPongEvent);
    const client = {
      id: 'socket-3',
      data: { currentUser },
      emit: jest.fn(),
    } as unknown as Socket;

    gateway.handlePing(client, { message: 'ping' });

    expect(client.emit).toHaveBeenCalledWith('ws.pong', {
      message: 'pong',
      echoedMessage: 'ping',
      userId: currentUser.id,
      sentAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('should delegate me subscription to subscriptions service', async () => {
    const client = {
      id: 'socket-4',
    } as unknown as Socket;

    await gateway.handleMeSubscription(client);

    expect(websocketsMeService.subscribeMe).toHaveBeenCalledWith(client);
  });

  it('should delegate userRegistered subscription to service', async () => {
    const client = {
      id: 'socket-5',
    } as unknown as Socket;

    await gateway.handleUserRegisteredSubscription(client);

    expect(websocketsUserRegisteredService.subscribeUserRegistered).toHaveBeenCalledWith(client);
  });

  it('should log disconnection without throwing', () => {
    const client = {
      id: 'socket-6',
    } as unknown as Socket;

    expect(() => gateway.handleDisconnect(client)).not.toThrow();
  });
});
