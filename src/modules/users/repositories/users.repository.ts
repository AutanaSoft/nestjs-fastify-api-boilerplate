import type { UserDbEntity } from '@/modules/database/prisma/generated/client';
import type { CreateUserInput, GetUsersInput, UpdateUserInput } from '../schemas';

/**
 * Abstract contract for users persistence.
 */
export abstract class UsersRepository {
  abstract create(payload: CreateUserInput): Promise<UserDbEntity>;
  abstract findById(id: string): Promise<UserDbEntity | null>;
  abstract findByEmail(email: string): Promise<UserDbEntity | null>;
  abstract findMany(filters: GetUsersInput): Promise<{ data: UserDbEntity[]; total: number }>;
  abstract updateById(id: string, payload: UpdateUserInput): Promise<UserDbEntity>;
  abstract updatePassword(id: string, password: string): Promise<UserDbEntity>;
  abstract verifyEmail(email: string, verifiedAt: Date): Promise<UserDbEntity>;
}
