import { InternalServerErrorException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { EMAIL_SENDER } from '../../constants/email.constants';
import { type EmailSender } from '../../interfaces/email-sender.interface';
import { EmailTemplateProvider } from '../../providers/email-template.provider';
import { PasswordChangedEmailService } from './password-changed-email.service';

describe('PasswordChangedEmailService', () => {
  let service: PasswordChangedEmailService;
  let emailSender: jest.Mocked<EmailSender>;
  let templateProvider: jest.Mocked<Pick<EmailTemplateProvider, 'render'>>;
  let logger: jest.Mocked<Pick<PinoLogger, 'setContext' | 'info' | 'error'>>;

  beforeEach(async () => {
    emailSender = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    templateProvider = {
      render: jest.fn().mockResolvedValue('<html><body>Changed</body></html>'),
    };

    logger = {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordChangedEmailService,
        { provide: EMAIL_SENDER, useValue: emailSender },
        { provide: EmailTemplateProvider, useValue: templateProvider },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<PasswordChangedEmailService>(PasswordChangedEmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendPasswordChangedEmail', () => {
    const mockInput = {
      to: 'test@example.com',
      name: 'Test User',
    };

    it('should send the password changed notification', async () => {
      await expect(service.sendPasswordChangedEmail(mockInput)).resolves.toBeUndefined();

      expect(templateProvider.render).toHaveBeenCalledTimes(1);
      expect(emailSender.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockInput.to,
          subject: 'Your password was changed successfully',
        }),
      );
    });

    it('should throw InternalServerErrorException when sender fails', async () => {
      emailSender.send.mockRejectedValue(new Error('Critical error'));

      await expect(service.sendPasswordChangedEmail(mockInput)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(logger.error).toHaveBeenCalledTimes(1);
    });
  });
});
