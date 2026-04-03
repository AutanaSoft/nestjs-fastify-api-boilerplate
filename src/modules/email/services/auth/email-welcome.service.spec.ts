import { InternalServerErrorException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { EMAIL_SENDER } from '../../constants/email.constants';
import { type EmailSender } from '../../interfaces/email-sender.interface';
import { EmailTemplateProvider } from '../../providers/email-template.provider';
import { EmailWelcomeService } from './email-welcome.service';

describe('EmailWelcomeService', () => {
  let service: EmailWelcomeService;
  let emailSender: jest.Mocked<EmailSender>;
  let templateProvider: jest.Mocked<Pick<EmailTemplateProvider, 'render'>>;
  let logger: jest.Mocked<Pick<PinoLogger, 'setContext' | 'info' | 'error'>>;

  beforeEach(async () => {
    emailSender = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    templateProvider = {
      render: jest.fn().mockResolvedValue('<html><body>Welcome</body></html>'),
    };

    logger = {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailWelcomeService,
        { provide: EMAIL_SENDER, useValue: emailSender },
        { provide: EmailTemplateProvider, useValue: templateProvider },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<EmailWelcomeService>(EmailWelcomeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendWelcomeEmail', () => {
    const mockInput = {
      to: 'test@example.com',
      name: 'Test User',
    };

    it('should send the welcome email', async () => {
      await expect(service.sendWelcomeEmail(mockInput)).resolves.toBeUndefined();

      expect(templateProvider.render).toHaveBeenCalledTimes(1);
      expect(emailSender.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockInput.to,
          subject: '¡Bienvenido a AutanaSoft!',
        }),
      );
    });

    it('should throw InternalServerErrorException when email sender fails', async () => {
      emailSender.send.mockRejectedValue(new Error('SMTP Error'));

      await expect(service.sendWelcomeEmail(mockInput)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(logger.error).toHaveBeenCalledTimes(1);
    });
  });
});
