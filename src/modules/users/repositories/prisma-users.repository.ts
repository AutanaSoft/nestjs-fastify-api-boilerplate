import type { Prisma, UserDbEntity } from '@/modules/database/prisma/generated/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@modules/database/services/prisma.service';
import type { CreateUserInput, GetUsersInput, UpdateUserInput } from '../schemas';
import { UsersRepository } from './users.repository';

/**
 * Prisma-based users persistence implementation.
 */
@Injectable()
export class PrismaUsersRepository extends UsersRepository {
  constructor(private readonly _prismaService: PrismaService) {
    super();
  }

  async create(payload: CreateUserInput): Promise<UserDbEntity> {
    return this._prismaService.userDbEntity.create({
      data: payload,
    });
  }

  async findById(id: string): Promise<UserDbEntity | null> {
    return this._prismaService.userDbEntity.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<UserDbEntity | null> {
    return this._prismaService.userDbEntity.findUnique({
      where: { email },
    });
  }

  async findMany(filters: GetUsersInput): Promise<{ data: UserDbEntity[]; total: number }> {
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

    return { data, total };
  }

  async updateById(id: string, payload: UpdateUserInput): Promise<UserDbEntity> {
    return this._prismaService.userDbEntity.update({
      where: { id },
      data: payload,
    });
  }

  async updatePassword(id: string, password: string): Promise<UserDbEntity> {
    return this._prismaService.userDbEntity.update({
      where: { id },
      data: { password },
    });
  }

  async verifyEmail(email: string, verifiedAt: Date): Promise<UserDbEntity> {
    return this._prismaService.userDbEntity.update({
      where: { email },
      data: {
        emailVerifiedAt: verifiedAt,
      },
    });
  }
}
