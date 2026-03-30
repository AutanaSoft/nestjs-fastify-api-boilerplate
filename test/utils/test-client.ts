import type { AppConfig } from '@/config/app.config';
import { AppModule } from '@/modules/app.module';
import { ConfigService } from '@nestjs/config';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { ZodValidationPipe } from 'nestjs-zod';
import { randomUUID } from 'node:crypto';

let app: NestFastifyApplication | null = null;

/**
 * Helper interno para replicar la configuración de producción (main.ts).
 */
function setupTestApp(app: NestFastifyApplication): NestFastifyApplication {
  // 1. Configuración del Logger (Pino)
  app.useLogger(app.get(Logger));

  // 2. Pipes de validación global (Zod)
  app.useGlobalPipes(new ZodValidationPipe());

  // 3. Configuración dependiente del ConfigService
  const configService = app.get(ConfigService);

  // 4. AppConfig
  const appConfig = configService.get<AppConfig>('appConfig');

  // 4.1. Prefijo global
  if (appConfig?.APP_GLOBAL_PREFIX) {
    app.setGlobalPrefix(appConfig.APP_GLOBAL_PREFIX);
  }

  // 4.2. Configuraciones específicas de Fastify
  const httpAdapter = app.getHttpAdapter();
  const fastifyInstance = httpAdapter.getInstance();
  const correlationIdHeader = appConfig?.APP_CORRELATION_ID || 'x-request-id';

  // Inyectar el ID de solicitud en las cabeceras de respuesta (Correlation ID)
  fastifyInstance.addHook('onRequest', (request, reply, next) => {
    reply.header(correlationIdHeader, request.id);
    next();
  });

  // Generador de ID de solicitud personalizado
  fastifyInstance.setGenReqId((req) => {
    const correlation = req.headers[correlationIdHeader];
    return Array.isArray(correlation) ? correlation[0] : correlation || randomUUID();
  });

  return app;
}

/**
 * Obtiene la instancia Singleton de la aplicación para pruebas E2E.
 * Si no existe, la crea e inicializa.
 */
export async function getAppInstance(): Promise<NestFastifyApplication> {
  if (app) {
    return app;
  }

  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());

  // Aplicar misma configuración que en main.ts
  setupTestApp(app);

  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  return app;
}

/**
 * Cierra la instancia de la aplicación y limpia recursos.
 * Se debe llamar desde el Global Teardown de Jest.
 */
export async function closeAppInstance(): Promise<void> {
  if (app) {
    await app.close();
    app = null;
  }
}
