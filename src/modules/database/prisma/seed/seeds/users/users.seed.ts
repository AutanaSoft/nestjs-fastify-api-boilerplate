// createHash removed as it is no longer used
import type { Prisma, PrismaClient } from '../../../generated/client';
import { UserRole, UserStatus } from '../../../generated/client';

// getEmailHash removed as it is no longer used

/**
 * Seed de usuarios para desarrollo y testing
 *
 * @description
 * Crea usuarios de prueba con diferentes roles y estados.
 * Usa upsert para garantizar idempotencia.
 */
export async function seedUsers(prisma: PrismaClient): Promise<void> {
  console.log('  📝 Seeding users...');

  const users: Prisma.UserDbEntityCreateInput[] = [
    {
      userName: 'admin',
      email: 'admin@example.com',
      password: '$2b$10$YourHashedPasswordHere',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
    {
      userName: 'user',
      email: 'user@example.com',
      password: '$2b$10$YourHashedPasswordHere',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
    {
      userName: 'guest',
      email: 'guest@example.com',
      password: '$2b$10$YourHashedPasswordHere',
      role: UserRole.GUEST,
      status: UserStatus.REGISTERED,
    },
    {
      userName: 'pending',
      email: 'pending@example.com',
      password: '$2b$10$YourHashedPasswordHere',
      role: UserRole.USER,
      status: UserStatus.PENDING_PAYMENT,
      emailVerifiedAt: new Date(),
    },
    {
      userName: 'frozen_payment',
      email: 'frozen_payment@example.com',
      password: '$2b$10$YourHashedPasswordHere',
      role: UserRole.USER,
      status: UserStatus.PAYMENT_FROZEN,
      emailVerifiedAt: new Date(),
    },
    {
      userName: 'banned',
      email: 'banned@example.com',
      password: '$2b$10$YourHashedPasswordHere',
      role: UserRole.USER,
      status: UserStatus.BANNED,
      emailVerifiedAt: new Date(),
    },
  ];

  await prisma.$transaction(async (tx) => {
    for (const user of users) {
      await tx.userDbEntity.upsert({
        where: { email: user.email },
        update: {},
        create: user,
      });
    }
  });

  console.log('  ✅ Users seeded successfully');
}
