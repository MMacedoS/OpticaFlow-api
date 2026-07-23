import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { UsuarioService } from 'src/app/usuario/usuario.service';

@Injectable()
export class EnrichUserInterceptor implements NestInterceptor {
  constructor(private readonly usuarioService: UsuarioService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const usuarioId = request.user?.sub;

    if (!usuarioId) {
      throw new UnauthorizedException('Usuário não autenticado no request.');
    }

    const pessoa = await this.usuarioService.findPessoaByUserId(usuarioId);

    if (!pessoa) {
      throw new UnauthorizedException('Usuário não encontrado no sistema.');
    }

    request.userDb = pessoa;

    return next.handle();
  }
}
