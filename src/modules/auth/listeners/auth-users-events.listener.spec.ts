import { UserCreatedEvent } from '@modules/users/events';
import { Test, type TestingModule } from '@nestjs/testing';
import { EVENT_NAMES } from '@shared/constants/event-names.constants';
import { PinoLogger } from 'nestjs-pino';
import { AuthUserCreatedVerificationService } from '../services/auth-user-created-verification.service';
import { AuthUsersEventsListener } from './auth-users-events.listener';

describe('AuthUsersEventsListener', () => {
  let listener: AuthUsersEventsListener;
  let authUserCreatedVerificationService: jest.Mocked<
    Pick<AuthUserCreatedVerificationService, 'processUserCreated'>
  >;
  let logger: jest.Mocked<Pick<PinoLogger, 'setContext' | 'error'>>;

  const validPayload = {
    id: '550e8400-e29b-41d4-a716-446655440100',
    email: 'listener-user@example.com',
    userName: 'listener-user',
  };

  beforeEach(async () => {
    authUserCreatedVerificationService = {
      processUserCreated: jest.fn().mockResolvedValue(undefined),
    };

    logger = {
      setContext: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthUsersEventsListener,
        {
          provide: AuthUserCreatedVerificationService,
          useValue: authUserCreatedVerificationService,
        },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    listener = module.get<AuthUsersEventsListener>(AuthUsersEventsListener);
  });

  it('should delegate valid USER.CREATED payload to orchestration service', async () => {
    await listener.handleUserCreated(new UserCreatedEvent(validPayload));

    expect(authUserCreatedVerificationService.processUserCreated).toHaveBeenCalledWith(
      validPayload,
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should skip and log when USER.CREATED payload is invalid', async () => {
    await listener.handleUserCreated(
      new UserCreatedEvent({
        ...validPayload,
        id: 'invalid-id',
      } as never),
    );

    expect(authUserCreatedVerificationService.processUserCreated).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: EVENT_NAMES.USER.CREATED }),
      'Received invalid users event payload',
    );
  });
});
