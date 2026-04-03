import type { CreateUserData, GetUsersInput, UpdateUserInput, UserEntity } from '../interfaces';

/**
 * Abstract contract for users persistence.
 */
export abstract class UsersRepository {
  /**
   * Persists a new user entity.
   *
   * @param {CreateUserData} payload Persistence data for user creation.
   * @returns {Promise<UserEntity>} Created user entity.
   */
  abstract create(payload: CreateUserData): Promise<UserEntity>;

  /**
   * Finds a user by identifier.
   *
   * @param {string} id User identifier.
   * @returns {Promise<UserEntity | null>} User when found, otherwise `null`.
   */
  abstract findById(id: string): Promise<UserEntity | null>;

  /**
   * Finds a user by email.
   *
   * @param {string} email User email.
   * @returns {Promise<UserEntity | null>} User when found, otherwise `null`.
   */
  abstract findByEmail(email: string): Promise<UserEntity | null>;

  /**
   * Finds users using pagination and filters.
   *
   * @param {GetUsersInput} filters Pagination and filtering input.
   * @returns {Promise<{ data: UserEntity[]; total: number }>} Matched users and total count.
   */
  abstract findMany(filters: GetUsersInput): Promise<{ data: UserEntity[]; total: number }>;

  /**
   * Updates a user by identifier.
   *
   * @param {string} id User identifier.
   * @param {UpdateUserInput} payload Partial user update payload.
   * @returns {Promise<UserEntity>} Updated user entity.
   */
  abstract updateById(id: string, payload: UpdateUserInput): Promise<UserEntity>;

  /**
   * Updates a user's password hash.
   *
   * @param {string} id User identifier.
   * @param {string} password Hashed password value.
   * @returns {Promise<UserEntity>} Updated user entity.
   */
  abstract updatePassword(id: string, password: string): Promise<UserEntity>;
}
