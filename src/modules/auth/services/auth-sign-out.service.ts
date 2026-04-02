import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import {
  AuthContractValidationError,
  AuthPersistenceNotFoundError,
  AuthPersistenceUnexpectedError,
  AuthPersistenceUniqueConstraintError,
} from '../errors';
import type { CurrentUser } from '../interfaces';
import { RefreshTokenService } from './refresh-token.service';

/**
 * Handles user sign-out by revoking the current session token family.
 */
@Injectable()
export class AuthSignOutService {
  constructor(
    private readonly _refreshTokenService: RefreshTokenService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(AuthSignOutService.name);
  }

  /**
   * Revokes the authenticated user session and its refresh tokens.
   *
   * @param user Authenticated user context with session identifier.
   * @returns `void`.
   * @throws {InternalServerErrorException} For persistence or unexpected failures.
   */
  async signOut(user: CurrentUser): Promise<void> {
    try {
      await this._refreshTokenService.revokeSession(user.sessionId);
    } catch (error: unknown) {
      if (
        error instanceof AuthContractValidationError ||
        error instanceof AuthPersistenceUnexpectedError ||
        error instanceof AuthPersistenceNotFoundError ||
        error instanceof AuthPersistenceUniqueConstraintError
      ) {
        this._logger.error(
          { error, sessionId: user.sessionId },
          'Sign-out persistence stage failed',
        );
      } else {
        this._logger.error({ error, sessionId: user.sessionId }, 'Sign-out failed unexpectedly');
      }

      throw new InternalServerErrorException('Internal server error');
    }
  }
}
