import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client';
import { seedSettings } from './seeds/settings/settings.seed';
import { seedUsers } from './seeds/users/users.seed';

/**
 * Seed Orchestrator
 *
 * @description
 * Coordina la ejecución de todos los seeds individuales.
 * Ejecuta seeds en orden respetando dependencias entre tablas.
 *
 * @example
 * Para ejecutar: pnpm prisma:seed
 */

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Ejecutar seeds en orden (respetando dependencias)
    await seedSettings(prisma);
    await seedUsers(prisma);

    // Agregar más seeds aquí en el futuro
    // await seedPosts(prisma);
    // await seedComments(prisma);

    console.log('\n✅ Database seeding completed successfully');
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
