import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { IncomingMessage, ServerResponse } from 'http';
import { LoggerModule } from 'nestjs-pino';
import { ZodSerializerInterceptor } from 'nestjs-zod';

import databaseConfig from '@/config/database.config';
import loggerConfig, { LoggerConfig } from '@/config/logger.config';
import { GlobalExceptionFilter } from '@/shared/filters/global-exception.filter';
import appConfig from '../config/app.config';
import { validate } from '../config/env.validation';
import swaggerConfig from '../config/swagger.config';
import { DatabaseModule } from './database/database.module';
import { EmailModule } from './email/email.module';
import { HealthModule } from './health/health.module';
import { SettingsModule } from './settings/settings.module';
import { UsersModule } from './users/users.module';

/**
 * Módulo principal de la aplicación.
 * Orquesta la configuración global, la base de datos, el registro de logs y la
 * integración de todos los módulos del sistema.
 */
@Module({
  imports: [
    /**
     * Configuración global de la aplicación.
     * Carga variables de entorno, aplica validación con Zod y registra fábricas de configuración.
     */
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [appConfig, swaggerConfig, loggerConfig, databaseConfig],
      validate,
    }),

    /**
     * Event bus interno para comunicación desacoplada entre módulos de dominio.
     */
    EventEmitterModule.forRoot(),

    /**
     * Configuración de Logger (Pino).
     * Implementa logs estructurados, redacción de datos sensibles y formato legible en desarrollo.
     */
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = configService.get<LoggerConfig>('loggerConfig')!;
        return {
          pinoHttp: {
            level: config.LOG_LEVEL,
            transport:
              config.NODE_ENV !== 'production'
                ? {
                    target: 'pino-pretty',
                    options: {
                      colorize: true,
                      singleLine: true,
                      levelFirst: false,
                      translateTime: 'SYS:HH:MM:ss',
                      ignore: 'hostname,pid',
                      messageFormat: '[{context}] {msg}',
                    },
                  }
                : undefined,
            redact: ['req.headers.authorization', 'req.body.password'],
            serializers: {
              req: (req: IncomingMessage) => ({
                method: req.method,
                url: req.url,
                query: (req as IncomingMessage & { query: Record<string, unknown> }).query,
              }),
              res: (res: ServerResponse) => ({
                statusCode: res.statusCode,
              }),
            },
          },
        };
      },
    }),
    /** Módulos de dominio y servicios del sistema */
    DatabaseModule,
    HealthModule,
    UsersModule,
    SettingsModule,
    EmailModule,
  ],
  controllers: [],
  providers: [
    /**
     * Interceptor global para serialización automática de respuestas mediante Zod.
     */
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    /**
     * Filtro global para el manejo centralizado de excepciones.
     */
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
