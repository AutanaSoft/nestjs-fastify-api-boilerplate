import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { AUTH_TOKEN_PURPOSES } from '../constants';
import { AuthRepository } from '../repositories';
import type { ForgotPasswordInput, ResetPasswordInput } from '../schemas';
import { JwtTokenService } from './jwt-token.service';
import { PasswordHashService } from './password-hash.service';
import { AuthEventsService } from './auth-events.service';

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
  ) {}

  async forgotPassword(payload: ForgotPasswordInput): Promise<void> {
    const user = await this._authRepository.findUserByEmail(payload.email);

    if (!user) {
      return;
    }

    const resetToken = await this._jwtTokenService.signCustomToken({
      userId: user.id,
      email: user.email,
      userName: user.userName,
      purpose: AUTH_TOKEN_PURPOSES.RESET_PASSWORD,
    });

    this._authEventsService.emitPasswordResetRequested({
      email: user.email,
      userName: user.userName,
      token: resetToken,
    });
  }

  async resetPassword(payload: ResetPasswordInput): Promise<void> {
    if (payload.newPassword !== payload.confirmPassword) {
      throw new BadRequestException('newPassword and confirmPassword must match');
    }

    let tokenPayload: Awaited<ReturnType<JwtTokenService['verifyCustomToken']>>;
    try {
      tokenPayload = await this._jwtTokenService.verifyCustomToken(payload.token);
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (tokenPayload.purpose !== AUTH_TOKEN_PURPOSES.RESET_PASSWORD) {
      throw new ConflictException('Token purpose is invalid');
    }

    const user = await this._authRepository.findUserById(tokenPayload.sub);

    if (!user) {
      throw new ConflictException('Invalid reset token');
    }

    const passwordHash = await this._passwordHashService.hashPassword(payload.newPassword);
    const updatedUser = await this._authRepository.updateUserPasswordById(user.id, passwordHash);

    this._authEventsService.emitPasswordReset({
      email: updatedUser.email,
      userName: updatedUser.userName,
    });
  }
}
