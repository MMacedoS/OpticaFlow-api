import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, TipoMovimentoEstoque, TipoProduto } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MovimentoEstoqueService } from './movimento-estoque.service';

describe('MovimentoEstoqueService.registrar', () => {
  let service: MovimentoEstoqueService;

  const tx = {
    produto: { findUnique: jest.fn() },
    estoqueItem: {
      upsert: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    movimentoEstoque: { create: jest.fn() },
  };
  const txClient = tx as unknown as Prisma.TransactionClient;

  const base = {
    empresaId: 'empresa-1',
    estoqueId: 'estoque-1',
    produtoId: 'produto-1',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovimentoEstoqueService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get(MovimentoEstoqueService);
    tx.produto.findUnique.mockResolvedValue({
      empresaId: 'empresa-1',
      tipo: TipoProduto.armacao,
    });
    tx.estoqueItem.upsert.mockResolvedValue({ id: 'item-1', quantidade: 5 });
    tx.movimentoEstoque.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'mov-1', ...data }),
    );
  });

  it('entrada incrementa o saldo de forma atomica', async () => {
    tx.estoqueItem.update.mockResolvedValue({ quantidade: 8 });

    const { saldo, movimento } = await service.registrar(txClient, {
      ...base,
      tipo: TipoMovimentoEstoque.entrada,
      quantidade: 3,
    });

    expect(tx.estoqueItem.update).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: { quantidade: { increment: 3 } },
    });
    expect(saldo).toBe(8);
    expect(movimento.quantidade).toBe(3);
  });

  it('saida sem saldo suficiente responde 409', async () => {
    tx.estoqueItem.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.registrar(txClient, {
        ...base,
        tipo: TipoMovimentoEstoque.saida,
        quantidade: 10,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.estoqueItem.updateMany).toHaveBeenCalledWith({
      where: { id: 'item-1', quantidade: { gte: 10 } },
      data: { quantidade: { decrement: 10 } },
    });
    expect(tx.movimentoEstoque.create).not.toHaveBeenCalled();
  });

  it('ajuste grava a diferenca entre contado e saldo', async () => {
    const { saldo, movimento } = await service.registrar(txClient, {
      ...base,
      tipo: TipoMovimentoEstoque.ajuste,
      quantidade: 2,
    });

    expect(tx.estoqueItem.update).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: { quantidade: 2 },
    });
    expect(saldo).toBe(2);
    expect(movimento.quantidade).toBe(-3);
  });

  it('ajuste igual ao saldo e recusado', async () => {
    await expect(
      service.registrar(txClient, {
        ...base,
        tipo: TipoMovimentoEstoque.ajuste,
        quantidade: 5,
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('servico nao tem estoque', async () => {
    tx.produto.findUnique.mockResolvedValue({
      empresaId: 'empresa-1',
      tipo: TipoProduto.servico,
    });

    await expect(
      service.registrar(txClient, {
        ...base,
        tipo: TipoMovimentoEstoque.entrada,
        quantidade: 1,
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('produto de outra empresa nao e movimentado', async () => {
    tx.produto.findUnique.mockResolvedValue({
      empresaId: 'outra',
      tipo: TipoProduto.armacao,
    });

    await expect(
      service.registrar(txClient, {
        ...base,
        tipo: TipoMovimentoEstoque.entrada,
        quantidade: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.estoqueItem.upsert).not.toHaveBeenCalled();
  });
});
