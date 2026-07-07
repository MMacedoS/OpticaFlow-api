import { AuthService } from 'src/auth/auth.service';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AcessoGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.authService.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token não informado.');
    }

    const payload = this.validateAndDecodeToken(token);

    if (!payload.sub) {
      throw new UnauthorizedException('Token inválido.');
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        empresaId: true,
      },
    });

    if (!usuario) {
      throw new UnauthorizedException(
        'Usuário não encontrado para este token.',
      );
    }

    const { modulo, routePath } = this.resolveRouteContext(request);
    const acoesCandidatas = this.resolveActionCandidates(
      request.method,
      routePath,
    );

    const escopoEmpresa = usuario.empresaId
      ? [{ empresaId: null }, { empresaId: usuario.empresaId }]
      : [{ empresaId: null }];

    const permissoesDaAcao = await this.prisma.permissao.findMany({
      where: {
        AND: [
          {
            OR: [{ modulo }, { modulo: '*' }],
          },
          {
            OR: [{ acao: { in: acoesCandidatas } }, { acao: '*' }],
          },
          {
            OR: escopoEmpresa,
          },
        ],
      },
      select: { id: true },
    });

    if (permissoesDaAcao.length === 0) {
      const moduloConfigurado = await this.prisma.permissao.count({
        where: {
          AND: [
            {
              OR: [{ modulo }, { modulo: '*' }],
            },
            {
              OR: escopoEmpresa,
            },
          ],
        },
      });

      if (moduloConfigurado === 0) {
        return true;
      }

      throw new ForbiddenException('Ação não permitida para este módulo.');
    }

    const permissaoIds = permissoesDaAcao.map((permissao) => permissao.id);

    const possuiAcesso = await this.prisma.atribuicao.count({
      where: {
        usuarioId: usuario.id,
        acesso: {
          permissao: {
            some: {
              permissaoId: { in: permissaoIds },
            },
          },
        },
      },
    });

    if (possuiAcesso === 0) {
      throw new ForbiddenException('Usuário sem acesso a este recurso.');
    }

    return true;
  }

  private validateAndDecodeToken(token: string): { sub?: string } {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }
  }

  private resolveRouteContext(request: Request): {
    modulo: string;
    routePath: string;
  } {
    const baseUrl = this.normalizePath(request.baseUrl ?? '');
    const routePath = this.normalizePath(
      typeof request.route?.path === 'string' ? request.route.path : '',
    );

    const modulo = baseUrl.split('/').filter(Boolean)[0] ?? 'app';

    return {
      modulo: modulo.toLowerCase(),
      routePath: routePath.toLowerCase(),
    };
  }

  private resolveActionCandidates(method: string, routePath: string): string[] {
    const actionCandidates = new Set<string>();
    const normalizedMethod = method.toLowerCase();

    actionCandidates.add(normalizedMethod);

    if (normalizedMethod === 'get') {
      actionCandidates.add('listar');
      if (routePath.includes(':')) {
        actionCandidates.add('detalhar');
      }
    }

    if (normalizedMethod === 'post') {
      actionCandidates.add('criar');
    }

    if (normalizedMethod === 'put' || normalizedMethod === 'patch') {
      actionCandidates.add('atualizar');
    }

    if (normalizedMethod === 'delete') {
      actionCandidates.add('deletar');
    }

    const staticPathSegments = routePath
      .split('/')
      .map((segment) => segment.trim())
      .filter((segment) => !!segment && !segment.startsWith(':'));

    if (staticPathSegments.length > 0) {
      actionCandidates.add(staticPathSegments[staticPathSegments.length - 1]);
    }

    return Array.from(actionCandidates);
  }

  private normalizePath(path: string): string {
    if (!path) {
      return '';
    }

    return path.startsWith('/') ? path : `/${path}`;
  }

  public extractToken(): string | null {
    return 'olas';
  }
}
