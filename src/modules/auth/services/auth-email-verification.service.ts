import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { TokenType } from '../enum';
import {
  AuthContractValidationError,
  AuthPersistenceNotFoundError,
  AuthPersistenceUnexpectedError,
  AuthPersistenceUniqueConstraintError,
} from '../errors';
import type { RequestEmailVerificationInput, VerifyEmailInput } from '../interfaces';
import { AuthRepository } from '../repositories';
import { AuthEventSchema, AuthWithTokenEventSchema, SignCustomTokenInputSchema } from '../schemas';
import { AuthEventsService } from './auth-events.service';
import { JwtTokenService } from './jwt-token.service';

/**
 * Handles request and confirmation flows for user email verification.
 */
@Injectable()
export class AuthEmailVerificationService {
  constructor(
    private readonly _authRepository: AuthRepository,
    private readonly _jwtTokenService: JwtTokenService,
    private readonly _authEventsService: AuthEventsService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(AuthEmailVerificationService.name);
  }

  /**
   * Requests a verification email for a known and non-verified user.
   *
   * Anti-enumeration behavior:
   * - Unknown emails return without side effects.
   * - Already verified users return without side effects.
   *
   * @param payload External request contract validated by DTO/Zod.
   * @returns `void`.
   * @throws {InternalServerErrorException} For persistence or unexpected failures.
   */
  async requestVerificationEmail(payload: RequestEmailVerificationInput): Promise<void> {
    try {
      const user = await this._authRepository.findUserByEmail(payload.email);

      if (!user || user.emailVerifiedAt) {
        return;
      }

      const customPayload = SignCustomTokenInputSchema.parse({
        ...user,
        userId: user.id,
        purpose: TokenType.VERIFY_EMAIL,
      });

      const verifyToken = await this._jwtTokenService.signCustomToken(customPayload);

      const emailPayload = AuthWithTokenEventSchema.parse({
        ...user,
        token: verifyToken,
      });

      this._authEventsService.emitUserRegistered(emailPayload);
    } catch (error: unknown) {
      this.handlePersistenceFailure(error, {
        email: payload.email,
        stage: 'requestVerificationEmail',
      });
    }
  }

  /**
   * Validates and consumes an email verification token.
   *
   * @param payload External verification token contract validated by DTO/Zod.
   * @returns `void`.
   * @throws {BadRequestException} When token is invalid or expired.
   * @throws {ConflictException} When token purpose is invalid or user cannot be verified.
   * @throws {InternalServerErrorException} For persistence or unexpected failures.
   */
  async verifyEmail(payload: VerifyEmailInput): Promise<void> {
    let tokenPayload: Awaited<ReturnType<JwtTokenService['verifyCustomToken']>>;
    try {
      tokenPayload = await this._jwtTokenService.verifyCustomToken(payload.token);
    } catch (error: unknown) {
      this._logger.warn({ error }, 'Verification token validation failed');
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (tokenPayload.purpose !== TokenType.VERIFY_EMAIL) {
      throw new ConflictException('Token purpose is invalid');
    }

    try {
      const user = await this._authRepository.findUserById(tokenPayload.sub);

      if (!user) {
        throw new ConflictException('Invalid verification token');
      }

      if (user.emailVerifiedAt) {
        throw new ConflictException('Email is already verified');
      }

      const verifiedUser = await this._authRepository.verifyUserEmailById(user.id, new Date());

      const emailPayload = AuthEventSchema.parse(verifiedUser);

      this._authEventsService.emitEmailVerified(emailPayload);
    } catch (error: unknown) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }

      this.handlePersistenceFailure(error, {
        userId: tokenPayload.sub,
        stage: 'verifyEmail',
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
      this._logger.error({ error, ...context }, 'Email verification persistence stage failed');
      throw new InternalServerErrorException('Internal server error');
    }

    if (error instanceof Error) {
      this._logger.error({ error, ...context }, 'Email verification failed unexpectedly');
      throw new InternalServerErrorException('Internal server error');
    }

    throw error;
  }
}
