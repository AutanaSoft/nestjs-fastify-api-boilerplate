import authConfig from '@/config/auth.config';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import * as argon2 from 'argon2';
import { compare as compareBcrypt } from 'bcrypt';

/**
 * Centralized password hashing service using argon2.
 */
@Injectable()
export class PasswordHashService {
  constructor(
    @Inject(authConfig.KEY)
    private readonly _config: ConfigType<typeof authConfig>,
  ) {}

  async hashPassword(rawPassword: string): Promise<string> {
    return argon2.hash(rawPassword, {
      type: argon2.argon2id,
      memoryCost: this._config.AUTH_ARGON2_MEMORY_COST,
      timeCost: this._config.AUTH_ARGON2_TIME_COST,
      parallelism: this._config.AUTH_ARGON2_PARALLELISM,
      hashLength: this._config.AUTH_ARGON2_HASH_LENGTH,
    });
  }

  /**
   * Verifies password against argon2 hashes and bcrypt legacy hashes.
   */
  async verifyPassword(rawPassword: string, storedHash: string): Promise<boolean> {
    if (storedHash.startsWith('$argon2')) {
      return argon2.verify(storedHash, rawPassword);
    }

    // Compatibility path during migration to argon2.
    if (
      storedHash.startsWith('$2a$') ||
      storedHash.startsWith('$2b$') ||
      storedHash.startsWith('$2y$')
    ) {
      return compareBcrypt(rawPassword, storedHash);
    }

    return false;
  }
}
