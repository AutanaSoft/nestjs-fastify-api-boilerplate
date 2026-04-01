import { EmailType } from '@/shared/schemas';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { hash, verify } from 'argon2';
import { PinoLogger } from 'nestjs-pino';
import { handleUsersPersistenceError } from '../errors/users-persistence-error.helper';
import { UsersRepository } from '../repositories';
import { UserEntitySchema, type UpdatePasswordInput, type UserEntity } from '../schemas';
import { UsersEventsService } from './users-events.service';

/**
 * Handles security-related use cases for users.
 */
@Injectable()
export class UsersSecurityService {
  constructor(
    private readonly _usersRepository: UsersRepository,
    private readonly _usersEventsService: UsersEventsService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(UsersSecurityService.name);
  }

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

    const isCurrentPasswordValid = await verify(user.password, payload.current);

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is invalid');
    }

    const newPasswordHash = await hash(payload.new);

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

    const parsedUser = UserEntitySchema.safeParse(updatedUser);

    if (!parsedUser.success) {
      this._logger.error(
        { error: parsedUser.error, userId: updatedUser.id },
        'Password-updated user failed output schema validation',
      );
      throw new InternalServerErrorException('Internal server error');
    }

    this._usersEventsService.emitUserPasswordUpdated(parsedUser.data);
  }

  async verifyEmail(email: EmailType): Promise<void> {
    let verifiedUser: UserEntity;
    try {
      verifiedUser = await this._usersRepository.verifyEmail(email, new Date());
    } catch (error: unknown) {
      handleUsersPersistenceError({
        error,
        logger: this._logger,
        fallbackMessage: 'Could not verify email',
      });
    }

    const parsedUser = UserEntitySchema.safeParse(verifiedUser);

    if (!parsedUser.success) {
      this._logger.error(
        { error: parsedUser.error, userId: verifiedUser.id },
        'Email-verified user failed output schema validation',
      );
      throw new InternalServerErrorException('Internal server error');
    }

    this._usersEventsService.emitUserEmailVerified(parsedUser.data);
  }
}
