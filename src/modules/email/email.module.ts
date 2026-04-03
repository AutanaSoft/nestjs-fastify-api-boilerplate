import { Module } from '@nestjs/common';
import { EmailEventsListener } from './listeners';
import { EMAIL_SENDER, RESEND_EMAIL_ADAPTER, SMTP_EMAIL_ADAPTER } from './constants';
import { SettingsModule } from '../settings/settings.module';
import { ResendEmailAdapter, SmtpEmailAdapter } from './adapters';
import { EmailTemplateProvider } from './providers';
import {
  EmailDispatcherService,
  ForgotPasswordEmailService,
  PasswordChangedEmailService,
  VerifyEmailService,
  WelcomeEmailService,
} from './services';

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
