import { NotFoundException } from '@nestjs/common';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { AgendaService } from './agenda.service';

describe('AgendaService - isolamento entre empresas', () => {
  const tx = {
    agenda: {
      create: jest.fn().mockResolvedValue({ id: 'agenda-1' }),
      update: jest.fn().mockResolvedValue({ id: 'agenda-a' }),
      delete: jest.fn(),
    },
    atendimento: {
      create: jest.fn().mockResolvedValue({ id: 'atend-1' }),
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
      delete: jest.fn(),
    },
    ordemServico: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    ordemServicoItem: { createMany: jest.fn(), deleteMany: jest.fn() },
  };
  const prismaMock = {
    agenda: { findFirst: jest.fn() },
    filial: { findUnique: jest.fn() },
    pessoa: { findFirst: jest.fn() },
    cliente: { findFirst: jest.fn() },
    convenio: { findFirst: jest.fn() },
    produto: { count: jest.fn() },
    usuario: { findUnique: jest.fn() },
    $transaction: jest.fn((fn: (client: typeof tx) => unknown) => fn(tx)),
  };
  const service = new AgendaService(prismaMock as unknown as PrismaService);

  const escopoA: EscopoUsuario = {
    superadmin: false,
    usuarioId: 'u-a',
    empresaId: 'empresa-a',
    filialId: 'filial-a',
  };
  const superadmin: EscopoUsuario = { superadmin: true, usuarioId: 'root' };
  const filtroA = {
    id: 'agenda-b',
    empresaId: 'empresa-a',
    filialId: 'filial-a',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.agenda.findFirst.mockResolvedValue(null);
    prismaMock.filial.findUnique.mockResolvedValue({
      id: 'filial-a',
      empresaId: 'empresa-a',
    });
    prismaMock.pessoa.findFirst.mockResolvedValue({ id: 'pessoa-a' });
    prismaMock.cliente.findFirst.mockResolvedValue({ id: 'cliente-a' });
    prismaMock.convenio.findFirst.mockResolvedValue({ id: 'convenio-a' });
    prismaMock.produto.count.mockResolvedValue(1);
  });

  it('empresa A nao le agenda da empresa B', async () => {
    await expect(service.findById('agenda-b', escopoA)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prismaMock.agenda.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: filtroA }),
    );
  });

  it('atualiza pelo id da URL, ignorando o id do corpo', async () => {
    await expect(
      service.update(
        'agenda-b',
        { id: 'agenda-a', pessoaId: 'pessoa-a' },
        escopoA,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prismaMock.agenda.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: filtroA }),
    );
    expect(tx.agenda.update).not.toHaveBeenCalled();
  });

  it('empresa A nao remove agenda da empresa B', async () => {
    await expect(
      service.deleteById('agenda-b', escopoA),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.agenda.delete).not.toHaveBeenCalled();
    expect(tx.atendimento.delete).not.toHaveBeenCalled();
  });

  it('profissional so acessa a propria agenda', async () => {
    await expect(
      service.findById('agenda-b', { ...escopoA, profissionalId: 'u-a' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prismaMock.agenda.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ...filtroA, profissionalId: 'u-a' },
      }),
    );
  });

  it('update rejeita paciente de outra filial', async () => {
    prismaMock.agenda.findFirst.mockResolvedValue({
      filialId: 'filial-a',
      empresaId: 'empresa-a',
    });
    prismaMock.pessoa.findFirst.mockResolvedValue(null);

    const resposta = await service.update(
      'agenda-a',
      { pessoaId: 'pessoa-b' },
      escopoA,
    );

    expect(resposta.status).toBe(422);
    expect(prismaMock.pessoa.findFirst).toHaveBeenCalledWith({
      where: { id: 'pessoa-b', filialId: 'filial-a' },
      select: { id: true },
    });
    expect(tx.agenda.update).not.toHaveBeenCalled();
  });

  it('update usa o id da URL', async () => {
    prismaMock.agenda.findFirst.mockResolvedValue({
      filialId: 'filial-a',
      empresaId: 'empresa-a',
    });

    await service.update(
      'agenda-a',
      { id: 'agenda-b', pessoaId: 'p' },
      escopoA,
    );

    expect(tx.agenda.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'agenda-a' } }),
    );
  });

  it.each([
    ['pessoa', { pessoaId: 'pessoa-b' }],
    ['cliente', { clienteId: 'cliente-b' }],
    ['convenio', { convenioId: 'convenio-b' }],
  ] as const)('create rejeita %s de outra empresa', async (modelo, extra) => {
    prismaMock[modelo].findFirst.mockResolvedValue(null);

    const resposta = await service.create(
      { filialId: 'filial-a', dataHora: '2026-10-01T10:00:00Z', ...extra },
      escopoA,
    );

    expect(resposta.status).toBe(422);
    expect(tx.agenda.create).not.toHaveBeenCalled();
  });

  it('create rejeita produto de outra empresa nos itens da OS', async () => {
    prismaMock.produto.count.mockResolvedValue(0);

    const resposta = await service.create(
      {
        filialId: 'filial-a',
        dataHora: '2026-10-01T10:00:00Z',
        ordemServico: {
          itens: [{ produtoId: 'produto-b', quantidade: 1, valor_unitario: 1 }],
        },
      },
      escopoA,
    );

    expect(resposta.status).toBe(422);
    expect(prismaMock.produto.count).toHaveBeenCalledWith({
      where: { id: { in: ['produto-b'] }, empresaId: 'empresa-a' },
    });
  });

  it('create rejeita filial de outra empresa', async () => {
    prismaMock.filial.findUnique.mockResolvedValue({
      id: 'filial-b',
      empresaId: 'empresa-b',
    });

    const resposta = await service.create(
      { filialId: 'filial-b', dataHora: '2026-10-01T10:00:00Z' },
      { ...escopoA, filialId: undefined },
    );

    expect(resposta.status).toBe(422);
  });

  it('superadmin le e remove agenda de qualquer empresa', async () => {
    prismaMock.agenda.findFirst.mockResolvedValue({
      id: 'agenda-b',
      pessoa: null,
      profissional: null,
    });

    const resposta = await service.findById('agenda-b', superadmin);
    await service.deleteById('agenda-b', superadmin);

    expect(resposta.status).toBe(200);
    expect(prismaMock.agenda.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'agenda-b' } }),
    );
    expect(tx.agenda.delete).toHaveBeenCalledWith({
      where: { id: 'agenda-b' },
    });
  });
});
