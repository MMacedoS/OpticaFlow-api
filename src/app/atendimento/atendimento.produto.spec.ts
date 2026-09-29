import { UnprocessableEntityException } from '@nestjs/common';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { AtendimentoService } from './atendimento.service';

describe('AtendimentoService.create - produtos da OS', () => {
  const escopo: EscopoUsuario = {
    superadmin: false,
    empresaId: 'empresa-1',
    filialId: 'filial-1',
  };

  const tx = {
    atendimento: { create: jest.fn().mockResolvedValue({ id: 'atend-1' }) },
    ordemServico: { create: jest.fn().mockResolvedValue({ id: 'os-1' }) },
    ordemServicoItem: { createMany: jest.fn() },
  };
  const prismaMock = {
    filial: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: 'filial-1', empresaId: 'empresa-1' }),
    },
    pessoa: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: 'paciente-1', filialId: 'filial-1' }),
    },
    produto: { count: jest.fn() },
    $transaction: jest.fn((fn: (client: typeof tx) => unknown) => fn(tx)),
  };
  const service = new AtendimentoService(
    prismaMock as unknown as PrismaService,
  );

  const dto = (produtoId: string) =>
    ({
      pacienteId: 'paciente-1',
      ordemServico: {
        itens: [
          { produtoId, quantidade: 1, valor_unitario: 10 },
          { descricao_servico: 'Montagem', quantidade: 1, valor_unitario: 5 },
        ],
      },
    }) as never;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(service, 'findById').mockResolvedValue({ status: 201 } as never);
  });

  it('rejeita produto de outra empresa', async () => {
    prismaMock.produto.count.mockResolvedValue(0);

    await expect(
      service.create(dto('produto-empresa-2'), escopo),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(prismaMock.produto.count).toHaveBeenCalledWith({
      where: { id: { in: ['produto-empresa-2'] }, empresaId: 'empresa-1' },
    });
    expect(tx.atendimento.create).not.toHaveBeenCalled();
  });

  it('aceita produto da propria empresa', async () => {
    prismaMock.produto.count.mockResolvedValue(1);

    await service.create(dto('produto-1'), escopo);

    expect(tx.ordemServicoItem.createMany).toHaveBeenCalled();
  });
});
