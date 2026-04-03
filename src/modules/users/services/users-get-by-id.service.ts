import { Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { handleUsersPersistenceError } from '../errors';
import type { UserEntity } from '../interfaces';
import { UsersRepository } from '../repositories';

/** Handles get user by id use case. */
@Injectable()
export class UsersGetByIdService {
  constructor(
    private readonly _usersRepository: UsersRepository,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(UsersGetByIdService.name);
  }

  /**
   * Retrieves a user by identifier.
   *
   * @param {string} id User identifier.
   * @returns {Promise<UserEntity>} Found user entity.
   * @throws {NotFoundException} When the user does not exist.
   */
  async getUserById(id: string): Promise<UserEntity> {
    let user: UserEntity | null;
    try {
      user = await this._usersRepository.findById(id);
    } catch (error: unknown) {
      handleUsersPersistenceError({
        error,
        logger: this._logger,
        fallbackMessage: 'Could not get user by id',
        userId: id,
      });
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
