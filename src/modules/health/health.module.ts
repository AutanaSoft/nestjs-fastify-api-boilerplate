import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { DatabaseModule } from '../database/database.module';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

/**
 * Módulo de salud del sistema.
 * Proporciona los mecanismos necesarios para monitorear la disponibilidad de la aplicación.
 */
@Module({
  imports: [TerminusModule, HttpModule, ConfigModule, DatabaseModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
