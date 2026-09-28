import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/app/auth/auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AcessoGuard } from './acesso.guard';

describe('AcessoGuard', () => {
  const prismaMock = {
    usuario: { findUnique: jest.fn() },
    permissao: { findMany: jest.fn(), count: jest.fn() },
    atribuicao: { count: jest.fn() },
  };
  const jwtMock = { verify: jest.fn() };
  const authMock = { extractTokenFromHeader: jest.fn() };
  const reflectorMock = { get: jest.fn() };

  const guard = new AcessoGuard(
    prismaMock as unknown as PrismaService,
    jwtMock as unknown as JwtService,
    authMock as unknown as AuthService,
    reflectorMock as unknown as Reflector,
  );

  const contexto = (method: string, path: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ method, route: { path }, headers: {} }),
      }),
      getHandler: () => () => undefined,
    }) as unknown as ExecutionContext;

  const usuarioComum = {
    id: 'usuario-1',
    empresaId: 'empresa-1',
    superadmin: false,
  };

  /** Acoes pesquisadas na ultima consulta de permissoes. */
  const acoesConsultadas = (): string[] =>
    prismaMock.permissao.findMany.mock.calls[0][0].where.AND[1].OR[0].acao.in;

  beforeEach(() => {
    jest.clearAllMocks();
    authMock.extractTokenFromHeader.mockReturnValue('token');
    jwtMock.verify.mockReturnValue({ sub: 'usuario-1' });
    reflectorMock.get.mockReturnValue(undefined);
    prismaMock.usuario.findUnique.mockResolvedValue(usuarioComum);
  });

  it('rejeita requisicao sem token', async () => {
    authMock.extractTokenFromHeader.mockReturnValue(undefined);

    await expect(
      guard.canActivate(contexto('GET', '/cliente')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejeita token invalido ou expirado', async () => {
    jwtMock.verify.mockImplementation(() => {
      throw new Error('jwt expired');
    });

    await expect(
      guard.canActivate(contexto('GET', '/cliente')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejeita token de usuario inexistente', async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(null);

    await expect(
      guard.canActivate(contexto('GET', '/cliente')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('libera o superadmin sem consultar permissoes', async () => {
    prismaMock.usuario.findUnique.mockResolvedValue({
      ...usuarioComum,
      empresaId: null,
      superadmin: true,
    });

    await expect(
      guard.canActivate(contexto('DELETE', '/cliente/:id')),
    ).resolves.toBe(true);
    expect(prismaMock.permissao.findMany).not.toHaveBeenCalled();
  });

  it('libera usuario com atribuicao para a permissao da acao', async () => {
    prismaMock.permissao.findMany.mockResolvedValue([{ id: 'perm-1' }]);
    prismaMock.atribuicao.count.mockResolvedValue(1);

    await expect(
      guard.canActivate(contexto('GET', '/cliente/:id')),
    ).resolves.toBe(true);

    expect(acoesConsultadas()).toEqual(
      expect.arrayContaining(['get', 'listar', 'detalhar']),
    );
    expect(prismaMock.atribuicao.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ usuarioId: 'usuario-1' }),
    });
  });

  it('bloqueia usuario sem atribuicao para a permissao', async () => {
    prismaMock.permissao.findMany.mockResolvedValue([{ id: 'perm-1' }]);
    prismaMock.atribuicao.count.mockResolvedValue(0);

    await expect(
      guard.canActivate(contexto('POST', '/cliente')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('bloqueia acao sem permissao em modulo configurado', async () => {
    prismaMock.permissao.findMany.mockResolvedValue([]);
    prismaMock.permissao.count.mockResolvedValue(3);

    await expect(
      guard.canActivate(contexto('DELETE', '/cliente/:id')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('libera modulo sem nenhuma permissao configurada', async () => {
    prismaMock.permissao.findMany.mockResolvedValue([]);
    prismaMock.permissao.count.mockResolvedValue(0);

    await expect(
      guard.canActivate(contexto('GET', '/notificacao')),
    ).resolves.toBe(true);
  });

  it('usa o ultimo segmento fixo da rota como acao', async () => {
    prismaMock.permissao.findMany.mockResolvedValue([{ id: 'perm-1' }]);
    prismaMock.atribuicao.count.mockResolvedValue(1);

    await guard.canActivate(contexto('POST', '/venda/:id/finalizar'));

    expect(acoesConsultadas()).toEqual(
      expect.arrayContaining(['post', 'criar', 'finalizar']),
    );
    expect(
      prismaMock.permissao.findMany.mock.calls[0][0].where.AND[0].OR,
    ).toEqual([{ modulo: 'venda' }, { modulo: '*' }]);
  });

  it('usa o modulo fixado pelo decorator quando informado', async () => {
    reflectorMock.get.mockReturnValue('relatorio');
    prismaMock.permissao.findMany.mockResolvedValue([{ id: 'perm-1' }]);
    prismaMock.atribuicao.count.mockResolvedValue(1);

    await guard.canActivate(contexto('GET', '/dashboard/resumo'));

    expect(
      prismaMock.permissao.findMany.mock.calls[0][0].where.AND[0].OR,
    ).toEqual([{ modulo: 'relatorio' }, { modulo: '*' }]);
  });

  it('considera apenas permissoes globais ou da empresa do usuario', async () => {
    prismaMock.permissao.findMany.mockResolvedValue([{ id: 'perm-1' }]);
    prismaMock.atribuicao.count.mockResolvedValue(1);

    await guard.canActivate(contexto('GET', '/cliente'));

    expect(
      prismaMock.permissao.findMany.mock.calls[0][0].where.AND[2].OR,
    ).toEqual([{ empresaId: null }, { empresaId: 'empresa-1' }]);
  });
});
