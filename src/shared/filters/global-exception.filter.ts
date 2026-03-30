import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { PinoLogger } from 'nestjs-pino';

/**
 * Filtro global de excepciones para manejar errores de forma consistente en toda la aplicación.
 * Captura cualquier excepción no manejada y devuelve una respuesta estructurada.
 * Especializado para funcionar con Fastify.
 */
@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  /**
   * Inicializa el filtro inyectando el logger estructurado.
   * @param logger Instancia de PinoLogger para registrar los errores.
   */
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(GlobalExceptionFilter.name);
  }

  /**
   * Método que captura y procesa la excepción.
   * @param exception La excepción lanzada.
   * @param host El contexto de los argumentos de la petición.
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Ha ocurrido un error interno en el servidor' };

    // Registro del error con contexto detallado
    // this.logger.error(
    //   {
    //     status,
    //     error: message,
    //     path: request.url,
    //   },
    //   'Excepción global capturada',
    // );

    // Respuesta estructurada al cliente
    response.status(status).send({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: message,
    });
  }
}
