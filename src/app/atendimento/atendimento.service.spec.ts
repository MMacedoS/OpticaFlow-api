import {
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
    atendimento: { findFirst: jest.fn() },
    $transaction: jest.fn((fn: (client: typeof tx) => unknown) => fn(tx)),
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
});
