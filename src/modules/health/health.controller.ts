import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckResult } from '@nestjs/terminus';
import { HealthService } from './health.service';

/**
 * Controlador encargado de exponer los endpoints de salud del sistema (Health Checks).
 * Permite monitorear el estado de la aplicación y sus dependencias (base de datos, etc.).
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Realiza una comprobación completa de la salud del sistema utilizando NestJS Terminus.
   * Verifica la disponibilidad de la base de datos y otros servicios críticos.
   *
   * @returns {Promise<HealthCheckResult>} El resultado detallado de la comprobación de salud.
   */
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Realizar comprobación de salud del sistema' })
  @ApiResponse({
    status: 200,
    description: 'El sistema está operativo y todas las dependencias están saludables.',
    type: Object,
  })
  async check(): Promise<HealthCheckResult> {
    return this.healthService.check();
  }

  /**
   * Endpoint simple para verificar la conectividad con el servidor.
   * Útil para pruebas rápidas de disponibilidad de red.
   *
   * @returns {string} Retorna la cadena "pong".
   */
  @Get('ping')
  @ApiOperation({ summary: 'Comprobación de ping simple' })
  @ApiResponse({
    status: 200,
    description: 'Retorna "pong" si el servidor es accesible.',
    type: String,
  })
  ping(): string {
    return 'pong';
  }
}
