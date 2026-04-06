import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PasswordHashService } from '@modules/security/services';
import { PinoLogger } from 'nestjs-pino';
import { TokenType } from '../enum';
import {
  AuthContractValidationError,
  AuthPersistenceNotFoundError,
  AuthPersistenceUnexpectedError,
  AuthPersistenceUniqueConstraintError,
} from '../errors';
import type { ForgotPasswordInput, ResetPasswordInput } from '../interfaces';
import { AuthRepository } from '../repositories';
import { AuthEventSchema, AuthWithTokenEventSchema, SignCustomTokenInputSchema } from '../schemas';
import { AuthEventsService } from './auth-events.service';
import { JwtTokenService } from './jwt-token.service';

/**
 * Handles forgot-password and reset-password flows.
 */
@Injectable()
export class AuthPasswordRecoveryService {
  constructor(
    private readonly _authRepository: AuthRepository,
    private readonly _jwtTokenService: JwtTokenService,
    private readonly _passwordHashService: PasswordHashService,
    private readonly _authEventsService: AuthEventsService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(AuthPasswordRecoveryService.name);
  }

  /**
   * Requests a password reset email for an existing user.
   *
   * Anti-enumeration behavior:
   * - Unknown emails return without side effects.
   *
   * @param payload External request contract validated by DTO/Zod.
   * @returns `void`.
   * @throws {InternalServerErrorException} For persistence or unexpected failures.
   */
  async forgotPassword(payload: ForgotPasswordInput): Promise<void> {
    try {
      const user = await this._authRepository.findUserByEmail(payload.email);

      if (!user) {
        return;
      }

      const customPayload = SignCustomTokenInputSchema.parse({
        ...user,
        userId: user.id,
        purpose: TokenType.RESET_PASSWORD,
      });

      const resetToken = await this._jwtTokenService.signCustomToken(customPayload);

      const emailPayload = AuthWithTokenEventSchema.parse({
        ...user,
        token: resetToken,
      });

      this._authEventsService.emitPasswordResetRequested(emailPayload);
    } catch (error: unknown) {
      this.handlePersistenceFailure(error, {
        email: payload.email,
        stage: 'forgotPassword',
      });
    }
  }

  /**
   * Resets user password from a valid reset token.
   *
   * @param payload External reset contract validated by DTO/Zod.
   * @returns `void`.
   * @throws {BadRequestException} When token is invalid/expired or passwords do not match.
   * @throws {ConflictException} When token purpose is invalid or target user is missing.
   * @throws {InternalServerErrorException} For persistence or unexpected failures.
   */
  async resetPassword(payload: ResetPasswordInput): Promise<void> {
    if (payload.newPassword !== payload.confirmPassword) {
      throw new BadRequestException('newPassword and confirmPassword must match');
    }

    let tokenPayload: Awaited<ReturnType<JwtTokenService['verifyCustomToken']>>;
    try {
      tokenPayload = await this._jwtTokenService.verifyCustomToken(payload.token);
    } catch (error: unknown) {
      this._logger.warn({ error }, 'Reset token validation failed');
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (tokenPayload.purpose !== TokenType.RESET_PASSWORD) {
      throw new ConflictException('Token purpose is invalid');
    }

    try {
      const user = await this._authRepository.findUserById(tokenPayload.sub);

      if (!user) {
        throw new ConflictException('Invalid reset token');
      }

      const passwordHash = await this._passwordHashService.hashPassword(payload.newPassword);
      const updatedUser = await this._authRepository.updateUserPasswordById(user.id, passwordHash);

      const emailPayload = AuthEventSchema.parse(updatedUser);

      this._authEventsService.emitPasswordReset(emailPayload);
    } catch (error: unknown) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }

      this.handlePersistenceFailure(error, {
        userId: tokenPayload.sub,
        stage: 'resetPassword',
      });
    }
  }

  private handlePersistenceFailure(
    error: unknown,
    context: { email?: string; userId?: string; stage: string },
  ): never {
    if (
      error instanceof AuthContractValidationError ||
      error instanceof AuthPersistenceUnexpectedError ||
      error instanceof AuthPersistenceNotFoundError ||
      error instanceof AuthPersistenceUniqueConstraintError
    ) {
      this._logger.error({ error, ...context }, 'Password recovery persistence stage failed');
      throw new InternalServerErrorException('Internal server error');
    }

    if (error instanceof Error) {
      this._logger.error({ error, ...context }, 'Password recovery failed unexpectedly');
      throw new InternalServerErrorException('Internal server error');
    }

    throw error;
  }
}
