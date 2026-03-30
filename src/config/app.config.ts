import { registerAs } from '@nestjs/config';
import { z } from 'zod';

/**
 * Esquema de validación para la configuración principal de la aplicación.
 * Define las variables de entorno relacionadas con el servidor y metadatos del proyecto.
 */
export const AppConfigSchema = z.object({
  /** Entorno de ejecución de la aplicación */
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  /** Nombre de la aplicación */
  APP_NAME: z.string().default('NestJS API'),
  /** Descripción de la aplicación */
  APP_DESCRIPTION: z.string().default('NestJS API REST Full'),
  /** Versión actual de la aplicación */
  APP_VERSION: z.string().default('1.0.0'),
  /** Puerto en el que escuchará el servidor */
  APP_PORT: z.coerce.number().default(3000),
  /** Host en el que se ejecuta la aplicación */
  APP_HOST: z.string().default('localhost'),
  /** Prefijo global para todas las rutas de la API */
  APP_GLOBAL_PREFIX: z
    .string()
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  /** Nombre del encabezado para el ID de correlación */
  APP_CORRELATION_ID: z.string().default('x-correlation-id'),
  /** URL del frontend */
  APP_FRONTEND_URL: z.url().default('http://localhost:3000'),
});

/**
 * Inferir el tipo AppConfig a partir del esquema de Zod.
 */
export type AppConfig = z.infer<typeof AppConfigSchema>;

/**
 * Fábrica de configuración que parsea y valida las variables de entorno.
 * @returns {AppConfig} El objeto de configuración validado.
 */
export const appConfigFactory = (): AppConfig => {
  return AppConfigSchema.parse(process.env);
};

/**
 * Registro de la configuración bajo el namespace 'appConfig'.
 */
export default registerAs<AppConfig>('appConfig', appConfigFactory);
