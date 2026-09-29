import { TipoMovimentoEstoque } from '@prisma/client';
import { MovimentoEstoqueService } from 'src/app/movimento-estoque/movimento-estoque.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrdemServicoItemService } from './ordem-servico-item.service';

describe('OrdemServicoItemService', () => {
  const tx = {
    ordemServicoItem: {
      create: jest.fn().mockResolvedValue({ id: 'item-1' }),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    ordemServico: { update: jest.fn() },
    movimentoEstoque: { findFirst: jest.fn() },
    estoqueItem: { update: jest.fn(), create: jest.fn() },
  };

  const prismaMock = {
    ordemServico: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'os-1',
        empresaId: 'empresa-1',
        filialId: 'filial-1',
      }),
    },
    ordemServicoItem: {
      findUnique: jest.fn(),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    produto: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: 'produto-1', empresaId: 'empresa-1' }),
    },
    $transaction: jest.fn((fn: (client: typeof tx) => unknown) => fn(tx)),
  };

  const movimentoMock = { registrar: jest.fn() };

  const service = new OrdemServicoItemService(
    prismaMock as unknown as PrismaService,
    movimentoMock as unknown as MovimentoEstoqueService,
  );

  const itemComProduto = {
    id: 'item-1',
    ordemServicoId: 'os-1',
    produtoId: 'produto-1',
    quantidade: 2,
    valor_unitario: 100,
    desconto: 0,
    ordem_servico: { empresaId: 'empresa-1', filialId: 'filial-1' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(service, 'findById').mockResolvedValue({ status: 200 } as never);
  });

  it('criar item com produto nao movimenta o estoque', async () => {
    await service.create({
      ordemServicoId: 'os-1',
      produtoId: 'produto-1',
      quantidade: 2,
      valor_unitario: 100,
    });

    expect(tx.ordemServicoItem.create).toHaveBeenCalled();
    expect(tx.estoqueItem.update).not.toHaveBeenCalled();
    expect(tx.estoqueItem.create).not.toHaveBeenCalled();
    expect(movimentoMock.registrar).not.toHaveBeenCalled();
  });

  it('remover item com baixa antiga devolve a quantidade ao estoque', async () => {
    prismaMock.ordemServicoItem.findUnique.mockResolvedValue(itemComProduto);
    tx.movimentoEstoque.findFirst
      .mockResolvedValueOnce({ estoqueId: 'estoque-1', quantidade: 2 })
      .mockResolvedValueOnce(null);

    await service.deleteById('item-1');

    expect(movimentoMock.registrar).toHaveBeenCalledWith(tx, {
      empresaId: 'empresa-1',
      estoqueId: 'estoque-1',
      produtoId: 'produto-1',
      tipo: TipoMovimentoEstoque.entrada,
      quantidade: 2,
      motivo: expect.any(String),
      referencia: 'ESTORNO:ORDEM_SERVICO_ITEM:item-1',
    });
    expect(tx.ordemServicoItem.delete).toHaveBeenCalled();
  });

  it('nao estorna de novo uma baixa antiga ja estornada', async () => {
    prismaMock.ordemServicoItem.findUnique.mockResolvedValue(itemComProduto);
    tx.movimentoEstoque.findFirst
      .mockResolvedValueOnce({ estoqueId: 'estoque-1', quantidade: 2 })
      .mockResolvedValueOnce({ id: 'estorno-1' });

    await service.update('item-1', { quantidade: 3 });

    expect(movimentoMock.registrar).not.toHaveBeenCalled();
    expect(tx.ordemServicoItem.update).toHaveBeenCalled();
  });

  it('item sem baixa antiga nao gera movimentacao ao ser editado', async () => {
    prismaMock.ordemServicoItem.findUnique.mockResolvedValue(itemComProduto);
    tx.movimentoEstoque.findFirst.mockResolvedValue(null);

    await service.update('item-1', { quantidade: 5 });

    expect(movimentoMock.registrar).not.toHaveBeenCalled();
  });
});
