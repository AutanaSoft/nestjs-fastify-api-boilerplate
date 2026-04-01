import { z } from 'zod';
import { AuthConfigSchema } from './auth.config';

import { AppConfigSchema } from './app.config';
import { DatabaseConfigSchema } from './database.config';
import { LoggerConfigSchema } from './logger.config';
import { SwaggerConfigSchema } from './swagger.config';

/**
 * Esquema de validación global que combina todos los esquemas individuales del proyecto.
 * Se utiliza para validar todas las variables de entorno al iniciar la aplicación.
 */
export const EnvValidationSchema = z.object({
  ...AppConfigSchema.shape,
  ...DatabaseConfigSchema.shape,
  ...LoggerConfigSchema.shape,
  ...SwaggerConfigSchema.shape,
  ...AuthConfigSchema.shape,
});

/**
 * Inferir el tipo EnvConfig a partir del esquema de validación global.
 */
export type EnvConfig = z.infer<typeof EnvValidationSchema>;

/**
 * Función de validación personalizada para NestJS ConfigModule.
 * Valida el objeto de configuración contra el esquema global y lanza un error si falla.
 *
 * @param {Record<string, unknown>} config Objeto de configuración a validar (process.env).
 * @returns {EnvConfig} El objeto de configuración validado.
 * @throws {Error} Si la validación falla con detalles de los errores encontrados.
 */
export function validate(config: Record<string, unknown>): EnvConfig {
  const result = EnvValidationSchema.safeParse(config);

  if (!result.success) {
    throw new Error(`Error de validación de configuración: ${result.error.message}`);
  }

  return result.data;
}
