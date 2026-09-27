import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  StatusOrdemServico,
  StatusVenda,
  TipoMovimentoEstoque,
  TipoProduto,
} from '@prisma/client';
import { MovimentoEstoqueService } from 'src/app/movimento-estoque/movimento-estoque.service';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { VendaService } from './venda.service';

describe('VendaService', () => {
  let service: VendaService;

  const escopo: EscopoUsuario = { superadmin: false, empresaId: 'empresa-1' };

  const tx = {
    venda: { updateMany: jest.fn() },
    ordemServico: { updateMany: jest.fn() },
    financeiroLancamento: { create: jest.fn(), updateMany: jest.fn() },
  };

  const prismaMock = {
    venda: { findFirst: jest.fn(), create: jest.fn() },
    ordemServico: { findFirst: jest.fn() },
    financeiroLancamento: { count: jest.fn() },
    $transaction: jest.fn((fn: (client: typeof tx) => unknown) => fn(tx)),
  };

  const movimentoMock = {
    obterOuCriarEstoque: jest.fn().mockResolvedValue({ id: 'estoque-1' }),
    registrar: jest.fn().mockResolvedValue({}),
  };

  const vendaAberta = {
    id: 'venda-1',
    empresaId: 'empresa-1',
    filialId: 'filial-1',
    atendimentoId: null,
    ordemServicoId: 'os-1',
    status: StatusVenda.aberta,
    valor_total: 350,
    dataVenda: new Date('2026-09-01'),
    cliente: { pessoa: { nome: 'Maria' } },
    itens: [
      {
        produtoId: 'armacao',
        quantidade: 1,
        produto: { tipo: TipoProduto.armacao },
      },
      {
        produtoId: 'consulta',
        quantidade: 1,
        produto: { tipo: TipoProduto.servico },
      },
      {
        produtoId: null,
        descricao_servico: 'Montagem',
        quantidade: 1,
        produto: null,
      },
    ],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendaService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: MovimentoEstoqueService, useValue: movimentoMock },
      ],
    }).compile();

    service = module.get(VendaService);
    tx.venda.updateMany.mockResolvedValue({ count: 1 });
  });

  it('finalizar baixa so produtos fisicos, lanca receita e fatura a OS', async () => {
    prismaMock.venda.findFirst.mockResolvedValue(vendaAberta);

    await service.finalizar(
      'venda-1',
      { pago: true, forma_pagamento: 'pix' },
      escopo,
    );

    expect(movimentoMock.registrar).toHaveBeenCalledTimes(1);
    expect(movimentoMock.registrar).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        produtoId: 'armacao',
        tipo: TipoMovimentoEstoque.saida,
      }),
    );
    expect(tx.financeiroLancamento.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          valor: 350,
          status: 'pago',
          descricao: 'Venda - Maria',
        }),
      }),
    );
    expect(tx.ordemServico.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: StatusOrdemServico.faturada },
      }),
    );
  });

  it('finalizar sem pago deixa a receita pendente', async () => {
    prismaMock.venda.findFirst.mockResolvedValue(vendaAberta);

    await service.finalizar('venda-1', {}, escopo);

    const { data } = tx.financeiroLancamento.create.mock.calls[0][0];
    expect(data.status).toBe('pendente');
    expect(data.pagoEm).toBeNull();
  });

  it('nao cancela venda com receita ja recebida', async () => {
    prismaMock.venda.findFirst.mockResolvedValue({
      ...vendaAberta,
      status: StatusVenda.finalizada,
    });
    prismaMock.financeiroLancamento.count.mockResolvedValue(1);

    await expect(service.cancelar('venda-1', escopo)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(movimentoMock.registrar).not.toHaveBeenCalled();
  });

  it('gera a venda com os itens da OS', async () => {
    prismaMock.ordemServico.findFirst.mockResolvedValue({
      id: 'os-1',
      empresaId: 'empresa-1',
      filialId: 'filial-1',
      clienteId: 'cliente-1',
      atendimentoId: 'atend-1',
      numero: '123',
      status: StatusOrdemServico.finalizada,
      vendas: [],
      itens: [
        {
          produtoId: 'lente',
          descricao_servico: null,
          quantidade: 2,
          valor_unitario: 100,
          desconto: 20,
        },
      ],
    });
    prismaMock.venda.create.mockResolvedValue({ id: 'venda-2' });

    await service.createFromOrdemServico('os-1', escopo);

    const { data } = prismaMock.venda.create.mock.calls[0][0];
    expect(data).toMatchObject({
      ordemServicoId: 'os-1',
      clienteId: 'cliente-1',
      valor_total: 180,
    });
  });

  it('nao gera segunda venda para a mesma OS', async () => {
    prismaMock.ordemServico.findFirst.mockResolvedValue({
      id: 'os-1',
      status: StatusOrdemServico.finalizada,
      vendas: [{ id: 'venda-1' }],
      itens: [],
    });

    await expect(
      service.createFromOrdemServico('os-1', escopo),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
