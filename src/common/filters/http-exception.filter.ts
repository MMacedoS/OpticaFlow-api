import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorResponseBody {
  status: number;
  message: string;
  errors?: string[];
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const body = this.buildBody(exception);

    response.status(body.status).json(body);
  }

  private buildBody(exception: unknown): ErrorResponseBody {
    if (!(exception instanceof HttpException)) {
      this.logger.error(
        'Erro nao tratado',
        exception instanceof Error ? exception.stack : String(exception),
      );

      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erro interno do servidor.',
      };
    }

    const status = exception.getStatus();
    const messages = this.extractMessages(exception);

    return {
      status,
      message: messages[0] ?? exception.message,
      ...(messages.length > 1 && { errors: messages }),
    };
  }

  private extractMessages(exception: HttpException): string[] {
    const payload = exception.getResponse();

    if (typeof payload === 'string') {
      return [payload];
    }

    const message = (payload as { message?: string | string[] }).message;

    if (Array.isArray(message)) {
      return message;
    }

    return message ? [message] : [];
  }
}
