import { UserCreatedEvent, UserPasswordUpdatedEvent } from '@modules/users/events/users.events';
import { Test, type TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { PasswordChangedEmailService } from '../services/auth/password-changed-email.service';
import { WelcomeEmailService } from '../services/auth/welcome-email.service';
import { EmailEventsListener } from './email-events.listener';

describe('EmailEventsListener', () => {
  let listener: EmailEventsListener;
  let welcomeEmailService: jest.Mocked<Pick<WelcomeEmailService, 'sendWelcomeEmail'>>;
  let passwordChangedEmailService: jest.Mocked<
    Pick<PasswordChangedEmailService, 'sendPasswordChangedEmail'>
  >;
  let logger: jest.Mocked<Pick<PinoLogger, 'setContext' | 'info' | 'error'>>;

  beforeEach(async () => {
    welcomeEmailService = {
      sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
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
        { provide: WelcomeEmailService, useValue: welcomeEmailService },
        { provide: PasswordChangedEmailService, useValue: passwordChangedEmailService },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    listener = module.get<EmailEventsListener>(EmailEventsListener);
  });

  it('should be defined', () => {
    expect(listener).toBeDefined();
  });

  describe('handleUserCreated', () => {
    it('should dispatch welcome email for user.created event', async () => {
      const event = new UserCreatedEvent({
        email: 'test@example.com',
        userName: 'Test User',
      } as never);

      await expect(listener.handleUserCreated(event)).resolves.toBeUndefined();

      expect(welcomeEmailService.sendWelcomeEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        name: 'Test User',
      });
      expect(logger.info).toHaveBeenCalledWith(
        { email: 'test@example.com' },
        'Welcome email sent successfully.',
      );
    });

    it('should log error and not throw when welcome email fails', async () => {
      welcomeEmailService.sendWelcomeEmail.mockRejectedValue(new Error('Email failed'));

      const event = new UserCreatedEvent({
        email: 'test@example.com',
        userName: 'Test User',
      } as never);

      await expect(listener.handleUserCreated(event)).resolves.toBeUndefined();

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('handleUserUpdatedPassword', () => {
    it('should dispatch password changed email for updated password event', async () => {
      const event = new UserPasswordUpdatedEvent({
        email: 'test@example.com',
        userName: 'Test User',
      } as never);

      await expect(listener.handleUserUpdatedPassword(event)).resolves.toBeUndefined();

      expect(passwordChangedEmailService.sendPasswordChangedEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        name: 'Test User',
      });
      expect(logger.info).toHaveBeenCalledWith(
        { email: 'test@example.com' },
        'Password changed email sent successfully.',
      );
    });

    it('should log error and not throw when password changed email fails', async () => {
      passwordChangedEmailService.sendPasswordChangedEmail.mockRejectedValue(
        new Error('Email failed'),
      );

      const event = new UserPasswordUpdatedEvent({
        email: 'test@example.com',
        userName: 'Test User',
      } as never);

      await expect(listener.handleUserUpdatedPassword(event)).resolves.toBeUndefined();

      expect(logger.error).toHaveBeenCalled();
    });
  });
});
