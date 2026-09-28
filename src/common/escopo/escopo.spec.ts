import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { PrismaService } from 'src/prisma/prisma.service';
import { Escopo } from './escopo.decorator';
import type { EscopoUsuario } from './escopo.interface';
import { resolverFiltroFilial } from './filtro-filial';

type FabricaEscopo = (data: unknown, ctx: ExecutionContext) => EscopoUsuario;

/** Extrai a funcao que o Nest executa para resolver o decorator. */
function fabricaDoDecorator(): FabricaEscopo {
  class Alvo {
    handler(@Escopo() _escopo: EscopoUsuario) {}
  }
  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Alvo, 'handler');
  return args[Object.keys(args)[0]].factory;
}

describe('Escopo', () => {
  const resolver = fabricaDoDecorator();
  const contexto = (userDb?: unknown) =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ userDb }) }),
    }) as unknown as ExecutionContext;

  it('rejeita requisicao sem usuario carregado', () => {
    expect(() => resolver(undefined, contexto())).toThrow(
      UnauthorizedException,
    );
  });

  it('superadmin nao tem restricao de empresa ou filial', () => {
    expect(
      resolver(
        undefined,
        contexto({ id: 'u1', superadmin: true, empresaId: 'empresa-1' }),
      ),
    ).toEqual({ superadmin: true, usuarioId: 'u1' });
  });

  it('rejeita usuario comum sem empresa', () => {
    expect(() =>
      resolver(undefined, contexto({ id: 'u1', superadmin: false })),
    ).toThrow(ForbiddenException);
  });

  it('restringe usuario comum a empresa e filial dele', () => {
    expect(
      resolver(
        undefined,
        contexto({
          id: 'u1',
          superadmin: false,
          empresaId: 'empresa-1',
          pessoa: { filialId: 'filial-1' },
        }),
      ),
    ).toEqual({
      superadmin: false,
      usuarioId: 'u1',
      empresaId: 'empresa-1',
      filialId: 'filial-1',
      profissionalId: undefined,
    });
  });

  it('marca optometristas e oftalmologistas como profissionais', () => {
    const optometrista = resolver(
      undefined,
      contexto({
        id: 'u1',
        empresaId: 'empresa-1',
        pessoa: { filialId: 'filial-1', optometrista: { id: 'o1' } },
      }),
    );
    const oftalmologista = resolver(
      undefined,
      contexto({
        id: 'u2',
        empresaId: 'empresa-1',
        pessoa: { filialId: 'filial-1', oftalmologista: { id: 'o2' } },
      }),
    );

    expect(optometrista.profissionalId).toBe('u1');
    expect(oftalmologista.profissionalId).toBe('u2');
  });
});

describe('resolverFiltroFilial', () => {
  const prismaMock = { filial: { findFirst: jest.fn() } };
  const prisma = prismaMock as unknown as PrismaService;

  beforeEach(() => jest.clearAllMocks());

  it('usuario com filial fica sempre na propria filial', async () => {
    const filtro = await resolverFiltroFilial(
      prisma,
      { superadmin: false, empresaId: 'empresa-1', filialId: 'filial-1' },
      'filial-de-outra-empresa',
    );

    expect(filtro).toEqual({ filialId: 'filial-1' });
    expect(prismaMock.filial.findFirst).not.toHaveBeenCalled();
  });

  it('valida a filial informada dentro da empresa do usuario', async () => {
    prismaMock.filial.findFirst.mockResolvedValue({ id: 'filial-2' });

    const filtro = await resolverFiltroFilial(
      prisma,
      { superadmin: false, empresaId: 'empresa-1' },
      'filial-2',
    );

    expect(filtro).toEqual({ filialId: 'filial-2' });
    expect(prismaMock.filial.findFirst).toHaveBeenCalledWith({
      where: { id: 'filial-2', empresaId: 'empresa-1' },
      select: { id: true },
    });
  });

  it('rejeita filial que nao pertence a empresa do usuario', async () => {
    prismaMock.filial.findFirst.mockResolvedValue(null);

    await expect(
      resolverFiltroFilial(
        prisma,
        { superadmin: false, empresaId: 'empresa-1' },
        'filial-de-outra-empresa',
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('sem filial informada, usuario sem filial ve a empresa toda', async () => {
    await expect(
      resolverFiltroFilial(prisma, {
        superadmin: false,
        empresaId: 'empresa-1',
      }),
    ).resolves.toEqual({ filial: { empresaId: 'empresa-1' } });
  });

  it('superadmin pode escolher qualquer filial', async () => {
    prismaMock.filial.findFirst.mockResolvedValue({ id: 'filial-9' });

    await expect(
      resolverFiltroFilial(prisma, { superadmin: true }, 'filial-9'),
    ).resolves.toEqual({ filialId: 'filial-9' });
    expect(prismaMock.filial.findFirst).toHaveBeenCalledWith({
      where: { id: 'filial-9' },
      select: { id: true },
    });
  });

  it('superadmin sem filial informada nao tem restricao', async () => {
    await expect(
      resolverFiltroFilial(prisma, { superadmin: true }),
    ).resolves.toEqual({});
  });
});
