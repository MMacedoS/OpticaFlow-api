import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

interface RespostaJson {
  status?: unknown;
  message?: unknown;
}

/**
 * Varios services devolvem erros no corpo ({ status: 422, message }) com
 * HTTP 200, e o frontend os tratava como sucesso. Aqui o status do corpo vira
 * o status HTTP. Um 401 no corpo vira 403: o 401 HTTP faz o frontend renovar
 * o token e, se falhar, encerrar a sessao.
 */
@Injectable()
export class StatusRespostaInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      map((resposta: unknown) => {
        const corpo = resposta as RespostaJson | undefined;

        if (
          corpo &&
          typeof corpo === 'object' &&
          typeof corpo.status === 'number' &&
          corpo.status >= 400 &&
          corpo.status < 600
        ) {
          const status =
            corpo.status === 401 ? HttpStatus.FORBIDDEN : corpo.status;
          throw new HttpException(corpo, status);
        }

        return resposta;
      }),
    );
  }
}
