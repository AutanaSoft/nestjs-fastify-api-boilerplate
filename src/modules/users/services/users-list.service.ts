import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { handleUsersPersistenceError } from '../errors';
import type { GetUsersInput, GetUsersResponse, UserEntity } from '../interfaces';
import { UsersRepository } from '../repositories';
import { UserModelSchema } from '../schemas';

/** Handles list users use case. */
@Injectable()
export class UsersListService {
  constructor(
    private readonly _usersRepository: UsersRepository,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(UsersListService.name);
  }

  /**
   * Retrieves a paginated users list.
   *
   * The service validates each returned record against the response schema
   * before building pagination metadata.
   *
   * @param {GetUsersInput} payload Pagination and filters input.
   * @returns {Promise<GetUsersResponse>} Paginated users response.
   */
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
