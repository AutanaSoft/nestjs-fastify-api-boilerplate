import { PasswordHashService } from '@modules/security/services';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { handleUsersPersistenceError } from '../errors';
import type { CreateUserInput, UserEntity } from '../interfaces';
import { UsersRepository } from '../repositories';
import { CreateUserDataSchema } from '../schemas';
import { UsersEventsService } from './users-events.service';

/** Handles user creation use case. */
@Injectable()
export class UsersCreateService {
  constructor(
    private readonly _usersRepository: UsersRepository,
    private readonly _usersEventsService: UsersEventsService,
    private readonly _passwordHashService: PasswordHashService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(UsersCreateService.name);
  }

  /**
   * Creates a new user from validated input data.
   *
   * The service hashes the incoming password before persistence and emits
   * `USER.CREATED` once the operation succeeds.
   *
   * @param {CreateUserInput} payload Input data to create a user.
   * @returns {Promise<UserEntity>} Persisted user entity.
   */
  async createUser(payload: CreateUserInput): Promise<UserEntity> {
    const passwordHash = await this._passwordHashService.hashPassword(payload.password);

    const createData = CreateUserDataSchema.parse({
      ...payload,
      password: passwordHash,
    });

    let createdUser: UserEntity;
    try {
      createdUser = await this._usersRepository.create(createData);
    } catch (error: unknown) {
      handleUsersPersistenceError({
        error,
        logger: this._logger,
        fallbackMessage: 'Could not create user',
      });
    }

    this._usersEventsService.emitUserCreated(createdUser);

    return createdUser;
  }
}
