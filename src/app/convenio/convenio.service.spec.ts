import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConvenioService } from './convenio.service';

describe('ConvenioService (escopo multi-empresa)', () => {
  const empresaA: EscopoUsuario = { superadmin: false, empresaId: 'empresa-a' };
  const superadmin: EscopoUsuario = { superadmin: true };

  const prismaMock = {
    empresa: { findUnique: jest.fn() },
    convenio: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const service = new ConvenioService(prismaMock as unknown as PrismaService);

  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('ignora empresaId do corpo e cria na empresa do usuario', async () => {
      prismaMock.empresa.findUnique.mockResolvedValue({ id: 'empresa-a' });
      prismaMock.convenio.findFirst.mockResolvedValue(null);
      prismaMock.convenio.create.mockResolvedValue({ id: 'conv-1' });

      await service.create(
        { nome: 'Unimed', empresaId: 'empresa-b' },
        empresaA,
      );

      expect(prismaMock.convenio.create).toHaveBeenCalledWith({
        data: { empresaId: 'empresa-a', nome: 'Unimed', registro: undefined },
      });
    });

    it('superadmin escolhe a empresa', async () => {
      prismaMock.empresa.findUnique.mockResolvedValue({ id: 'empresa-b' });
      prismaMock.convenio.findFirst.mockResolvedValue(null);
      prismaMock.convenio.create.mockResolvedValue({ id: 'conv-1' });

      await service.create(
        { nome: 'Unimed', empresaId: 'empresa-b' },
        superadmin,
      );

      expect(prismaMock.convenio.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ empresaId: 'empresa-b' }),
      });
    });

    it('superadmin sem empresa informada e rejeitado', async () => {
      await expect(
        service.create({ nome: 'Unimed' }, superadmin),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  it('findAll lista somente convenios da empresa do usuario', async () => {
    prismaMock.convenio.findMany.mockResolvedValue([]);

    await service.findAll(empresaA);
    expect(prismaMock.convenio.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { empresaId: 'empresa-a' } }),
    );

    await service.findAll(superadmin);
    expect(prismaMock.convenio.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it('empresa A nao le convenio da empresa B', async () => {
    prismaMock.convenio.findFirst.mockResolvedValue(null);

    await expect(service.findById('conv-b', empresaA)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prismaMock.convenio.findFirst).toHaveBeenCalledWith({
      where: { id: 'conv-b', empresaId: 'empresa-a' },
    });
  });

  it('empresa A nao altera convenio da empresa B', async () => {
    prismaMock.convenio.findFirst.mockResolvedValue(null);

    await expect(
      service.update('conv-b', { nome: 'Novo' }, empresaA),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.updateStatus('conv-b', 'inativo', empresaA),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prismaMock.convenio.update).not.toHaveBeenCalled();
  });

  it('empresa A nao exclui convenio da empresa B', async () => {
    prismaMock.convenio.findFirst.mockResolvedValue(null);

    await expect(service.deleteById('conv-b', empresaA)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prismaMock.convenio.delete).not.toHaveBeenCalled();
  });

  it('superadmin le e exclui convenio de qualquer empresa', async () => {
    prismaMock.convenio.findFirst.mockResolvedValue({
      id: 'conv-b',
      empresaId: 'empresa-b',
      clientes: [],
      atendimentos: [],
    });

    const leitura = await service.findById('conv-b', superadmin);
    expect(leitura.status).toBe(200);
    expect(prismaMock.convenio.findFirst).toHaveBeenCalledWith({
      where: { id: 'conv-b' },
    });

    const exclusao = await service.deleteById('conv-b', superadmin);
    expect(exclusao.status).toBe(200);
    expect(prismaMock.convenio.delete).toHaveBeenCalledWith({
      where: { id: 'conv-b' },
    });
  });
});
