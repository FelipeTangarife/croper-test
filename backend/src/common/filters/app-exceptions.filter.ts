import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  HttpException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

interface BodyParserError {
  type: string;
}

const isBodyParserError = (exception: unknown): exception is BodyParserError =>
  typeof exception === 'object' &&
  exception !== null &&
  typeof (exception as { type?: unknown }).type === 'string';

const isUnknownRoute = (exception: NotFoundException) => {
  const response = exception.getResponse();
  const message =
    typeof response === 'object' && response !== null && 'message' in response
      ? response.message
      : response;
  return typeof message === 'string' && message.startsWith('Cannot ');
};

@Catch()
export class AppExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    super.catch(this.translate(exception), host);
  }

  private translate(exception: unknown): HttpException {
    if (exception instanceof NotFoundException && isUnknownRoute(exception)) {
      return new NotFoundException('Ruta no encontrada');
    }
    const original =
      exception instanceof HttpException ? exception.cause : exception;
    if (isBodyParserError(original)) {
      if (original.type === 'entity.parse.failed') {
        return new BadRequestException(
          'El cuerpo de la petición no es un JSON válido',
        );
      }
      if (original.type === 'entity.too.large') {
        return new PayloadTooLargeException(
          'El cuerpo de la petición es demasiado grande',
        );
      }
    }
    if (exception instanceof HttpException) return exception;

    Logger.error(
      exception instanceof Error ? exception.message : 'Unknown error',
      exception instanceof Error ? exception.stack : undefined,
      AppExceptionsFilter.name,
    );
    return new InternalServerErrorException('Error interno del servidor');
  }
}
