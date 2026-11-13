import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { securityEvent } from './security-logger';

/**
 * Filtro global: nunca devolve stack trace, mensagens internas ou nomes de
 * classes ao cliente (OWASP API8 - Security Misconfiguration).
 * O template Nuclei `vanguarda-error-disclosure` valida isso a cada deploy.
 */
@Catch()
export class SafeExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status === HttpStatus.BAD_REQUEST) {
      securityEvent('VALIDATION_REJECTED', { status });
    }
    if (status === HttpStatus.TOO_MANY_REQUESTS) {
      securityEvent('RATE_LIMITED', { status });
    }

    const publicMessage =
      status >= 500
        ? 'Erro interno. Tente novamente em instantes.'
        : status === HttpStatus.TOO_MANY_REQUESTS
          ? 'Muitas requisições. Aguarde um pouco.'
          : 'Requisição inválida.';

    res.status(status).json({ statusCode: status, message: publicMessage });
  }
}
