import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { ZodValidationPipe } from 'nestjs-zod';
import { randomUUID } from 'node:crypto';
import type { AppConfig } from './config/app.config';
import type { SwaggerConfig } from './config/swagger.config';
import { AppModule } from './modules/app.module';

/**
 * Inicializa y configura la aplicación NestJS.
 */
async function bootstrap() {
  // Inicialización del adaptador de Fastify
  const fastifyAdapter = new FastifyAdapter();

  // Creación de la aplicación NestJS
  // bufferLogs: true permite almacenar logs en memoria hasta que el logger personalizado se conecte
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, fastifyAdapter, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  // Obtener el servicio de configuración
  const configService = app.get(ConfigService);
  const appConfig = configService.get<AppConfig>('appConfig');
  const swaggerConfig = configService.get<SwaggerConfig>('swaggerConfig');

  // Asegurarse de que la configuración existe (aunque el Zod Schema debería garantizarlo)
  if (!appConfig || !swaggerConfig) {
    throw new Error('Application or Swagger configuration not found');
  }

  // Configuración global del pipe de validación Zod
  app.useGlobalPipes(new ZodValidationPipe());

  // Configurar prefijo global si está definido
  if (appConfig.APP_GLOBAL_PREFIX) {
    app.setGlobalPrefix(appConfig.APP_GLOBAL_PREFIX);
  }

  // Configuración de Swagger
  if (swaggerConfig.SWAGGER_ENABLED) {
    const config = new DocumentBuilder()
      .setTitle(appConfig.APP_NAME)
      .setDescription(appConfig.APP_DESCRIPTION)
      .setVersion(swaggerConfig.SWAGGER_VERSION)
      .addBearerAuth() // Soporte para JWT por defecto
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(swaggerConfig.SWAGGER_PATH, app, document, {
      useGlobalPrefix: false, // Permite acceder a /docs sin el prefijo global si se prefiere
    });
  }

  const correlationIdHeader = appConfig.APP_CORRELATION_ID;

  /**
   * Registra un hook para inyectar el ID de solicitud en las cabeceras de respuesta.
   * Esto asegura que el ID de correlación esté disponible para que el cliente rastree la solicitud.
   */
  fastifyAdapter.getInstance().addHook('onRequest', (request, reply, next) => {
    reply.header(correlationIdHeader, request.id);
    next();
  });

  /**
   * Configura un generador de ID de solicitud personalizado.
   * Utiliza el ID de correlación de las cabeceras si está disponible; de lo contrario,
   * genera un nuevo UUID.
   */
  fastifyAdapter.getInstance().setGenReqId((req) => {
    const correlation = req.headers[correlationIdHeader];
    return Array.isArray(correlation) ? correlation[0] : correlation || randomUUID();
  });

  // Inicialización del logger de la aplicación con el contexto 'Bootstrap'
  // Usamos el logger compatible con Pino obtenido del contenedor si es posible, o consola/standard.
  // Sin embargo, para simplicidad en bootstrap, si ya configuramos app.useLogger, los logs internos salen por Pino.
  // Para este log explícito:
  const logger = app.get(Logger);

  // Inicio del servidor
  await app.listen(appConfig.APP_PORT, appConfig.APP_HOST);

  const url = await app.getUrl();
  const apiPath = appConfig.APP_GLOBAL_PREFIX ? `/${appConfig.APP_GLOBAL_PREFIX}` : '';

  logger.log(`🚀 Server is running on: ${url}${apiPath}`);

  if (swaggerConfig.SWAGGER_ENABLED) {
    logger.log(`🗒️  Swagger documentation is running on: ${url}/${swaggerConfig.SWAGGER_PATH}`);
  }
}

/**
 * Punto de entrada para el inicio de la aplicación.
 * Captura errores globales durante el arranque y finaliza el proceso con código de error.
 */
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
