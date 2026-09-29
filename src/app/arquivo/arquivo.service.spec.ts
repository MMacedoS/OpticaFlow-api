import { NotFoundException } from '@nestjs/common';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { ArquivoService } from './arquivo.service';

describe('ArquivoService - isolamento entre empresas', () => {
  const prismaMock = {
    arquivo: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({ id: 'arq-1' }),
      update: jest.fn(),
      delete: jest.fn(),
    },
    empresa: { findUnique: jest.fn() },
    filial: { findUnique: jest.fn() },
    pessoa: { findUnique: jest.fn() },
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
  };
  const service = new ArquivoService(prismaMock as unknown as PrismaService);

  const empresaA: EscopoUsuario = {
    superadmin: false,
    usuarioId: 'u-a',
    empresaId: 'empresa-a',
  };
  const filialA: EscopoUsuario = { ...empresaA, filialId: 'filial-a' };
  const superadmin: EscopoUsuario = { superadmin: true, usuarioId: 'root' };

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.arquivo.findFirst.mockResolvedValue(null);
    prismaMock.empresa.findUnique.mockImplementation(
      ({ where }: { where: { id: string } }) => ({ id: where.id }),
    );
  });

  it('ignora o empresaId do corpo e grava na empresa do usuario', async () => {
    await service.create(
      { empresaId: 'empresa-b', nome: 'exame.pdf', path: '/x' },
      empresaA,
    );

    expect(prismaMock.arquivo.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ empresaId: 'empresa-a' }),
    });
  });

  it('usuario de filial grava na propria filial', async () => {
    prismaMock.filial.findUnique.mockResolvedValue({
      id: 'filial-a',
      empresaId: 'empresa-a',
    });

    await service.create({ nome: 'exame.pdf', path: '/x' }, filialA);

    expect(prismaMock.arquivo.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        empresaId: 'empresa-a',
        filialId: 'filial-a',
      }),
    });
  });

  it('superadmin escolhe a empresa pelo corpo', async () => {
    await service.create(
      { empresaId: 'empresa-b', nome: 'exame.pdf', path: '/x' },
      superadmin,
    );

    expect(prismaMock.arquivo.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ empresaId: 'empresa-b' }),
    });
  });

  it('nao lista arquivos de outra empresa', async () => {
    await expect(
      service.findAllByEmpresa('empresa-b', empresaA),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prismaMock.arquivo.findMany).not.toHaveBeenCalled();
  });

  it('superadmin lista arquivos de qualquer empresa', async () => {
    const resposta = await service.findAllByEmpresa('empresa-b', superadmin);

    expect(resposta.status).toBe(200);
  });

  it('empresa A nao le, altera nem remove arquivo da empresa B', async () => {
    await expect(service.findById('arq-b', empresaA)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      service.update('arq-b', { nome: 'novo' }, empresaA),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.deleteById('arq-b', empresaA)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(prismaMock.arquivo.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'arq-b', empresaId: 'empresa-a' },
      }),
    );
    expect(prismaMock.arquivo.update).not.toHaveBeenCalled();
    expect(prismaMock.arquivo.delete).not.toHaveBeenCalled();
  });

  it('usuario de filial fica restrito a propria filial', async () => {
    await expect(service.findById('arq-b', filialA)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prismaMock.arquivo.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'arq-b', empresaId: 'empresa-a', filialId: 'filial-a' },
      }),
    );
  });

  it('superadmin remove arquivo de qualquer empresa', async () => {
    prismaMock.arquivo.findFirst.mockResolvedValue({ id: 'arq-b' });

    const resposta = await service.deleteById('arq-b', superadmin);

    expect(resposta.status).toBe(200);
    expect(prismaMock.arquivo.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'arq-b' } }),
    );
    expect(prismaMock.arquivo.delete).toHaveBeenCalledWith({
      where: { id: 'arq-b' },
    });
  });
});
