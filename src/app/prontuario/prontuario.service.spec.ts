import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StatusAtendimento } from '@prisma/client';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { ProntuarioService } from './prontuario.service';

describe('ProntuarioService', () => {
  let service: ProntuarioService;

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
    atendimento: { findFirst: jest.fn() },
    prontuario: {
      create: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    prontuarioRefracao: { upsert: jest.fn(), deleteMany: jest.fn() },
    prontuarioDiagnostico: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const atendimentoBase = {
    id: 'atend-1',
    empresaId: 'empresa-1',
    filialId: 'filial-1',
    pacienteId: 'pessoa-1',
    profissionalId: 'usuario-1',
    status: StatusAtendimento.em_andamento,
    prontuario: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProntuarioService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(ProntuarioService);
  });

  describe('create', () => {
    it('abre o prontuario com os dados do atendimento', async () => {
      prismaMock.atendimento.findFirst.mockResolvedValue(atendimentoBase);
      prismaMock.prontuario.create.mockResolvedValue({ id: 'pront-1' });

      const resposta = await service.create(
        { atendimentoId: 'atend-1' },
        escopo,
      );

      expect(prismaMock.atendimento.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'atend-1',
            empresaId: 'empresa-1',
            profissionalId: 'usuario-1',
          },
        }),
      );
      expect(prismaMock.prontuario.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            empresaId: 'empresa-1',
            filialId: 'filial-1',
            pacienteId: 'pessoa-1',
            profissionalId: 'usuario-1',
          }),
        }),
      );
      expect(resposta.status).toBe(201);
    });

    it('nao encontra atendimento de outra empresa', async () => {
      prismaMock.atendimento.findFirst.mockResolvedValue(null);

      await expect(
        service.create({ atendimentoId: 'atend-x' }, escopo),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('recusa atendimento cancelado', async () => {
      prismaMock.atendimento.findFirst.mockResolvedValue({
        ...atendimentoBase,
        status: StatusAtendimento.cancelado,
      });

      await expect(
        service.create({ atendimentoId: 'atend-1' }, escopo),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('recusa atendimento que ja tem prontuario', async () => {
      prismaMock.atendimento.findFirst.mockResolvedValue({
        ...atendimentoBase,
        prontuario: { id: 'pront-1' },
      });

      await expect(
        service.create({ atendimentoId: 'atend-1' }, escopo),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it.each([
      ['a equipe da filial', escopoEquipe],
      ['o superadmin', { superadmin: true }],
    ])('recusa abertura feita por %s', async (_quem, escopoSemProfissional) => {
      await expect(
        service.create({ atendimentoId: 'atend-1' }, escopoSemProfissional),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prismaMock.prontuario.create).not.toHaveBeenCalled();
    });
  });

  describe('secoes', () => {
    it('salva a refracao com upsert', async () => {
      prismaMock.prontuario.count.mockResolvedValue(1);
      prismaMock.prontuarioRefracao.upsert.mockResolvedValue({ id: 'r-1' });

      const dados = { od_esferico: '-1.25', oe_esferico: '-1.00' };
      await service.salvarSecao('pront-1', 'refracao', dados, escopo);

      expect(prismaMock.prontuarioRefracao.upsert).toHaveBeenCalledWith({
        where: { prontuarioId: 'pront-1' },
        create: { ...dados, prontuarioId: 'pront-1' },
        update: dados,
      });
    });

    it('nao salva secao de prontuario fora do escopo', async () => {
      prismaMock.prontuario.count.mockResolvedValue(0);

      await expect(
        service.salvarSecao('pront-x', 'refracao', {}, escopo),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.prontuarioRefracao.upsert).not.toHaveBeenCalled();
    });

    it('remover secao inexistente responde 404', async () => {
      prismaMock.prontuario.count.mockResolvedValue(1);
      prismaMock.prontuarioRefracao.deleteMany.mockResolvedValue({ count: 0 });

      await expect(
        service.removerSecao('pront-1', 'refracao', escopo),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('nao atualiza item que pertence a outro prontuario', async () => {
      prismaMock.prontuario.count.mockResolvedValue(1);
      prismaMock.prontuarioDiagnostico.findUnique.mockResolvedValue({
        prontuarioId: 'outro',
      });

      await expect(
        service.atualizarItem(
          'pront-1',
          'diagnosticos',
          'diag-1',
          { codigo: 'H52.1', versao: 'CID-10' },
          escopo,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.prontuarioDiagnostico.update).not.toHaveBeenCalled();
    });
  });
});
