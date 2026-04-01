import { Injectable, NotFoundException } from '@nestjs/common';
import type { MeResponse } from '../schemas';
import { AuthRepository } from '../repositories';

/**
 * Handles retrieval of authenticated user profile.
 */
@Injectable()
export class AuthMeService {
  constructor(private readonly _authRepository: AuthRepository) {}

  async getMe(userId: string): Promise<MeResponse> {
    const user = await this._authRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      userName: user.userName,
      role: user.role,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
