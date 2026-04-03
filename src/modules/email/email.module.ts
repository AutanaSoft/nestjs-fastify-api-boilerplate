import { Module } from '@nestjs/common';
import { EmailEventsListener } from './listeners';
import {
  EMAIL_SENDER,
  RESEND_EMAIL_ADAPTER,
  SMTP_EMAIL_ADAPTER,
} from './constants/email.constants';
import { EmailDispatcherService } from './services/email-dispatcher.service';
import { SettingsModule } from '../settings/settings.module';
import { EmailTemplateProvider } from './providers/email-template.provider';
import { ForgotPasswordEmailService } from './services/auth/forgot-password-email.service';
import { PasswordChangedEmailService } from './services/auth/password-changed-email.service';
import { VerifyEmailService } from './services/auth/verify-email.service';
import { WelcomeEmailService } from './services/auth/welcome-email.service';
import { SmtpEmailAdapter } from './adapters/smtp-email.adapter';
import { ResendEmailAdapter } from './adapters/resend-email.adapter';

@Module({
  imports: [SettingsModule],
  providers: [
    EmailTemplateProvider,
    SmtpEmailAdapter,
    ResendEmailAdapter,
    {
      provide: SMTP_EMAIL_ADAPTER,
      useExisting: SmtpEmailAdapter,
    },
    {
      provide: RESEND_EMAIL_ADAPTER,
      useExisting: ResendEmailAdapter,
    },
    {
      provide: EMAIL_SENDER,
      useClass: EmailDispatcherService,
    },
    WelcomeEmailService,
    VerifyEmailService,
    ForgotPasswordEmailService,
    PasswordChangedEmailService,
    EmailEventsListener,
  ],
  exports: [
    WelcomeEmailService,
    VerifyEmailService,
    ForgotPasswordEmailService,
    PasswordChangedEmailService,
  ],
})
export class EmailModule {}
