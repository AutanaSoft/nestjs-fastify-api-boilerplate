import type { Prisma, PrismaClient } from '../../../generated/client';
import { randomUUID } from 'crypto';

/**
 * Seed de AppSettings para desarrollo y testing
 *
 * @description
 * Crea las configuraciones iniciales del sistema, como por ejemplo EMAIL_SETTINGS.
 * Usa upsert para garantizar idempotencia.
 */
export async function seedSettings(prisma: PrismaClient): Promise<void> {
  console.log('  📝 Seeding App Settings...');

  const settings: Prisma.AppSettingCreateInput[] = [
    {
      id: randomUUID(),
      key: 'EMAIL_SETTINGS',
      isSystem: true,
      value: {
        activeProvider: 'resend',
        defaultFrom: 'noreply@example.com',
        resend: {
          apiKey: 're_dummy_seed_api_key_autanasoft',
        },
        smtp: {
          host: 'smtp.example.com',
          port: 587,
          secure: false,
          user: 'test@example.com',
          pass: 'fake_password',
        },
      },
    },
  ];

  await prisma.$transaction(async (tx) => {
    for (const setting of settings) {
      await tx.appSetting.upsert({
        where: { key: setting.key },
        update: {},
        create: setting,
      });
    }
  });

  console.log('  ✅ Settings seeded successfully');
}
