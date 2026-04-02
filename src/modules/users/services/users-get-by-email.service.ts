import { Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { handleUsersPersistenceError } from '../errors';
import type { UserEntity } from '../interfaces';
import { UsersRepository } from '../repositories';

/** Handles get user by email use case. */
@Injectable()
export class UsersGetByEmailService {
  constructor(
    private readonly _usersRepository: UsersRepository,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(UsersGetByEmailService.name);
  }

  async getUserByEmail(email: string): Promise<UserEntity> {
    let user: UserEntity | null;
    try {
      user = await this._usersRepository.findByEmail(email);
    } catch (error: unknown) {
      handleUsersPersistenceError({
        error,
        logger: this._logger,
        fallbackMessage: 'Could not get user by email',
      });
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
