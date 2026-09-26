import {
  BadRequestException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  StatusCompra,
  TipoMovimentoEstoque,
  TipoProduto,
} from '@prisma/client';
import { MovimentoEstoqueService } from 'src/app/movimento-estoque/movimento-estoque.service';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { CompraService } from './compra.service';

describe('CompraService', () => {
  let service: CompraService;

  const escopo: EscopoUsuario = {
    superadmin: false,
    empresaId: 'empresa-1',
    filialId: 'filial-1',
  };

  const tx = {
    compra: { updateMany: jest.fn() },
    produto: { update: jest.fn() },
    financeiroLancamento: { create: jest.fn(), updateMany: jest.fn() },
  };

  const prismaMock = {
    compra: { findFirst: jest.fn(), create: jest.fn() },
    filial: { findFirst: jest.fn() },
    produto: { findMany: jest.fn() },
    financeiroLancamento: { count: jest.fn() },
    $transaction: jest.fn((fn: (client: typeof tx) => unknown) => fn(tx)),
  };

  const movimentoMock = {
    obterOuCriarEstoque: jest.fn().mockResolvedValue({ id: 'estoque-1' }),
    registrar: jest.fn().mockResolvedValue({}),
  };

  const compraRascunho = {
    id: 'compra-1',
    empresaId: 'empresa-1',
    filialId: 'filial-1',
    status: StatusCompra.rascunho,
    valor_total: 190,
    dataCompra: new Date('2026-09-01'),
    fornecedor: { razao_social: 'Distribuidora X', nome_fantasia: null },
    itens: [
      { produtoId: 'p1', quantidade: 2, valor_unitario: 50, desconto: 10 },
      { produtoId: 'p2', quantidade: 1, valor_unitario: 100, desconto: 0 },
    ],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompraService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: MovimentoEstoqueService, useValue: movimentoMock },
      ],
    }).compile();

    service = module.get(CompraService);
    tx.compra.updateMany.mockResolvedValue({ count: 1 });
  });

  describe('create', () => {
    beforeEach(() => {
      prismaMock.filial.findFirst.mockResolvedValue({
        id: 'filial-1',
        empresaId: 'empresa-1',
      });
    });

    it('calcula o total com descontos', async () => {
      prismaMock.produto.findMany.mockResolvedValue([
        { id: 'p1', nome: 'Lente', tipo: TipoProduto.lente },
        { id: 'p2', nome: 'Armacao', tipo: TipoProduto.armacao },
      ]);
      prismaMock.compra.create.mockResolvedValue({ id: 'compra-1' });

      await service.create({ itens: compraRascunho.itens }, escopo);

      expect(prismaMock.compra.create.mock.calls[0][0].data.valor_total).toBe(
        190,
      );
    });

    it('recusa produto repetido', async () => {
      await expect(
        service.create(
          {
            itens: [
              { produtoId: 'p1', quantidade: 1, valor_unitario: 1 },
              { produtoId: 'p1', quantidade: 2, valor_unitario: 1 },
            ],
          },
          escopo,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('recusa servico na compra', async () => {
      prismaMock.produto.findMany.mockResolvedValue([
        { id: 'p1', nome: 'Consulta', tipo: TipoProduto.servico },
      ]);

      await expect(
        service.create(
          { itens: [{ produtoId: 'p1', quantidade: 1, valor_unitario: 1 }] },
          escopo,
        ),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });
  });

  describe('receber', () => {
    it('da entrada no estoque, atualiza custo e gera despesa', async () => {
      prismaMock.compra.findFirst.mockResolvedValue(compraRascunho);

      await service.receber('compra-1', {}, escopo);

      expect(movimentoMock.registrar).toHaveBeenCalledTimes(2);
      expect(movimentoMock.registrar).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({
          produtoId: 'p1',
          tipo: TipoMovimentoEstoque.entrada,
          quantidade: 2,
        }),
      );
      expect(tx.produto.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { preco_custo: 45 },
      });
      expect(tx.financeiroLancamento.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            valor: 190,
            status: 'pendente',
            descricao: 'Compra - Distribuidora X',
          }),
        }),
      );
    });

    it('nao recebe duas vezes', async () => {
      prismaMock.compra.findFirst.mockResolvedValue({
        ...compraRascunho,
        status: StatusCompra.recebida,
      });

      await expect(
        service.receber('compra-1', {}, escopo),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(movimentoMock.registrar).not.toHaveBeenCalled();
    });

    it('execucao concorrente e barrada pelo status condicional', async () => {
      prismaMock.compra.findFirst.mockResolvedValue(compraRascunho);
      tx.compra.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.receber('compra-1', {}, escopo),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(movimentoMock.registrar).not.toHaveBeenCalled();
    });
  });

  describe('cancelar', () => {
    it('compra recebida estorna o estoque e cancela a despesa', async () => {
      prismaMock.compra.findFirst.mockResolvedValue({
        ...compraRascunho,
        status: StatusCompra.recebida,
      });
      prismaMock.financeiroLancamento.count.mockResolvedValue(0);

      await service.cancelar('compra-1', escopo);

      expect(movimentoMock.registrar).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({ tipo: TipoMovimentoEstoque.saida }),
      );
      expect(tx.financeiroLancamento.updateMany).toHaveBeenCalled();
    });

    it('nao cancela compra com despesa paga', async () => {
      prismaMock.compra.findFirst.mockResolvedValue({
        ...compraRascunho,
        status: StatusCompra.recebida,
      });
      prismaMock.financeiroLancamento.count.mockResolvedValue(1);

      await expect(service.cancelar('compra-1', escopo)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(movimentoMock.registrar).not.toHaveBeenCalled();
    });
  });
});
