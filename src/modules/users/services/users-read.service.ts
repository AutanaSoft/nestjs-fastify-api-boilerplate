import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { handleUsersPersistenceError } from '../errors/users-persistence-error.helper';
import { UsersRepository } from '../repositories';
import {
  UserEntitySchema,
  UserModelSchema,
  type GetUsersInput,
  type GetUsersResponse,
  type UserEntity,
} from '../schemas';

/**
 * Handles read use cases for users.
 */
@Injectable()
export class UsersReadService {
  constructor(
    private readonly _usersRepository: UsersRepository,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(UsersReadService.name);
  }

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

    const parsedUser = UserEntitySchema.safeParse(user);

    if (!parsedUser.success) {
      this._logger.error(
        { error: parsedUser.error, userId: user.id },
        'Fetched user by id failed output schema validation',
      );
      throw new InternalServerErrorException('Internal server error');
    }

    return parsedUser.data;
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

    const parsedUser = UserEntitySchema.safeParse(user);

    if (!parsedUser.success) {
      this._logger.error(
        { error: parsedUser.error, userEmail: email },
        'Fetched user by email failed output schema validation',
      );
      throw new InternalServerErrorException('Internal server error');
    }

    return parsedUser.data;
  }

  async getUsers(payload: GetUsersInput): Promise<GetUsersResponse> {
    let data: UserEntity[];
    let total: number;
    try {
      const result = await this._usersRepository.findMany(payload);
      data = result.data;
      total = result.total;
    } catch (error: unknown) {
      handleUsersPersistenceError({
        error,
        logger: this._logger,
        fallbackMessage: 'Could not list users',
      });
    }

    const sanitizedData = data.map((user) => {
      const parsed = UserModelSchema.safeParse(user);

      if (!parsed.success) {
        this._logger.error(
          { error: parsed.error, userId: user.id },
          'Listed user failed output schema validation',
        );
        throw new InternalServerErrorException('Internal server error');
      }

      return parsed.data;
    });

    const page = Math.floor(payload.skip / payload.take) + 1;
    const count = sanitizedData.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / payload.take);
    const start = count === 0 ? 0 : payload.skip;
    const end = count === 0 ? 0 : payload.skip + count - 1;

    return {
      data: sanitizedData,
      meta: {
        total,
        count,
        page,
        totalPages,
        start,
        end,
      },
    };
  }
}
