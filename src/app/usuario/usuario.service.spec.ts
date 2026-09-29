import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/createUsuario.dto';
import { UpdateUsuarioDto } from './dto/updateUsuario.dto';
import { UsuarioService } from './usuario.service';

describe('UsuarioService (escopo multiempresa)', () => {
  let service: UsuarioService;

  const empresaA: EscopoUsuario = {
    superadmin: false,
    usuarioId: 'u-a',
    empresaId: 'empresa-a',
  };
  const superadmin: EscopoUsuario = { superadmin: true, usuarioId: 'root' };

  const usuarioB = {
    id: 'u-b',
    email: 'b@b.com',
    username: 'b',
    pessoaId: null,
    empresaId: 'empresa-b',
    status: 'ativo',
    superadmin: false,
    senha: 'HASH-SECRETO',
  };

  const tx = {
    usuario: { create: jest.fn() },
    acesso: { findMany: jest.fn() },
    atribuicao: { createMany: jest.fn() },
  };

  const prismaMock = {
    usuario: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    pessoa: { findFirst: jest.fn() },
    $transaction: jest.fn((fn: (client: typeof tx) => unknown) => fn(tx)),
  };

  /**
   * Simula o banco: aplica id/email/empresaId/superadmin do where e respeita
   * o select (como o Prisma), para provar que a senha nao sai.
   */
  const simularFindFirst = (registros: (typeof usuarioB)[]) =>
    prismaMock.usuario.findFirst.mockImplementation(
      ({
        where,
        select,
      }: {
        where: Record<string, any>;
        select?: Record<string, boolean>;
      }) => {
        const achado = registros.find(
          (u) =>
            (where.id === undefined || u.id === where.id) &&
            (where.email === undefined ||
              u.email.toLowerCase() === where.email.equals.toLowerCase()) &&
            (where.empresaId === undefined ||
              u.empresaId === where.empresaId) &&
            (where.superadmin === undefined ||
              u.superadmin === where.superadmin),
        );
        if (!achado) return null;
        if (!select) return achado;
        return Object.fromEntries(
          Object.keys(select).map((k) => [k, (achado as any)[k]]),
        );
      },
    );

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuarioService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(UsuarioService);
    simularFindFirst([usuarioB]);
    prismaMock.usuario.findMany.mockResolvedValue([]);
    prismaMock.usuario.count.mockResolvedValue(0);
    tx.acesso.findMany.mockResolvedValue([{ id: 'acesso-1' }]);
  });

  describe('leitura', () => {
    it('empresa A nao le usuario da empresa B por id nem por email', async () => {
      await expect(
        service.findByIdNoEscopo('u-b', empresaA),
      ).rejects.toBeInstanceOf(NotFoundException);
      await expect(
        service.findByEmailNoEscopo('b@b.com', empresaA),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('superadmin le qualquer usuario e a senha nunca e retornada', async () => {
      const porId = await service.findByIdNoEscopo('u-b', superadmin);
      const porEmail = await service.findByEmailNoEscopo('B@b.com', superadmin);

      expect(porId).toMatchObject({ id: 'u-b' });
      expect(porEmail).toMatchObject({ id: 'u-b' });
      expect(porId).not.toHaveProperty('senha');
      expect(porEmail).not.toHaveProperty('senha');
    });

    it('usuario comum nao enxerga superadmins da propria empresa', async () => {
      simularFindFirst([
        { ...usuarioB, id: 'root', empresaId: 'empresa-a', superadmin: true },
      ]);

      await expect(
        service.findByIdNoEscopo('root', empresaA),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('listagem filtra pela empresa do usuario e nao seleciona senha', async () => {
      await service.findAll(empresaA, 1, 10, 'x');

      const args = prismaMock.usuario.findMany.mock.calls[0][0];
      expect(args.where).toMatchObject({
        empresaId: 'empresa-a',
        superadmin: false,
      });
      expect(args.select.senha).toBeUndefined();
      expect(prismaMock.usuario.count.mock.calls[0][0].where).toMatchObject({
        empresaId: 'empresa-a',
      });
    });

    it('superadmin lista todos', async () => {
      await service.findAll(superadmin);

      const args = prismaMock.usuario.findMany.mock.calls[0][0];
      expect(args.where.empresaId).toBeUndefined();
    });
  });

  describe('alteracao', () => {
    const dto = {
      email: 'hacker@a.com',
      username: 'hacker',
      senha: 'nova-senha',
    } as UpdateUsuarioDto;

    it('empresa A nao altera, muda status nem exclui usuario da empresa B', async () => {
      await expect(service.update('u-b', dto, empresaA)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(
        service.updateStatus('u-b', 'inativo', empresaA),
      ).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.deleteById('u-b', empresaA)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prismaMock.usuario.update).not.toHaveBeenCalled();
      expect(prismaMock.usuario.delete).not.toHaveBeenCalled();
    });

    it('usuario comum nao altera superadmin da propria empresa', async () => {
      simularFindFirst([
        { ...usuarioB, id: 'root', empresaId: 'empresa-a', superadmin: true },
      ]);

      await expect(
        service.update('root', dto, empresaA),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.usuario.update).not.toHaveBeenCalled();
    });

    it('rejeita vincular pessoa de outra empresa', async () => {
      simularFindFirst([{ ...usuarioB, empresaId: 'empresa-a' }]);
      prismaMock.pessoa.findFirst.mockResolvedValue(null);

      await expect(
        service.update('u-b', { ...dto, pessoaId: 'pessoa-b' }, empresaA),
      ).resolves.toMatchObject({ status: 422 });
      expect(prismaMock.pessoa.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pessoa-b', filial: { empresaId: 'empresa-a' } },
        }),
      );
      expect(prismaMock.usuario.update).not.toHaveBeenCalled();
    });

    it('superadmin altera qualquer usuario sem retornar a senha', async () => {
      prismaMock.usuario.update.mockResolvedValue({
        id: 'u-b',
        email: 'hacker@a.com',
        username: 'hacker',
        pessoaId: null,
      });

      const resposta = await service.update('u-b', dto, superadmin);

      expect(resposta.status).toBe(200);
      expect(resposta.data).not.toHaveProperty('senha');
      const args = prismaMock.usuario.update.mock.calls[0][0];
      expect(args.select.senha).toBeUndefined();
      expect(args.data.senha).toEqual(expect.any(String));
    });

    it('superadmin exclui usuario de qualquer empresa', async () => {
      await expect(
        service.deleteById('u-b', superadmin),
      ).resolves.toMatchObject({ status: 200 });
      expect(prismaMock.usuario.delete).toHaveBeenCalledWith({
        where: { id: 'u-b' },
      });
    });
  });

  describe('create', () => {
    const dto = {
      email: 'novo@a.com',
      senha: '123456',
      username: 'novo',
    } as CreateUsuarioDto;

    beforeEach(() => {
      prismaMock.usuario.findFirst.mockResolvedValue(null);
      tx.usuario.create.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) => ({
          id: 'novo',
          ...data,
        }),
      );
    });

    it('rejeita pessoa de outra empresa', async () => {
      prismaMock.pessoa.findFirst.mockResolvedValue(null);

      await expect(
        service.create({ ...dto, pessoaId: 'pessoa-b' }, empresaA),
      ).resolves.toMatchObject({ status: 422 });
      expect(tx.usuario.create).not.toHaveBeenCalled();
    });

    it('usuario comum cria na propria empresa, sem perfis e sem expor senha', async () => {
      prismaMock.pessoa.findFirst.mockResolvedValue({
        id: 'pessoa-a',
        filial: { empresaId: 'empresa-a' },
      });

      const resposta = await service.create(
        { ...dto, pessoaId: 'pessoa-a' },
        empresaA,
      );

      expect(resposta.status).toBe(201);
      expect(resposta.data).not.toHaveProperty('senha');
      expect(tx.usuario.create.mock.calls[0][0].data.empresaId).toBe(
        'empresa-a',
      );
      expect(tx.atribuicao.createMany).not.toHaveBeenCalled();
    });

    it('superadmin cria na empresa da pessoa e recebe perfis padrao', async () => {
      prismaMock.pessoa.findFirst.mockResolvedValue({
        id: 'pessoa-b',
        filial: { empresaId: 'empresa-b' },
      });

      await service.create({ ...dto, pessoaId: 'pessoa-b' }, superadmin);

      expect(prismaMock.pessoa.findFirst.mock.calls[0][0].where).toEqual({
        id: 'pessoa-b',
      });
      expect(tx.usuario.create.mock.calls[0][0].data.empresaId).toBe(
        'empresa-b',
      );
      expect(tx.atribuicao.createMany).toHaveBeenCalled();
    });
  });
});
