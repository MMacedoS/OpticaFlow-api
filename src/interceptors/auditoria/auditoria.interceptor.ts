import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { descreverRequisicao, sanitizarDados } from './auditoria.util';

interface RequestAuditado extends Request {
  user?: { sub?: string };
  userDb?: {
    id?: string;
    empresaId?: string | null;
    pessoa?: { filialId?: string | null } | null;
  };
}

interface RespostaJson {
  status?: number;
  data?: { id?: string; usuario?: { id?: string } } | null;
}

const METODOS_AUDITADOS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Registra na auditoria toda alteracao bem-sucedida (quem, o que, quando e
 * de onde). A gravacao nao bloqueia nem derruba a requisicao.
 */
@Injectable()
export class AuditoriaInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditoriaInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestAuditado>();

    if (!METODOS_AUDITADOS.has(request.method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((resposta: RespostaJson | undefined) => {
        // Lido antes de qualquer await: o socket pode fechar logo apos a resposta.
        const origem = this.origem(request);
        void this.registrar(request, resposta, origem).catch((error: unknown) =>
          this.logger.error(
            `Falha ao registrar auditoria de ${request.method} ${request.originalUrl}`,
            error instanceof Error ? error.stack : String(error),
          ),
        );
      }),
    );
  }

  private async registrar(
    request: RequestAuditado,
    resposta: RespostaJson | undefined,
    origem: { ip: string | null; userAgent: string | null },
  ): Promise<void> {
    // Rotas legadas devolvem erro no corpo com HTTP 2xx.
    if (typeof resposta?.status === 'number' && resposta.status >= 400) {
      return;
    }

    const rota = (request.route as { path?: string } | undefined)?.path;
    const descricao = descreverRequisicao(request.method, rota);
    if (!descricao) return;

    const usuarioId =
      request.user?.sub ??
      (descricao.acao === 'login' ? resposta?.data?.usuario?.id : undefined);
    const usuario = await this.carregarUsuario(request, usuarioId);

    const entidadeId =
      (request.params?.id as string | undefined) ??
      (Object.values(request.params ?? {})[0] as string | undefined) ??
      (typeof resposta?.data?.id === 'string' ? resposta.data.id : undefined);

    const body = request.body as Record<string, unknown> | undefined;
    const atendimentoId =
      descricao.entidade === 'atendimento' && request.method !== 'DELETE'
        ? entidadeId
        : typeof body?.atendimentoId === 'string'
          ? body.atendimentoId
          : undefined;

    const data: Prisma.AuditoriaUncheckedCreateInput = {
      empresaId: usuario?.empresaId ?? null,
      filialId: usuario?.filialId ?? null,
      usuarioId: usuario?.id ?? null,
      atendimentoId: atendimentoId ?? null,
      entidade: descricao.entidade,
      entidadeId: entidadeId ?? null,
      acao: descricao.acao,
      dados_depois:
        descricao.acao === 'login'
          ? Prisma.JsonNull
          : (sanitizarDados(body) as Prisma.InputJsonValue),
      ip: origem.ip,
      user_agent: origem.userAgent,
    };

    try {
      await this.prisma.auditoria.create({ data });
    } catch (error) {
      // Registro apagado na propria acao (ex.: consulta excluida): grava sem o vinculo.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        await this.prisma.auditoria.create({
          data: { ...data, atendimentoId: null },
        });
        return;
      }
      throw error;
    }
  }

  private origem(request: RequestAuditado): {
    ip: string | null;
    userAgent: string | null;
  } {
    const encaminhado = request.headers['x-forwarded-for'];
    const ip =
      (Array.isArray(encaminhado) ? encaminhado[0] : encaminhado)
        ?.split(',')[0]
        ?.trim() || request.ip;

    return {
      ip: ip ?? null,
      userAgent: request.headers['user-agent']?.slice(0, 500) ?? null,
    };
  }

  private async carregarUsuario(
    request: RequestAuditado,
    usuarioId?: string,
  ): Promise<{
    id: string;
    empresaId: string | null;
    filialId: string | null;
  } | null> {
    if (!usuarioId) return null;

    if (request.userDb?.id === usuarioId) {
      return {
        id: usuarioId,
        empresaId: request.userDb.empresaId ?? null,
        filialId: request.userDb.pessoa?.filialId ?? null,
      };
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        empresaId: true,
        pessoa: { select: { filialId: true } },
      },
    });

    return usuario
      ? {
          id: usuario.id,
          empresaId: usuario.empresaId,
          filialId: usuario.pessoa?.filialId ?? null,
        }
      : null;
  }
}
