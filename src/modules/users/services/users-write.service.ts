import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { hash } from 'argon2';
import { PinoLogger } from 'nestjs-pino';
import { handleUsersPersistenceError } from '../errors/users-persistence-error.helper';
import { UsersRepository } from '../repositories';
import {
  UserEntitySchema,
  type CreateUserInput,
  type UpdateUserInput,
  type UserEntity,
} from '../schemas';
import { UsersEventsService } from './users-events.service';

/**
 * Handles write use cases for users.
 */
@Injectable()
export class UsersWriteService {
  constructor(
    private readonly _usersRepository: UsersRepository,
    private readonly _usersEventsService: UsersEventsService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(UsersWriteService.name);
  }

  async createUser(payload: CreateUserInput): Promise<UserEntity> {
    const passwordHash = await hash(payload.password);

    let createdUser: UserEntity;
    try {
      createdUser = await this._usersRepository.create({
        email: payload.email,
        password: passwordHash,
        userName: payload.userName,
        role: payload.role,
        status: payload.status,
      });
    } catch (error: unknown) {
      handleUsersPersistenceError({
        error,
        logger: this._logger,
        fallbackMessage: 'Could not create user',
      });
    }

    const parsedUser = UserEntitySchema.safeParse(createdUser);

    if (!parsedUser.success) {
      this._logger.error(
        { error: parsedUser.error, userId: createdUser.id },
        'Created user failed output schema validation',
      );
      throw new InternalServerErrorException('Internal server error');
    }

    this._usersEventsService.emitUserCreated(parsedUser.data);

    return parsedUser.data;
  }

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

    const parsedUser = UserEntitySchema.safeParse(updatedUser);

    if (!parsedUser.success) {
      this._logger.error(
        { error: parsedUser.error, userId: updatedUser.id },
        'Updated user failed output schema validation',
      );
      throw new InternalServerErrorException('Internal server error');
    }

    // Currently there is no domain event bound for generic profile updates.

    return parsedUser.data;
  }
}
