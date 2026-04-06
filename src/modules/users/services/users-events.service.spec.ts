import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, type TestingModule } from '@nestjs/testing';
import { EVENT_NAMES } from '@shared/constants/event-names.constants';
import { PinoLogger } from 'nestjs-pino';
import { UserRoles, UserStatus } from '../constants';
import { UsersEventsService } from './users-events.service';

describe('UsersEventsService', () => {
  let service: UsersEventsService;
  let eventEmitter: jest.Mocked<Pick<EventEmitter2, 'emit'>>;
  let logger: jest.Mocked<Pick<PinoLogger, 'setContext' | 'debug'>>;

  const baseUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    userName: 'test-user',
    password: 'hashed-password',
    role: UserRoles.USER,
    status: UserStatus.ACTIVE,
    emailVerifiedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    eventEmitter = {
      emit: jest.fn(),
    };

    logger = {
      setContext: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersEventsService,
        { provide: EventEmitter2, useValue: eventEmitter },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<UsersEventsService>(UsersEventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should emit USER.CREATED event', () => {
    service.emitUserCreated(baseUser as never);

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      EVENT_NAMES.USER.CREATED,
      expect.objectContaining({
        payload: {
          id: baseUser.id,
          email: baseUser.email,
          userName: baseUser.userName,
        },
      }),
    );
    expect(logger.debug).toHaveBeenCalledWith({ userId: baseUser.id }, 'Emitted USER.CREATED');
  });

  it('should emit USER.UPDATED_PASSWORD event', () => {
    service.emitUserPasswordUpdated(baseUser as never);

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      EVENT_NAMES.USER.UPDATED_PASSWORD,
      expect.objectContaining({
        payload: {
          id: baseUser.id,
          email: baseUser.email,
          userName: baseUser.userName,
        },
      }),
    );
    expect(logger.debug).toHaveBeenCalledWith(
      { userId: baseUser.id },
      'Emitted USER.UPDATED_PASSWORD',
    );
  });

  it('should emit USER.UPDATED event', () => {
    service.emitUserUpdated(baseUser as never);

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      EVENT_NAMES.USER.UPDATED,
      expect.objectContaining({
        payload: {
          id: baseUser.id,
          email: baseUser.email,
          userName: baseUser.userName,
        },
      }),
    );
    expect(logger.debug).toHaveBeenCalledWith({ userId: baseUser.id }, 'Emitted USER.UPDATED');
  });

  it('should throw when user event payload is invalid', () => {
    expect(() =>
      service.emitUserCreated({
        ...baseUser,
        email: 'invalid-email',
      } as never),
    ).toThrow();
  });
});
