import { registerAs } from '@nestjs/config';
import { z } from 'zod';

/**
 * Esquema de validación para la configuración del sistema de logging.
 * Controla el nivel de detalle y el entorno para la salida de logs.
 */
export const LoggerConfigSchema = z.object({
  /** Entorno de ejecución (el mismo que en appConfig) */
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  /** Nivel de log por defecto (log, error, warn, debug, verbose) */
  LOG_LEVEL: z.enum(['log', 'error', 'warn', 'debug', 'verbose']).default('debug'),
});

/**
 * Inferir el tipo LoggerConfig a partir del esquema de Zod.
 */
export type LoggerConfig = z.infer<typeof LoggerConfigSchema>;

/**
 * Fábrica de configuración que parsea y valida las variables de entorno para el logger.
 * @returns {LoggerConfig} El objeto de configuración validado.
 */
export const loggerConfigFactory = (): LoggerConfig => {
  return LoggerConfigSchema.parse(process.env);
};

/**
 * Registro de la configuración bajo el namespace 'loggerConfig'.
 */
export default registerAs<LoggerConfig>('loggerConfig', loggerConfigFactory);
