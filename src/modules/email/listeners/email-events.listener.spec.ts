import {
  AuthEmailVerifiedEvent,
  AuthPasswordResetEvent,
  AuthPasswordResetRequestedEvent,
  AuthUserRegisteredEvent,
} from '@modules/auth/events';
import { UserCreatedEvent } from '@modules/users/events';
import { EVENT_NAMES } from '@shared/constants/event-names.constants';
import { Test, type TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { ForgotPasswordEmailService } from '../services/auth/forgot-password-email.service';
import { PasswordChangedEmailService } from '../services/auth/password-changed-email.service';
import { VerifyEmailService } from '../services/auth/verify-email.service';
import { WelcomeEmailService } from '../services/auth/welcome-email.service';
import { EmailEventsListener } from './email-events.listener';

describe('EmailEventsListener', () => {
  let listener: EmailEventsListener;
  let verifyEmailService: jest.Mocked<Pick<VerifyEmailService, 'sendVerifyEmail'>>;
  let welcomeEmailService: jest.Mocked<Pick<WelcomeEmailService, 'sendWelcomeEmail'>>;
  let forgotPasswordEmailService: jest.Mocked<
    Pick<ForgotPasswordEmailService, 'sendForgotPasswordEmail'>
  >;
  let passwordChangedEmailService: jest.Mocked<
    Pick<PasswordChangedEmailService, 'sendPasswordChangedEmail'>
  >;
  let logger: jest.Mocked<Pick<PinoLogger, 'setContext' | 'info' | 'error'>>;

  beforeEach(async () => {
    verifyEmailService = { sendVerifyEmail: jest.fn().mockResolvedValue(undefined) };
    welcomeEmailService = { sendWelcomeEmail: jest.fn().mockResolvedValue(undefined) };
    forgotPasswordEmailService = {
      sendForgotPasswordEmail: jest.fn().mockResolvedValue(undefined),
    };
    passwordChangedEmailService = {
      sendPasswordChangedEmail: jest.fn().mockResolvedValue(undefined),
    };
    logger = {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailEventsListener,
        { provide: VerifyEmailService, useValue: verifyEmailService },
        { provide: WelcomeEmailService, useValue: welcomeEmailService },
        { provide: ForgotPasswordEmailService, useValue: forgotPasswordEmailService },
        { provide: PasswordChangedEmailService, useValue: passwordChangedEmailService },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    listener = module.get<EmailEventsListener>(EmailEventsListener);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(listener).toBeDefined();
  });

  it('should process USER_REGISTERED event when payload is valid', async () => {
    await listener.handleUserRegistered(
      new AuthUserRegisteredEvent({
        email: 'test@example.com',
        userName: 'test-user',
        token: 'jwt-token',
      }),
    );

    expect(verifyEmailService.sendVerifyEmail).toHaveBeenCalledWith({
      to: 'test@example.com',
      name: 'test-user',
      token: 'jwt-token',
    });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should process USER.CREATED event when payload is valid', async () => {
    await listener.handleUserCreated(
      new UserCreatedEvent({
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        userName: 'test-user',
      }),
    );

    expect(welcomeEmailService.sendWelcomeEmail).toHaveBeenCalledWith({
      to: 'test@example.com',
      name: 'test-user',
    });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should bubble service error for USER_REGISTERED without duplicate listener error logs', async () => {
    verifyEmailService.sendVerifyEmail.mockRejectedValue(new Error('service failure'));

    await expect(
      listener.handleUserRegistered(
        new AuthUserRegisteredEvent({
          email: 'test@example.com',
          userName: 'test-user',
          token: 'jwt-token',
        }),
      ),
    ).rejects.toThrow('service failure');

    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should skip USER_REGISTERED event when payload is invalid', async () => {
    await expect(
      listener.handleUserRegistered(
        new AuthUserRegisteredEvent({
          email: 'invalid-email',
          userName: 'test-user',
          token: 'jwt-token',
        } as never),
      ),
    ).resolves.toBeUndefined();

    expect(verifyEmailService.sendVerifyEmail).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: EVENT_NAMES.AUTH.USER_REGISTERED }),
      'Received invalid auth event payload',
    );
  });

  it('should skip USER.CREATED event when payload is invalid', async () => {
    await expect(
      listener.handleUserCreated(
        new UserCreatedEvent({
          id: 'invalid-id',
          email: 'test@example.com',
          userName: 'test-user',
        } as never),
      ),
    ).resolves.toBeUndefined();

    expect(welcomeEmailService.sendWelcomeEmail).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: EVENT_NAMES.USER.CREATED }),
      'Received invalid user event payload',
    );
  });

  it('should skip EMAIL_VERIFIED event when payload is invalid', async () => {
    await expect(
      listener.handleEmailVerified(
        new AuthEmailVerifiedEvent({
          email: 'invalid-email',
          userName: 'test-user',
        } as never),
      ),
    ).resolves.toBeUndefined();

    expect(welcomeEmailService.sendWelcomeEmail).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: EVENT_NAMES.AUTH.EMAIL_VERIFIED }),
      'Received invalid auth event payload',
    );
  });

  it('should skip PASSWORD_RESET_REQUESTED event when payload is invalid', async () => {
    await expect(
      listener.handlePasswordResetRequested(
        new AuthPasswordResetRequestedEvent({
          email: 'test@example.com',
          userName: '',
          token: 'jwt-token',
        } as never),
      ),
    ).resolves.toBeUndefined();

    expect(forgotPasswordEmailService.sendForgotPasswordEmail).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: EVENT_NAMES.AUTH.PASSWORD_RESET_REQUESTED }),
      'Received invalid auth event payload',
    );
  });

  it('should skip PASSWORD_RESET event when payload is invalid', async () => {
    await expect(
      listener.handlePasswordReset(
        new AuthPasswordResetEvent({
          email: '',
          userName: 'test-user',
        } as never),
      ),
    ).resolves.toBeUndefined();

    expect(passwordChangedEmailService.sendPasswordChangedEmail).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: EVENT_NAMES.AUTH.PASSWORD_RESET }),
      'Received invalid auth event payload',
    );
  });
});
