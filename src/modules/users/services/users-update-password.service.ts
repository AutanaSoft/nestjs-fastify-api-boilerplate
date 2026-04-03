import { PasswordHashService } from '@modules/security/services';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { handleUsersPersistenceError } from '../errors';
import type { UpdatePasswordInput, UserEntity } from '../interfaces';
import { UsersRepository } from '../repositories';
import { UsersEventsService } from './users-events.service';

/** Handles update password use case. */
@Injectable()
export class UsersUpdatePasswordService {
  constructor(
    private readonly _usersRepository: UsersRepository,
    private readonly _usersEventsService: UsersEventsService,
    private readonly _passwordHashService: PasswordHashService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(UsersUpdatePasswordService.name);
  }

  /**
   * Updates a user's password.
   *
   * The service verifies the current password before hashing and storing
   * the new password, then emits `USER.UPDATED_PASSWORD`.
   *
   * @param {string} id User identifier.
   * @param {UpdatePasswordInput} payload Password update payload.
   * @returns {Promise<void>} Resolves when password update completes.
   */
  async updatePassword(id: string, payload: UpdatePasswordInput): Promise<void> {
    let user: UserEntity | null;
    try {
      user = await this._usersRepository.findById(id);
    } catch (error: unknown) {
      handleUsersPersistenceError({
        error,
        logger: this._logger,
        fallbackMessage: 'Could not find user for password update',
        userId: id,
      });
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await this._passwordHashService.verifyPassword(
      payload.current,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is invalid');
    }

    const newPasswordHash = await this._passwordHashService.hashPassword(payload.new);

    let updatedUser: UserEntity;
    try {
      updatedUser = await this._usersRepository.updatePassword(id, newPasswordHash);
    } catch (error: unknown) {
      handleUsersPersistenceError({
        error,
        logger: this._logger,
        fallbackMessage: 'Could not update password',
        userId: id,
      });
    }

    this._usersEventsService.emitUserPasswordUpdated(updatedUser);
  }
}
