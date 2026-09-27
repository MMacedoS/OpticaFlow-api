import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { EscopoUsuario } from './escopo.interface';

interface UsuarioRequest {
  id?: string;
  superadmin?: boolean;
  empresaId?: string | null;
  pessoa?: { filialId?: string | null } | null;
}

/**
 * Empresa e filial do usuario autenticado. Superadmin nao tem restricao.
 * Requer o EnrichUserInterceptor no controller.
 */
export const Escopo = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): EscopoUsuario => {
    const usuario = ctx
      .switchToHttp()
      .getRequest<{ userDb?: UsuarioRequest }>().userDb;

    if (!usuario) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }

    if (usuario.superadmin) {
      return { superadmin: true, usuarioId: usuario.id };
    }

    if (!usuario.empresaId) {
      throw new ForbiddenException('Usuário sem empresa vinculada.');
    }

    return {
      superadmin: false,
      usuarioId: usuario.id,
      empresaId: usuario.empresaId,
      filialId: usuario.pessoa?.filialId ?? undefined,
    };
  },
);
