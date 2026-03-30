import { registerAs } from '@nestjs/config';
import { z } from 'zod';

/**
 * Esquema de validación para las variables de entorno de la base de datos.
 */
export const DatabaseConfigSchema = z.object({
  /** URL de conexión a la base de datos (PostgreSQL) */
  DATABASE_URL: z.url('DATABASE_URL debe ser una URL válida').startsWith('postgresql://'),

  /** Tamaño del pool de conexiones (opcional) */
  DATABASE_POOL_SIZE: z.coerce.number().int().positive().optional().default(10),

  /** Timeout de conexión en milisegundos (opcional) */
  DATABASE_TIMEOUT: z.coerce.number().int().positive().optional().default(20000),

  /** Modo SSL para conexión (opcional) */
  DATABASE_SSL_MODE: z
    .enum(['disable', 'allow', 'prefer', 'require', 'verify-ca', 'verify-full'])
    .optional()
    .default('prefer'),
});

/**
 * Inferir el tipo DatabaseConfig a partir del esquema de Zod.
 */
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;

/**
 * Fábrica de configuración que parsea y valida las variables de entorno relacionadas con BD.
 * @returns {DatabaseConfig} El objeto de configuración validado.
 */
export const databaseConfigFactory = (): DatabaseConfig => {
  return DatabaseConfigSchema.parse(process.env);
};

/**
 * Registro de la configuración bajo el namespace 'database'.
 */
export default registerAs<DatabaseConfig>('databaseConfig', databaseConfigFactory);
