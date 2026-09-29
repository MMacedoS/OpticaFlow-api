import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmpresaDto } from './dto/createEmpresa.dto';
import { UpdateEmpresaDto } from './dto/updateEmpresa.dto';
import { EmpresaService } from './empresa.service';

describe('EmpresaService (escopo multiempresa)', () => {
  let service: EmpresaService;

  const empresaA: EscopoUsuario = {
    superadmin: false,
    usuarioId: 'u-a',
    empresaId: 'empresa-a',
  };
  const superadmin: EscopoUsuario = { superadmin: true, usuarioId: 'root' };

  const tx = {
    empresa: { update: jest.fn(), delete: jest.fn() },
    usuario: { updateMany: jest.fn(), deleteMany: jest.fn() },
  };

  const prismaMock = {
    empresa: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    usuario: { findUnique: jest.fn() },
    $transaction: jest.fn((fn: (client: typeof tx) => unknown) => fn(tx)),
  };

  const dtoUpdate = {
    nome: 'Nova',
    status: 'inativo',
  } as unknown as UpdateEmpresaDto;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmpresaService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(EmpresaService);
    prismaMock.empresa.findMany.mockResolvedValue([]);
    prismaMock.empresa.count.mockResolvedValue(0);
    prismaMock.empresa.findUnique.mockImplementation(
      ({ where }: { where: { id: string } }) => ({ id: where.id }),
    );
    prismaMock.empresa.update.mockResolvedValue({ id: 'empresa-a' });
  });

  describe('findAll', () => {
    it('usuario comum lista somente a propria empresa', async () => {
      await service.findAll(empresaA, 1, 10, '', '');

      const where = prismaMock.empresa.findMany.mock.calls[0][0].where;
      expect(where.id).toBe('empresa-a');
      expect(prismaMock.empresa.count.mock.calls[0][0].where.id).toBe(
        'empresa-a',
      );
    });

    it('superadmin lista todas as empresas', async () => {
      await service.findAll(superadmin, 1, 10, '', '');

      const where = prismaMock.empresa.findMany.mock.calls[0][0].where;
      expect(where.id).toBeUndefined();
    });
  });

  describe('create', () => {
    it('usuario comum nao pode criar empresas', async () => {
      await expect(
        service.create({} as CreateEmpresaDto, empresaA),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prismaMock.empresa.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('empresa A nao altera empresa B', async () => {
      await expect(
        service.update('empresa-b', dtoUpdate, empresaA),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.empresa.update).not.toHaveBeenCalled();
    });

    it('empresa A altera a propria empresa, sem mudar o status', async () => {
      await service.update('empresa-a', dtoUpdate, empresaA);

      const args = prismaMock.empresa.update.mock.calls[0][0];
      expect(args.where).toEqual({ id: 'empresa-a' });
      expect(args.data.status).toBeUndefined();
    });

    it('superadmin altera qualquer empresa', async () => {
      await service.update('empresa-b', dtoUpdate, superadmin);

      const args = prismaMock.empresa.update.mock.calls[0][0];
      expect(args.where).toEqual({ id: 'empresa-b' });
      expect(args.data.status).toBe('inativo');
    });

    it('empresa inexistente retorna 404 mesmo para superadmin', async () => {
      prismaMock.empresa.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nao-existe', dtoUpdate, superadmin),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateStatus e deleteById', () => {
    it('usuario comum nao altera status nem da propria empresa', async () => {
      await expect(
        service.updateStatus('empresa-a', 'inativo', empresaA),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(tx.empresa.update).not.toHaveBeenCalled();
    });

    it('usuario comum nao exclui empresas', async () => {
      await expect(
        service.deleteById('empresa-b', empresaA),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(tx.empresa.delete).not.toHaveBeenCalled();
    });

    it('superadmin altera status e exclui', async () => {
      tx.empresa.update.mockResolvedValue({ id: 'empresa-b' });

      await expect(
        service.updateStatus('empresa-b', 'inativo', superadmin),
      ).resolves.toMatchObject({ status: 200 });
      await expect(
        service.deleteById('empresa-b', superadmin),
      ).resolves.toMatchObject({ status: 200 });
      expect(tx.empresa.delete).toHaveBeenCalledWith({
        where: { id: 'empresa-b' },
      });
    });
  });
});
