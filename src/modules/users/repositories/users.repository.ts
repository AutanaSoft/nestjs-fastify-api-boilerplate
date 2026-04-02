import type { CreateUserData, GetUsersInput, UpdateUserInput, UserEntity } from '../interfaces';

/**
 * Abstract contract for users persistence.
 */
export abstract class UsersRepository {
  abstract create(payload: CreateUserData): Promise<UserEntity>;
  abstract findById(id: string): Promise<UserEntity | null>;
  abstract findByEmail(email: string): Promise<UserEntity | null>;
  abstract findMany(filters: GetUsersInput): Promise<{ data: UserEntity[]; total: number }>;
  abstract updateById(id: string, payload: UpdateUserInput): Promise<UserEntity>;
  abstract updatePassword(id: string, password: string): Promise<UserEntity>;
}
