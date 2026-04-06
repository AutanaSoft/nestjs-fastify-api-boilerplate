import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { handleUsersPersistenceError } from '../errors';
import type { UpdateUserInput, UserEntity } from '../interfaces';
import { UsersRepository } from '../repositories';
import { UsersEventsService } from './users-events.service';

/** Handles user profile update use case. */
@Injectable()
export class UsersUpdateService {
  constructor(
    private readonly _usersRepository: UsersRepository,
    private readonly _usersEventsService: UsersEventsService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(UsersUpdateService.name);
  }

  /**
   * Updates a user profile by identifier.
   *
   * @param {string} id User identifier.
   * @param {UpdateUserInput} payload Partial profile update data.
   * @returns {Promise<UserEntity>} Updated user entity.
   */
  async updateUser(id: string, payload: UpdateUserInput): Promise<UserEntity> {
    let updatedUser: UserEntity;
    try {
      updatedUser = await this._usersRepository.updateById(id, payload);
    } catch (error: unknown) {
      handleUsersPersistenceError({
        error,
        logger: this._logger,
        fallbackMessage: 'Could not update user',
        userId: id,
      });
    }

    this._usersEventsService.emitUserUpdated(updatedUser);

    return updatedUser;
  }
}
