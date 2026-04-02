import { Module } from '@nestjs/common';
import { PasswordHashService } from './services';

/**
 * Shared security module exposing reusable security-related services.
 */
@Module({
  providers: [PasswordHashService],
  exports: [PasswordHashService],
})
export class SecurityModule {}
