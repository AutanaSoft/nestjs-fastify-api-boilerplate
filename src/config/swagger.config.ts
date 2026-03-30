import { registerAs } from '@nestjs/config';
import { z } from 'zod';

/**
 * Esquema de validación para la configuración de la documentación Swagger/OpenAPI.
 */
export const SwaggerConfigSchema = z.object({
  /** Indica si la documentación de Swagger está habilitada */
  SWAGGER_ENABLED: z
    .preprocess((val) => {
      if (typeof val === 'string') {
        if (val.toLowerCase() === 'true') return true;
        if (val.toLowerCase() === 'false') return false;
      }
      return val;
    }, z.boolean())
    .default(true),
  /** Ruta URL donde estará disponible la documentación */
  SWAGGER_PATH: z.string().default('docs'),
  /** Versión actual de la especificación API */
  SWAGGER_VERSION: z.string().default('1.0.0'),
});

/**
 * Inferir el tipo SwaggerConfig a partir del esquema de Zod.
 */
export type SwaggerConfig = z.infer<typeof SwaggerConfigSchema>;

/**
 * Fábrica de configuración que parsea y valida las variables de entorno para Swagger.
 * @returns {SwaggerConfig} El objeto de configuración validado.
 */
export const swaggerConfigFactory = (): SwaggerConfig => {
  return SwaggerConfigSchema.parse(process.env);
};

/**
 * Registro de la configuración bajo el namespace 'swaggerConfig'.
 */
export default registerAs<SwaggerConfig>('swaggerConfig', swaggerConfigFactory);
