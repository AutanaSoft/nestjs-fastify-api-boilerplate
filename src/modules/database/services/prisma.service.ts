import databaseConfig from '@/config/database.config';
import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  type INestApplication,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PinoLogger } from 'nestjs-pino';
import { Prisma, PrismaClient } from '../prisma/generated/client';

/**
 * Servicio de Prisma que gestiona el ciclo de vida de la conexión a la base de datos.
 *
 * @description
 * Extiende de PrismaClient y utiliza los hooks `onModuleInit` y `onModuleDestroy`
 * de NestJS para manejar la conexión de forma automática y segura.
 * También provee utilidades para ejecución de transacciones y cierre controlado.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  /**
   * Crea una instancia de PrismaService.
   *
   * @param _config - Configuración de la base de datos inyectada.
   * @param _logger - Logger para registrar eventos de conexión.
   */
  constructor(
    @Inject(databaseConfig.KEY)
    private readonly _config: ConfigType<typeof databaseConfig>,
    private readonly _logger: PinoLogger,
  ) {
    super({
      adapter: new PrismaPg({ connectionString: _config.DATABASE_URL }),
    });
    this._logger.setContext(PrismaService.name);
  }

  /**
   * Inicializa la conexión con la base de datos al arrancar el módulo.
   *
   * @returns Una promesa que se resuelve cuando la conexión es exitosa.
   * @throws Error si no se puede establecer la conexión inicial.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this._logger.info('✅ Database connection established successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this._logger.error('❌ Failed to connect to database', { error: errorMessage });
      throw error;
    }
  }

  /**
   * Cierra la conexión con la base de datos al apagar el módulo.
   *
   * @returns Una promesa que se resuelve cuando la conexión se cierra.
   */
  async onModuleDestroy(): Promise<void> {
    try {
      await this.$disconnect();
      this._logger.info('Database connection closed');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this._logger.error('Error closing database connection', { error: errorMessage });
    }
  }

  /**
   * Habilita los hooks de cierre de la aplicación para NestJS.
   *
   * @description
   * Escucha las señales de terminación del proceso (SIGINT, SIGTERM) para
   * cerrar la instancia de NestJS y liberar recursos de base de datos.
   *
   * @param app - La instancia de la aplicación NestJS.
   */
  enableShutdownHooks(app: INestApplication): void {
    this.$on('beforeExit' as never, () => {
      void app.close();
    });
  }

  /**
   * Ejecuta una serie de operaciones dentro de una transacción de base de datos.
   *
   * @template T - El tipo de retorno de la función transaccional.
   * @param fn - Función que recibe el cliente de transacción y retorna una promesa.
   * @returns El resultado de la operación transaccional.
   *
   * @example
   * ```typescript
   * await this.prisma.executeTransaction(async (tx) => {
   *   await tx.user.create({ data: userData });
   *   await tx.profile.create({ data: profileData });
   * });
   * ```
   */
  async executeTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.$transaction(fn);
  }
}
