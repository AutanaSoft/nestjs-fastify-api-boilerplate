import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthCheckResult,
  HealthCheckService,
  HttpHealthIndicator,
  MicroserviceHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { Transport } from '@nestjs/microservices';
import { PrismaService } from '../database/services/prisma.service';

/**
 * Servicio encargado de la lógica para realizar las comprobaciones de salud del sistema.
 * Utiliza NestJS Terminus para verificar el estado de diversas dependencias.
 */
@Injectable()
export class HealthService {
  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly microservice: MicroserviceHealthIndicator,
    private readonly prisma: PrismaHealthIndicator,
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Realiza una comprobación de salud de la aplicación y sus dependencias externas.
   *
   * @returns {Promise<HealthCheckResult>} El resultado de la comprobación de salud.
   */
  async check(): Promise<HealthCheckResult> {
    const redisHost = this.configService.get<string>('emailConfig.redisHost');
    const redisPort = this.configService.get<number>('emailConfig.redisPort');

    return this.health.check([
      () => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
      () => this.prisma.pingCheck('database', this.prismaService),
      () =>
        this.microservice.pingCheck('redis', {
          transport: Transport.REDIS,
          options: {
            host: redisHost,
            port: redisPort,
          },
        }),
    ]);
  }
}
