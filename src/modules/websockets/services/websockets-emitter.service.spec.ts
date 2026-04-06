import { Test, type TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import type { Server } from 'socket.io';
import { WebsocketsEmitterService } from './websockets-emitter.service';

describe('WebsocketsEmitterService', () => {
  let service: WebsocketsEmitterService;
  let logger: jest.Mocked<Pick<PinoLogger, 'setContext' | 'warn'>>;

  beforeEach(async () => {
    logger = {
      setContext: jest.fn(),
      warn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [WebsocketsEmitterService, { provide: PinoLogger, useValue: logger }],
    }).compile();

    service = module.get<WebsocketsEmitterService>(WebsocketsEmitterService);
  });

  it('should emit me event to user room when server is registered', () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    const server = { to } as unknown as Server;
    service.registerServer(server);

    service.emitMeUpdated('550e8400-e29b-41d4-a716-446655440801', {
      id: '550e8400-e29b-41d4-a716-446655440801',
      email: 'emitter-user@example.com',
      userName: 'emitter-user',
      role: 'USER',
      status: 'ACTIVE',
      emailVerifiedAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(to).toHaveBeenCalledWith('user:550e8400-e29b-41d4-a716-446655440801');
    expect(emit).toHaveBeenCalledWith(
      'me',
      expect.objectContaining({ id: '550e8400-e29b-41d4-a716-446655440801' }),
    );
  });

  it('should warn and skip emit when server is not registered', () => {
    service.emitUserRegistered({
      id: '550e8400-e29b-41d4-a716-446655440802',
      email: 'emitter-user@example.com',
      userName: 'emitter-user',
      role: 'USER',
      status: 'ACTIVE',
      emailVerifiedAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(logger.warn).toHaveBeenCalled();
  });
});
