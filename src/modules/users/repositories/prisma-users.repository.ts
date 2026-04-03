import { isKnownPrismaError } from '@database/errors';
import type { Prisma } from '@/modules/database/prisma/generated/client';
import { PrismaService } from '@modules/database/services/prisma.service';
import { Injectable } from '@nestjs/common';
import { ZodError } from 'zod';
import {
  UsersContractValidationError,
  UsersPersistenceError,
  UsersPersistenceNotFoundError,
  UsersPersistenceUnexpectedError,
  UsersPersistenceUniqueConstraintError,
} from '../errors';
import type { CreateUserData, GetUsersInput, UpdateUserInput, UserEntity } from '../interfaces';
import { UserEntitySchema } from '../schemas';
import { UsersRepository } from './users.repository';

const PRISMA_UNIQUE_CONSTRAINT = 'P2002';
const PRISMA_NOT_FOUND = 'P2025';

/**
 * Prisma-based users persistence implementation.
 *
 * Prisma-specific details are isolated to this repository implementation.
 * Returned data is normalized via users Zod schemas before reaching services.
 */
@Injectable()
export class PrismaUsersRepository extends UsersRepository {
  constructor(private readonly _prismaService: PrismaService) {
    super();
  }

  /**
   * Persists a new user using Prisma.
   *
   * @param {CreateUserData} payload Persistence data for user creation.
   * @returns {Promise<UserEntity>} Created and contract-validated user.
   */
  async create(payload: CreateUserData): Promise<UserEntity> {
    try {
      const createdUser = await this._prismaService.userDbEntity.create({
        data: payload,
      });

      return UserEntitySchema.parse(createdUser);
    } catch (error: unknown) {
      this._throwPersistenceError(error, 'Persisted user contract validation failed');
    }
  }

  /**
   * Finds a user by identifier using Prisma.
   *
   * @param {string} id User identifier.
   * @returns {Promise<UserEntity | null>} Found user or `null`.
   */
  async findById(id: string): Promise<UserEntity | null> {
    try {
      const foundUser = await this._prismaService.userDbEntity.findUnique({
        where: { id },
      });

      return foundUser ? UserEntitySchema.parse(foundUser) : null;
    } catch (error: unknown) {
      this._throwPersistenceError(error, 'Persisted user contract validation failed');
    }
  }

  /**
   * Finds a user by email using Prisma.
   *
   * @param {string} email User email.
   * @returns {Promise<UserEntity | null>} Found user or `null`.
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    try {
      const foundUser = await this._prismaService.userDbEntity.findUnique({
        where: { email },
      });

      return foundUser ? UserEntitySchema.parse(foundUser) : null;
    } catch (error: unknown) {
      this._throwPersistenceError(error, 'Persisted user contract validation failed');
    }
  }

  /**
   * Lists users with pagination and filters using Prisma transaction.
   *
   * @param {GetUsersInput} filters Pagination and filtering input.
   * @returns {Promise<{ data: UserEntity[]; total: number }>} Contract-validated users and count.
   */
  async findMany(filters: GetUsersInput): Promise<{ data: UserEntity[]; total: number }> {
    try {
      const where: Prisma.UserDbEntityWhereInput = {
        ...(filters.role ? { role: filters.role } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.verified === undefined
          ? {}
          : {
              emailVerifiedAt: filters.verified ? { not: null } : null,
            }),
        ...(filters.email
          ? {
              email: {
                contains: filters.email,
                mode: 'insensitive',
              },
            }
          : {}),
        ...(filters.userName
          ? {
              userName: {
                contains: filters.userName,
                mode: 'insensitive',
              },
            }
          : {}),
      };

      const [data, total] = await this._prismaService.$transaction([
        this._prismaService.userDbEntity.findMany({
          where,
          orderBy: {
            createdAt: 'desc',
          },
          skip: filters.skip,
          take: filters.take,
        }),
        this._prismaService.userDbEntity.count({ where }),
      ]);

      return {
        data: data.map((user) => UserEntitySchema.parse(user)),
        total,
      };
    } catch (error: unknown) {
      this._throwPersistenceError(error, 'Persisted users list contract validation failed');
    }
  }

  /**
   * Updates a user by identifier using Prisma.
   *
   * @param {string} id User identifier.
   * @param {UpdateUserInput} payload Partial update payload.
   * @returns {Promise<UserEntity>} Updated and contract-validated user.
   */
  async updateById(id: string, payload: UpdateUserInput): Promise<UserEntity> {
    try {
      const updatedUser = await this._prismaService.userDbEntity.update({
        where: { id },
        data: payload,
      });

      return UserEntitySchema.parse(updatedUser);
    } catch (error: unknown) {
      this._throwPersistenceError(error, 'Persisted user contract validation failed');
    }
  }

  /**
   * Updates a user's password hash using Prisma.
   *
   * @param {string} id User identifier.
   * @param {string} password Hashed password value.
   * @returns {Promise<UserEntity>} Updated and contract-validated user.
   */
  async updatePassword(id: string, password: string): Promise<UserEntity> {
    try {
      const updatedUser = await this._prismaService.userDbEntity.update({
        where: { id },
        data: { password },
      });

      return UserEntitySchema.parse(updatedUser);
    } catch (error: unknown) {
      this._throwPersistenceError(error, 'Persisted user contract validation failed');
    }
  }

  /**
   * Maps unknown persistence errors into users persistence error hierarchy.
   *
   * @param {unknown} error Original thrown error.
   * @param {string} contractMessage Contract validation fallback message.
   * @returns {never} Always throws a mapped persistence error.
   */
  private _throwPersistenceError(error: unknown, contractMessage: string): never {
    if (error instanceof UsersPersistenceError) {
      throw error;
    }

    if (error instanceof ZodError) {
      throw new UsersContractValidationError(contractMessage, error);
    }

    if (isKnownPrismaError(error)) {
      if (error.code === PRISMA_UNIQUE_CONSTRAINT) {
        throw new UsersPersistenceUniqueConstraintError(
          'Email or userName is already in use',
          error,
        );
      }

      if (error.code === PRISMA_NOT_FOUND) {
        throw new UsersPersistenceNotFoundError('User not found', error);
      }
    }

    throw new UsersPersistenceUnexpectedError('Unexpected persistence error', error);
  }
}
