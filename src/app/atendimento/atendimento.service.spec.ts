import {
  ConflictException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { StatusAtendimento } from '@prisma/client';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { AtendimentoService } from './atendimento.service';

describe('AtendimentoService.updateStatus', () => {
  const profissional: EscopoUsuario = {
    superadmin: false,
    empresaId: 'empresa-1',
    filialId: 'filial-1',
    profissionalId: 'usuario-ricardo',
  };
  const equipe: EscopoUsuario = {
    superadmin: false,
    empresaId: 'empresa-1',
    filialId: 'filial-1',
  };

  const tx = {
    atendimento: { update: jest.fn() },
    agenda: { update: jest.fn() },
  };
  const prismaMock = {
    atendimento: { findFirst: jest.fn(), delete: jest.fn() },
    prontuario: { count: jest.fn() },
    ordemServico: { findMany: jest.fn(), deleteMany: jest.fn() },
    $transaction: jest.fn((arg: unknown) =>
      typeof arg === 'function'
        ? (arg as (client: typeof tx) => unknown)(tx)
        : Promise.all(arg as Promise<unknown>[]),
    ),
  };
  const service = new AtendimentoService(
    prismaMock as unknown as PrismaService,
  );

  const hojeAs = (hora: number) => {
    const data = new Date();
    data.setHours(hora, 0, 0, 0);
    return data;
  };
  const amanha = () => {
    const data = hojeAs(9);
    data.setDate(data.getDate() + 1);
    return data;
  };

  const atendimentoEm = (dataAtendimento: Date) => ({
    id: 'atend-1',
    agendaId: null,
    dataAtendimento,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    tx.atendimento.update.mockResolvedValue({ id: 'atend-1', agendaId: null });
  });

  it('profissional inicia a consulta no dia do atendimento', async () => {
    prismaMock.atendimento.findFirst.mockResolvedValue(
      atendimentoEm(hojeAs(9)),
    );

    await service.updateStatus(
      'atend-1',
      StatusAtendimento.em_andamento,
      profissional,
    );

    expect(tx.atendimento.update).toHaveBeenCalledWith({
      where: { id: 'atend-1' },
      data: { status: StatusAtendimento.em_andamento },
    });
  });

  it('nao inicia a consulta antes do dia do atendimento', async () => {
    prismaMock.atendimento.findFirst.mockResolvedValue(atendimentoEm(amanha()));

    await expect(
      service.updateStatus(
        'atend-1',
        StatusAtendimento.em_andamento,
        profissional,
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(tx.atendimento.update).not.toHaveBeenCalled();
  });

  it.each([StatusAtendimento.em_andamento, StatusAtendimento.concluido])(
    'equipe da filial nao pode mudar para %s',
    async (status) => {
      prismaMock.atendimento.findFirst.mockResolvedValue(
        atendimentoEm(hojeAs(9)),
      );

      await expect(
        service.updateStatus('atend-1', status, equipe),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(tx.atendimento.update).not.toHaveBeenCalled();
    },
  );

  it('equipe da filial pode cancelar a consulta', async () => {
    prismaMock.atendimento.findFirst.mockResolvedValue(atendimentoEm(amanha()));

    await service.updateStatus('atend-1', StatusAtendimento.cancelado, equipe);

    expect(tx.atendimento.update).toHaveBeenCalled();
  });

  it('profissional so encontra os proprios atendimentos', async () => {
    prismaMock.atendimento.findFirst.mockResolvedValue(
      atendimentoEm(hojeAs(9)),
    );

    await service.updateStatus(
      'atend-1',
      StatusAtendimento.em_andamento,
      profissional,
    );

    expect(prismaMock.atendimento.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'atend-1',
        empresaId: 'empresa-1',
        profissionalId: 'usuario-ricardo',
      },
    });
  });

  it('equipe nao inicia a consulta pela edicao', async () => {
    prismaMock.atendimento.findFirst.mockResolvedValue({
      ...atendimentoEm(hojeAs(9)),
      status: StatusAtendimento.em_espera,
    });

    await expect(
      service.update(
        'atend-1',
        { status: StatusAtendimento.em_andamento },
        equipe,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('equipe nao cria consulta ja concluida', async () => {
    await expect(
      service.create(
        {
          pacienteId: 'pessoa-1',
          status: StatusAtendimento.concluido,
        },
        equipe,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  describe('excluir', () => {
    const osCom = (itens: number, vendas = 0, financeiro = 0) => ({
      id: 'os-1',
      _count: { itens, vendas, financeiro },
    });

    beforeEach(() => {
      prismaMock.atendimento.findFirst.mockResolvedValue(
        atendimentoEm(hojeAs(9)),
      );
      prismaMock.prontuario.count.mockResolvedValue(0);
    });

    it('exclui a consulta e a OS vazia criada junto', async () => {
      prismaMock.ordemServico.findMany.mockResolvedValue([osCom(0)]);

      await service.deleteById('atend-1', equipe);

      expect(prismaMock.ordemServico.deleteMany).toHaveBeenCalledWith({
        where: { atendimentoId: 'atend-1' },
      });
      expect(prismaMock.atendimento.delete).toHaveBeenCalledWith({
        where: { id: 'atend-1' },
      });
    });

    it.each([
      ['itens', osCom(2)],
      ['venda', osCom(0, 1)],
      ['lancamento financeiro', osCom(0, 0, 1)],
    ])('nao exclui consulta com OS que tem %s', async (_motivo, ordem) => {
      prismaMock.ordemServico.findMany.mockResolvedValue([ordem]);

      await expect(
        service.deleteById('atend-1', equipe),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prismaMock.atendimento.delete).not.toHaveBeenCalled();
    });

    it('nao exclui consulta com prontuario', async () => {
      prismaMock.prontuario.count.mockResolvedValue(1);
      prismaMock.ordemServico.findMany.mockResolvedValue([]);

      await expect(
        service.deleteById('atend-1', equipe),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
