import appConfig from '@/config/app.config';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import type { ReactElement } from 'react';
import { EMAIL_SENDER } from '../../constants/email.constants';
import { type EmailSender } from '../../interfaces/email-sender.interface';
import { EmailTemplateProvider } from '../../providers/email-template.provider';
import { EmailForgotPasswordService } from './email-forgot-password.service';

describe('EmailForgotPasswordService', () => {
  let service: EmailForgotPasswordService;
  let emailSender: jest.Mocked<EmailSender>;
  let templateProvider: jest.Mocked<Pick<EmailTemplateProvider, 'render'>>;
  let logger: jest.Mocked<Pick<PinoLogger, 'setContext' | 'info' | 'error'>>;

  beforeEach(async () => {
    emailSender = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    templateProvider = {
      render: jest.fn().mockResolvedValue('<html><body>Forgot</body></html>'),
    };

    logger = {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailForgotPasswordService,
        { provide: EMAIL_SENDER, useValue: emailSender },
        { provide: EmailTemplateProvider, useValue: templateProvider },
        { provide: PinoLogger, useValue: logger },
        {
          provide: appConfig.KEY,
          useValue: { APP_FRONTEND_URL: 'http://localhost:3000' },
        },
      ],
    }).compile();

    service = module.get<EmailForgotPasswordService>(EmailForgotPasswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendForgotPasswordEmail', () => {
    const mockInput = {
      to: 'test@example.com',
      name: 'Test User',
      token: 'header.payload.signature',
    };

    it('should send password recovery email with jwt token in the URL', async () => {
      await expect(service.sendForgotPasswordEmail(mockInput)).resolves.toBeUndefined();

      expect(templateProvider.render).toHaveBeenCalledTimes(1);
      const templateElement = templateProvider.render.mock.calls[0][0] as ReactElement<{
        href: string;
      }>;
      expect(templateElement.props.href).toContain('token=header.payload.signature');

      expect(emailSender.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockInput.to,
          subject: 'Reset your password - AutanaSoft',
        }),
      );
    });

    it('should throw InternalServerErrorException when jwtToken is missing', async () => {
      const inputWithoutToken = {
        to: 'test@example.com',
        name: 'Test User',
      };

      await expect(
        service.sendForgotPasswordEmail(inputWithoutToken as unknown as typeof mockInput),
      ).rejects.toThrow(InternalServerErrorException);
      expect(logger.error).toHaveBeenCalledTimes(1);
    });

    it('should throw InternalServerErrorException when sender fails', async () => {
      emailSender.send.mockRejectedValue(new Error('Send Error'));

      await expect(service.sendForgotPasswordEmail(mockInput)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(logger.error).toHaveBeenCalledTimes(1);
    });
  });
});
