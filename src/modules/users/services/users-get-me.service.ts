import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { UserEntity } from '../interfaces';
import { UsersGetByIdService } from './users-get-by-id.service';

/**
 * Handles current authenticated user retrieval.
 */
@Injectable()
export class UsersGetMeService {
  constructor(
    private readonly _usersGetByIdService: UsersGetByIdService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(UsersGetMeService.name);
  }

  /**
   * Retrieves the authenticated user by identifier.
   *
   * Delegates to the canonical get-by-id use case to keep not-found and
   * persistence error handling centralized in a single service.
   */
  async getMe(userId: string): Promise<UserEntity> {
    return this._usersGetByIdService.getUserById(userId);
  }
}
