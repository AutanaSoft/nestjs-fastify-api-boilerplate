import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, type TestingModule } from '@nestjs/testing';
import { EVENT_NAMES } from '@shared/constants/event-names.constants';
import { ZodError } from 'zod';
import {
  AuthEmailVerifiedEvent,
  AuthPasswordResetEvent,
  AuthPasswordResetRequestedEvent,
  AuthUserRegisteredEvent,
} from '../events';
import { AuthEventsService } from './auth-events.service';

describe('AuthEventsService', () => {
  let service: AuthEventsService;
  let eventEmitter: jest.Mocked<Pick<EventEmitter2, 'emit'>>;

  const emailPayload = {
    id: '550e8400-e29b-41d4-a716-446655440120',
    email: 'events-user@example.com',
    userName: 'events-user',
  };

  const emailTokenPayload = {
    ...emailPayload,
    token: 'custom-token',
  };

  beforeEach(async () => {
    eventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthEventsService, { provide: EventEmitter2, useValue: eventEmitter }],
    }).compile();

    service = module.get<AuthEventsService>(AuthEventsService);
  });

  it('should emit user registered event with validated payload', () => {
    service.emitUserRegistered(emailTokenPayload);

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      EVENT_NAMES.AUTH.USER_REGISTERED,
      expect.any(AuthUserRegisteredEvent),
    );

    const [, event] = eventEmitter.emit.mock.calls[0] as [string, AuthUserRegisteredEvent];
    expect(event.payload).toEqual(emailTokenPayload);
  });

  it('should emit email verified event with validated payload', () => {
    service.emitEmailVerified(emailPayload);

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      EVENT_NAMES.AUTH.EMAIL_VERIFIED,
      expect.any(AuthEmailVerifiedEvent),
    );

    const [, event] = eventEmitter.emit.mock.calls[0] as [string, AuthEmailVerifiedEvent];
    expect(event.payload).toEqual(emailPayload);
  });

  it('should emit password reset requested event with validated payload', () => {
    service.emitPasswordResetRequested(emailTokenPayload);

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      EVENT_NAMES.AUTH.PASSWORD_RESET_REQUESTED,
      expect.any(AuthPasswordResetRequestedEvent),
    );

    const [, event] = eventEmitter.emit.mock.calls[0] as [string, AuthPasswordResetRequestedEvent];
    expect(event.payload).toEqual(emailTokenPayload);
  });

  it('should emit password reset event with validated payload', () => {
    service.emitPasswordReset(emailPayload);

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      EVENT_NAMES.AUTH.PASSWORD_RESET,
      expect.any(AuthPasswordResetEvent),
    );

    const [, event] = eventEmitter.emit.mock.calls[0] as [string, AuthPasswordResetEvent];
    expect(event.payload).toEqual(emailPayload);
  });

  it('should throw ZodError when email payload is invalid', () => {
    expect(() =>
      service.emitEmailVerified({
        id: emailPayload.id,
        email: 'invalid-email',
        userName: emailPayload.userName,
      }),
    ).toThrow(ZodError);
  });

  it('should throw ZodError when email token payload is invalid', () => {
    expect(() =>
      service.emitUserRegistered({
        id: emailPayload.id,
        email: emailPayload.email,
        userName: emailPayload.userName,
        token: '',
      }),
    ).toThrow(ZodError);
  });
});
