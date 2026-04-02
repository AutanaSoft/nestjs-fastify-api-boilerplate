import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PasswordHashService } from '@modules/security/services';
import { PinoLogger } from 'nestjs-pino';
import {
  AuthContractValidationError,
  AuthPersistenceNotFoundError,
  AuthPersistenceUnexpectedError,
  AuthPersistenceUniqueConstraintError,
} from '../errors';
import { AuthRepository } from '../repositories';
import { USER_STATUSES } from '../schemas';
import type { AuthSession, SignInInput } from '../interfaces';
import { RefreshTokenService } from './refresh-token.service';

/**
 * Handles user sign-in by validating credentials and issuing session tokens.
 */
@Injectable()
export class AuthSignInService {
  constructor(
    private readonly _authRepository: AuthRepository,
    private readonly _passwordHashService: PasswordHashService,
    private readonly _refreshTokenService: RefreshTokenService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(AuthSignInService.name);
  }

  /**
   * Authenticates a user with email and password.
   *
   * Flow:
   * 1. Resolve user by email.
   * 2. Verify password hash.
   * 3. Enforce sign-in status restrictions.
   * 4. Issue access/refresh tokens.
   *
   * @param payload External sign-in contract validated by DTO/Zod.
   * @returns Initial auth session payload.
   * @throws {UnauthorizedException} When credentials are invalid.
   * @throws {ForbiddenException} When user status does not allow sign-in.
   * @throws {InternalServerErrorException} For persistence or unexpected failures.
   */
  async signIn(payload: SignInInput): Promise<AuthSession> {
    try {
      const user = await this._authRepository.findUserByEmail(payload.email);

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await this._passwordHashService.verifyPassword(
        payload.password,
        user.password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (user.status === USER_STATUSES.BANNED || user.status === USER_STATUSES.FROZEN) {
        throw new ForbiddenException('User is not allowed to sign in');
      }

      return this._refreshTokenService.issueTokens(user);
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }

      if (
        error instanceof AuthContractValidationError ||
        error instanceof AuthPersistenceUnexpectedError ||
        error instanceof AuthPersistenceNotFoundError ||
        error instanceof AuthPersistenceUniqueConstraintError
      ) {
        this._logger.error({ error, email: payload.email }, 'Sign-in persistence stage failed');
      } else {
        this._logger.error({ error, email: payload.email }, 'Sign-in failed unexpectedly');
      }

      throw new InternalServerErrorException('Internal server error');
    }
  }
}
