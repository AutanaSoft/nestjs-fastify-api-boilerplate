import { Injectable } from '@nestjs/common';
import type { AuthSession, RefreshInput } from '../schemas';
import { RefreshTokenService } from './refresh-token.service';

/**
 * Handles token refresh flow.
 */
@Injectable()
export class AuthRefreshService {
  constructor(private readonly _refreshTokenService: RefreshTokenService) {}

  async refresh(payload: RefreshInput): Promise<AuthSession> {
    return this._refreshTokenService.rotateTokens(payload.refreshToken);
  }
}
