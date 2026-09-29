import { NotFoundException } from '@nestjs/common';
import { TipoMovimentoEstoque } from '@prisma/client';
import { MovimentoEstoqueService } from 'src/app/movimento-estoque/movimento-estoque.service';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
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
    ordemServico: { findFirst: jest.fn() },
    ordemServicoItem: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    produto: { findUnique: jest.fn() },
    $transaction: jest.fn((arg: unknown) =>
      typeof arg === 'function'
        ? (arg as (client: typeof tx) => unknown)(tx)
        : Promise.all(arg as unknown[]),
    ),
  };

  const movimentoMock = { registrar: jest.fn() };

  const service = new OrdemServicoItemService(
    prismaMock as unknown as PrismaService,
    movimentoMock as unknown as MovimentoEstoqueService,
  );

  const escopoA: EscopoUsuario = {
    superadmin: false,
    usuarioId: 'u-a',
    empresaId: 'empresa-1',
    filialId: 'filial-1',
  };
  const escopoEmpresaA: EscopoUsuario = {
    superadmin: false,
    usuarioId: 'u-a2',
    empresaId: 'empresa-1',
  };
  const superadmin: EscopoUsuario = { superadmin: true, usuarioId: 'root' };

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
    prismaMock.ordemServico.findFirst.mockResolvedValue({
      id: 'os-1',
      empresaId: 'empresa-1',
      filialId: 'filial-1',
    });
    prismaMock.produto.findUnique.mockResolvedValue({
      id: 'produto-1',
      empresaId: 'empresa-1',
    });
    prismaMock.ordemServicoItem.findFirst.mockResolvedValue(null);
  });

  describe('estoque', () => {
    beforeEach(() => {
      jest
        .spyOn(service, 'findById')
        .mockResolvedValue({ status: 200 } as never);
    });

    afterEach(() => jest.restoreAllMocks());

    it('criar item com produto nao movimenta o estoque', async () => {
      await service.create(
        {
          ordemServicoId: 'os-1',
          produtoId: 'produto-1',
          quantidade: 2,
          valor_unitario: 100,
        },
        escopoA,
      );

      expect(tx.ordemServicoItem.create).toHaveBeenCalled();
      expect(tx.estoqueItem.update).not.toHaveBeenCalled();
      expect(tx.estoqueItem.create).not.toHaveBeenCalled();
      expect(movimentoMock.registrar).not.toHaveBeenCalled();
    });

    it('remover item com baixa antiga devolve a quantidade ao estoque', async () => {
      prismaMock.ordemServicoItem.findFirst.mockResolvedValue(itemComProduto);
      tx.movimentoEstoque.findFirst
        .mockResolvedValueOnce({ estoqueId: 'estoque-1', quantidade: 2 })
        .mockResolvedValueOnce(null);

      await service.deleteById('item-1', escopoA);

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
      prismaMock.ordemServicoItem.findFirst.mockResolvedValue(itemComProduto);
      tx.movimentoEstoque.findFirst
        .mockResolvedValueOnce({ estoqueId: 'estoque-1', quantidade: 2 })
        .mockResolvedValueOnce({ id: 'estorno-1' });

      await service.update('item-1', { quantidade: 3 }, escopoA);

      expect(movimentoMock.registrar).not.toHaveBeenCalled();
      expect(tx.ordemServicoItem.update).toHaveBeenCalled();
    });

    it('item sem baixa antiga nao gera movimentacao ao ser editado', async () => {
      prismaMock.ordemServicoItem.findFirst.mockResolvedValue(itemComProduto);
      tx.movimentoEstoque.findFirst.mockResolvedValue(null);

      await service.update('item-1', { quantidade: 5 }, escopoA);

      expect(movimentoMock.registrar).not.toHaveBeenCalled();
    });
  });

  describe('isolamento entre empresas', () => {
    const filtroFilialA = {
      id: 'item-b',
      ordem_servico: { empresaId: 'empresa-1', filialId: 'filial-1' },
    };

    it('usuario da empresa A nao le item da empresa B', async () => {
      await expect(service.findById('item-b', escopoA)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prismaMock.ordemServicoItem.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: filtroFilialA }),
      );
    });

    it('usuario sem filial fica restrito a empresa', async () => {
      await expect(
        service.findById('item-b', escopoEmpresaA),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.ordemServicoItem.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'item-b', ordem_servico: { empresaId: 'empresa-1' } },
        }),
      );
    });

    it('usuario da empresa A nao altera nem remove item da empresa B', async () => {
      await expect(
        service.update('item-b', { quantidade: 1 }, escopoA),
      ).rejects.toBeInstanceOf(NotFoundException);
      await expect(
        service.deleteById('item-b', escopoA),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(tx.ordemServicoItem.update).not.toHaveBeenCalled();
      expect(tx.ordemServicoItem.delete).not.toHaveBeenCalled();
    });

    it('usuario da empresa A nao lista nem cria itens na OS da empresa B', async () => {
      prismaMock.ordemServico.findFirst.mockResolvedValue(null);

      await expect(
        service.findAllByOrdemServico('os-b', escopoA),
      ).rejects.toBeInstanceOf(NotFoundException);
      await expect(
        service.create(
          { ordemServicoId: 'os-b', quantidade: 1, valor_unitario: 1 },
          escopoA,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.ordemServico.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'os-b', empresaId: 'empresa-1', filialId: 'filial-1' },
        }),
      );
      expect(tx.ordemServicoItem.create).not.toHaveBeenCalled();
    });

    it('produto de outra empresa e rejeitado', async () => {
      prismaMock.produto.findUnique.mockResolvedValue({
        id: 'produto-b',
        empresaId: 'empresa-2',
      });

      const resposta = await service.create(
        {
          ordemServicoId: 'os-1',
          produtoId: 'produto-b',
          quantidade: 1,
          valor_unitario: 1,
        },
        escopoA,
      );

      expect(resposta.status).toBe(422);
      expect(tx.ordemServicoItem.create).not.toHaveBeenCalled();
    });

    it('superadmin acessa itens de qualquer empresa', async () => {
      prismaMock.ordemServicoItem.findFirst.mockResolvedValue({
        ...itemComProduto,
        id: 'item-b',
        ordem_servico: { id: 'os-b', empresaId: 'empresa-2' },
        produto: null,
      });

      const resposta = await service.findById('item-b', superadmin);

      expect(resposta.status).toBe(200);
      expect(prismaMock.ordemServicoItem.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'item-b', ordem_servico: {} } }),
      );

      await service.findAllByOrdemServico('os-b', superadmin);
      expect(prismaMock.ordemServico.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'os-b' } }),
      );
    });
  });
});
