import { Injectable } from '@nestjs/common';
import type { CurrentUser } from '../interfaces';
import { RefreshTokenService } from './refresh-token.service';

/**
 * Handles sign-out and session revocation.
 */
@Injectable()
export class AuthSignOutService {
  constructor(private readonly _refreshTokenService: RefreshTokenService) {}

  async signOut(user: CurrentUser): Promise<void> {
    await this._refreshTokenService.revokeSession(user.sessionId);
  }
}
