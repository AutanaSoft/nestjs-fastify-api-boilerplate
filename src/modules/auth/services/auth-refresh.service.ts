import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import {
  AuthContractValidationError,
  AuthPersistenceNotFoundError,
  AuthPersistenceUnexpectedError,
  AuthPersistenceUniqueConstraintError,
} from '../errors';
import type { AuthSession, RefreshInput } from '../interfaces';
import { RefreshTokenService } from './refresh-token.service';

/**
 * Handles token refresh orchestration using the refresh token lifecycle service.
 */
@Injectable()
export class AuthRefreshService {
  constructor(
    private readonly _refreshTokenService: RefreshTokenService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(AuthRefreshService.name);
  }

  /**
   * Rotates an existing refresh token and returns a new auth session payload.
   *
   * @param payload External refresh input contract validated by DTO/Zod.
   * @returns New access/refresh token pair with metadata.
   * @throws {UnauthorizedException} When refresh token is invalid, expired, revoked, or session is revoked.
   * @throws {InternalServerErrorException} For persistence or unexpected failures.
   */
  async refresh(payload: RefreshInput): Promise<AuthSession> {
    try {
      return this._refreshTokenService.rotateTokens(payload.refreshToken);
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      if (
        error instanceof AuthContractValidationError ||
        error instanceof AuthPersistenceUnexpectedError ||
        error instanceof AuthPersistenceNotFoundError ||
        error instanceof AuthPersistenceUniqueConstraintError
      ) {
        this._logger.error({ error }, 'Refresh persistence stage failed');
      } else {
        this._logger.error({ error }, 'Refresh failed unexpectedly');
      }

      throw new InternalServerErrorException('Internal server error');
    }
  }
}
