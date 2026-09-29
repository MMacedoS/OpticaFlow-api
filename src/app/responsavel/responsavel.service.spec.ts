import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateResponsavelDto,
  UpdateResponsavelDto,
} from './dto/responsavel.dto';
import { ResponsavelService } from './responsavel.service';

describe('ResponsavelService (escopo multiempresa)', () => {
  let service: ResponsavelService;

  const empresaA: EscopoUsuario = {
    superadmin: false,
    usuarioId: 'u-a',
    empresaId: 'empresa-a',
  };
  const filialA1: EscopoUsuario = { ...empresaA, filialId: 'filial-a1' };
  const superadmin: EscopoUsuario = { superadmin: true, usuarioId: 'root' };

  const filiais = [
    { id: 'filial-a1', empresaId: 'empresa-a' },
    { id: 'filial-a2', empresaId: 'empresa-a' },
    { id: 'filial-b', empresaId: 'empresa-b' },
  ];

  const responsavelB = {
    id: 'resp-b',
    pessoaId: 'pessoa-b',
    createdAt: new Date(),
    updatedAt: new Date(),
    pessoa: {
      nome: 'Resp B',
      cpf: null,
      email: 'b@b.com',
      filialId: 'filial-b',
      empresaId: 'empresa-b',
      usuario: {
        id: 'u-b',
        email: 'b@b.com',
        username: 'b',
        empresaId: 'empresa-b',
        superadmin: false,
      },
    },
  };

  const tx = {
    pessoa: { create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    usuario: { create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    responsavel: { create: jest.fn() },
  };

  const prismaMock = {
    filial: { findFirst: jest.fn() },
    responsavel: { findFirst: jest.fn(), findMany: jest.fn() },
    pessoa: { findUnique: jest.fn() },
    usuario: { findUnique: jest.fn() },
    $transaction: jest.fn((fn: (client: typeof tx) => unknown) => fn(tx)),
  };

  /** Simula o filtro de escopo aplicado pelo Prisma. */
  const simularResponsaveis = (registros: (typeof responsavelB)[]) =>
    prismaMock.responsavel.findFirst.mockImplementation(
      ({ where }: { where: Record<string, any> }) =>
        registros.find(
          (r) =>
            r.id === where.id &&
            (!where.pessoa?.filial ||
              r.pessoa.empresaId === where.pessoa.filial.empresaId) &&
            (!where.pessoa?.filialId ||
              r.pessoa.filialId === where.pessoa.filialId),
        ) ?? null,
    );

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResponsavelService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(ResponsavelService);

    prismaMock.filial.findFirst.mockImplementation(
      ({ where }: { where: { id: string; empresaId?: string } }) =>
        filiais.find(
          (f) =>
            f.id === where.id &&
            (where.empresaId === undefined || f.empresaId === where.empresaId),
        ) ?? null,
    );
    simularResponsaveis([responsavelB]);
    prismaMock.responsavel.findMany.mockResolvedValue([]);
    prismaMock.pessoa.findUnique.mockResolvedValue(null);
    prismaMock.usuario.findUnique.mockResolvedValue(null);
  });

  describe('create', () => {
    const dto: CreateResponsavelDto = {
      nome: 'Novo',
      email: 'novo@x.com',
      senha: '123456',
      filialId: 'filial-b',
    };

    it('empresa A nao cria responsavel em filial da empresa B', async () => {
      await expect(service.create(dto, empresaA)).resolves.toMatchObject({
        status: 422,
        message: 'Filial não encontrada.',
      });
      expect(tx.usuario.create).not.toHaveBeenCalled();
    });

    it('usuario de filial nao cria em outra filial da propria empresa', async () => {
      await expect(
        service.create({ ...dto, filialId: 'filial-a2' }, filialA1),
      ).resolves.toMatchObject({ status: 422 });
      expect(tx.usuario.create).not.toHaveBeenCalled();
    });

    it('cria na filial da propria empresa sem retornar senha', async () => {
      tx.pessoa.create.mockResolvedValue({ id: 'pessoa-novo' });
      tx.responsavel.create.mockResolvedValue({
        id: 'resp-novo',
        pessoaId: 'pessoa-novo',
        pessoa: { nome: 'Novo', filialId: 'filial-a1' },
      });

      const resposta = await service.create(
        { ...dto, filialId: 'filial-a1' },
        filialA1,
      );

      expect(resposta.status).toBe(201);
      expect(JSON.stringify(resposta)).not.toContain('senha');
      expect(tx.usuario.create.mock.calls[0][0].data.empresaId).toBe(
        'empresa-a',
      );
    });
  });

  describe('leitura', () => {
    it('empresa A nao le responsavel da empresa B', async () => {
      await expect(service.findById('resp-b', empresaA)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('empresa A nao lista responsaveis de filial da empresa B', async () => {
      await expect(
        service.findAllByFilial('filial-b', empresaA),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.responsavel.findMany).not.toHaveBeenCalled();
    });

    it('superadmin le qualquer responsavel sem senha', async () => {
      const resposta = await service.findById('resp-b', superadmin);

      expect(resposta.status).toBe(200);
      const select =
        prismaMock.responsavel.findFirst.mock.calls[0][0].select.pessoa.select
          .usuario.select;
      expect(select.senha).toBeUndefined();
    });
  });

  describe('update e delete', () => {
    const dto: UpdateResponsavelDto = { senha: 'nova-senha' };

    it('empresa A nao altera nem exclui responsavel da empresa B', async () => {
      await expect(
        service.update('resp-b', dto, empresaA),
      ).rejects.toBeInstanceOf(NotFoundException);
      await expect(
        service.deleteById('resp-b', empresaA),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('nao move responsavel para filial de outra empresa', async () => {
      simularResponsaveis([
        {
          ...responsavelB,
          id: 'resp-a',
          pessoa: {
            ...responsavelB.pessoa,
            filialId: 'filial-a1',
            empresaId: 'empresa-a',
          },
        },
      ]);

      await expect(
        service.update('resp-a', { filialId: 'filial-b' }, empresaA),
      ).resolves.toMatchObject({ status: 422 });
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('usuario comum nao altera usuario superadmin vinculado', async () => {
      simularResponsaveis([
        {
          ...responsavelB,
          id: 'resp-a',
          pessoa: {
            ...responsavelB.pessoa,
            filialId: 'filial-a1',
            empresaId: 'empresa-a',
            usuario: { ...responsavelB.pessoa.usuario, superadmin: true },
          },
        },
      ]);

      await expect(
        service.update('resp-a', dto, empresaA),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        service.deleteById('resp-a', empresaA),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('superadmin altera e exclui responsavel de qualquer empresa', async () => {
      await expect(
        service.update('resp-b', dto, superadmin),
      ).resolves.toMatchObject({ status: 200 });
      expect(tx.usuario.update).toHaveBeenCalled();

      await expect(
        service.deleteById('resp-b', superadmin),
      ).resolves.toMatchObject({ status: 200 });
      expect(tx.usuario.delete).toHaveBeenCalledWith({ where: { id: 'u-b' } });
    });
  });
});
