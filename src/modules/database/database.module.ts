import { Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';

/**
 * Módulo de base de datos que encapsula la configuración y servicios de Prisma ORM.
 *
 * @description
 * Provee y exporta el `PrismaService` para facilitar el acceso a la base de datos PostgreSQL.
 * Este módulo está diseñado para ser importado por otros módulos funcionales que requieran
 * interactuar con la persistencia de datos. No es un módulo global.
 */
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
