import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TipoReceita } from '@prisma/client';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { ReceitaService } from './receita.service';

describe('ReceitaService', () => {
  let service: ReceitaService;

  // Quem grava e o profissional do atendimento.
  const escopo: EscopoUsuario = {
    superadmin: false,
    empresaId: 'empresa-1',
    profissionalId: 'usuario-1',
  };
  const escopoEquipe: EscopoUsuario = {
    superadmin: false,
    empresaId: 'empresa-1',
    filialId: 'filial-1',
  };

  const prismaMock = {
    prontuario: { findFirst: jest.fn() },
    receita: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const prontuarioBase = {
    id: 'pront-1',
    empresaId: 'empresa-1',
    filialId: 'filial-1',
    atendimentoId: 'atend-1',
    pacienteId: 'pessoa-1',
    profissionalId: 'usuario-1',
    refracao: {
      od_esferico: '-2.00',
      od_cilindrico: '-0.75',
      od_eixo: '90',
      oe_esferico: '-1.75',
      oe_cilindrico: null,
      oe_eixo: null,
      dp: '63',
      adicao: null,
      observacoes: 'nao deve ser copiada',
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReceitaService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(ReceitaService);
    prismaMock.receita.create.mockResolvedValue({ id: 'rec-1' });
  });

  it('receita de oculos sem valores copia a refracao do prontuario', async () => {
    prismaMock.prontuario.findFirst.mockResolvedValue(prontuarioBase);

    await service.create(
      { prontuarioId: 'pront-1', tipo: TipoReceita.oculos },
      escopo,
    );

    const { data } = prismaMock.receita.create.mock.calls[0][0];
    expect(data).toMatchObject({
      empresaId: 'empresa-1',
      pacienteId: 'pessoa-1',
      profissionalId: 'usuario-1',
      tipo: TipoReceita.oculos,
    });
    expect(data.oculos.create).toEqual({
      od_esferico: '-2.00',
      od_cilindrico: '-0.75',
      od_eixo: '90',
      oe_esferico: '-1.75',
      oe_cilindrico: null,
      oe_eixo: null,
      dp: '63',
      adicao: null,
    });
  });

  it('usa os valores informados em vez da refracao', async () => {
    prismaMock.prontuario.findFirst.mockResolvedValue(prontuarioBase);

    await service.create(
      {
        prontuarioId: 'pront-1',
        tipo: TipoReceita.oculos,
        oculos: { od_esferico: '-3.00' },
      },
      escopo,
    );

    const { data } = prismaMock.receita.create.mock.calls[0][0];
    expect(data.oculos.create).toEqual({ od_esferico: '-3.00' });
  });

  it('oculos sem refracao e sem valores responde 422', async () => {
    prismaMock.prontuario.findFirst.mockResolvedValue({
      ...prontuarioBase,
      refracao: null,
    });

    await expect(
      service.create(
        { prontuarioId: 'pront-1', tipo: TipoReceita.oculos },
        escopo,
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('medicamento exige os dados do medicamento', async () => {
    prismaMock.prontuario.findFirst.mockResolvedValue(prontuarioBase);

    await expect(
      service.create(
        { prontuarioId: 'pront-1', tipo: TipoReceita.medicamento },
        escopo,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('recusa dados de outro tipo de receita', async () => {
    await expect(
      service.create(
        {
          prontuarioId: 'pront-1',
          tipo: TipoReceita.oculos,
          medicamento: { medicamento: 'Colirio' },
        },
        escopo,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaMock.prontuario.findFirst).not.toHaveBeenCalled();
  });

  it('nao emite receita de prontuario de outra empresa', async () => {
    prismaMock.prontuario.findFirst.mockResolvedValue(null);

    await expect(
      service.create(
        { prontuarioId: 'pront-x', tipo: TipoReceita.oculos },
        escopo,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prismaMock.prontuario.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'pront-x',
          empresaId: 'empresa-1',
          profissionalId: 'usuario-1',
        },
      }),
    );
  });

  it('atualizacao nao troca o tipo da receita', async () => {
    prismaMock.receita.findFirst.mockResolvedValue({
      tipo: TipoReceita.lente_contato,
    });

    await expect(
      service.update('rec-1', { oculos: { od_esferico: '-1.00' } }, escopo),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaMock.receita.update).not.toHaveBeenCalled();
  });

  it('recusa receita emitida por quem nao e o profissional', async () => {
    await expect(
      service.create(
        { prontuarioId: 'pront-1', tipo: TipoReceita.oculos },
        escopoEquipe,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.deleteById('rec-1', escopoEquipe),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
