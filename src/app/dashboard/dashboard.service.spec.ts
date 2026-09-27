import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService - secoes por permissao', () => {
  let service: DashboardService;

  const prismaMock = {
    permissao: { findMany: jest.fn() },
    atendimento: {
      groupBy: jest.fn().mockResolvedValue([]),
      findMany: jest.fn().mockResolvedValue([]),
    },
    ordemServico: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
    venda: {
      aggregate: jest
        .fn()
        .mockResolvedValue({ _sum: { valor_total: 0 }, _count: { _all: 0 } }),
    },
    financeiroLancamento: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { valor: 0 } }),
    },
    estoqueItem: {
      fields: { minimo: 'minimo' },
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(DashboardService);
  });

  const mockPermissoes = (configurados: string[], doUsuario: string[]) =>
    prismaMock.permissao.findMany
      .mockResolvedValueOnce(configurados.map((modulo) => ({ modulo })))
      .mockResolvedValueOnce(doUsuario.map((modulo) => ({ modulo })));

  it('omite secoes de modulos configurados sem permissao do usuario', async () => {
    mockPermissoes(
      [
        'atendimento',
        'ordem-servico',
        'venda',
        'financeiro-lancamento',
        'estoque',
      ],
      ['atendimento', 'venda'],
    );

    const { data } = await service.resumo({
      superadmin: false,
      empresaId: 'empresa-1',
      usuarioId: 'usuario-1',
    });

    expect(data.consultasHoje).not.toBeNull();
    expect(data.vendas).not.toBeNull();
    expect(data.financeiro).toBeNull();
    expect(data.ordensServico).toBeNull();
    expect(data.estoque).toBeNull();
    expect(prismaMock.financeiroLancamento.aggregate).not.toHaveBeenCalled();
  });

  it('modulo sem permissao configurada fica liberado', async () => {
    mockPermissoes(['financeiro-lancamento'], []);

    const { data } = await service.resumo({
      superadmin: false,
      empresaId: 'empresa-1',
      usuarioId: 'usuario-1',
    });

    expect(data.financeiro).toBeNull();
    expect(data.consultasHoje).not.toBeNull();
    expect(data.estoque).not.toBeNull();
  });

  it('superadmin ve todas as secoes sem consultar permissoes', async () => {
    const { data } = await service.resumo({ superadmin: true });

    expect(prismaMock.permissao.findMany).not.toHaveBeenCalled();
    expect(Object.values(data).every((secao) => secao !== null)).toBe(true);
  });
});
