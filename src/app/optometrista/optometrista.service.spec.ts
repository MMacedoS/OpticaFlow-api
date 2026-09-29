import { NotFoundException } from '@nestjs/common';
import { Status } from '@prisma/client';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { OptometristaService } from './optometrista.service';

describe('OptometristaService - isolamento entre empresas', () => {
  const tx = {
    pessoa: { update: jest.fn(), delete: jest.fn() },
    usuario: { update: jest.fn(), delete: jest.fn() },
    endereco: { deleteMany: jest.fn(), createMany: jest.fn() },
    contato: { deleteMany: jest.fn(), createMany: jest.fn() },
    optometrista: { delete: jest.fn() },
  };
  const prismaMock = {
    optometrista: { findFirst: jest.fn() },
    filial: { findUnique: jest.fn() },
    pessoa: { findUnique: jest.fn() },
    usuario: { findUnique: jest.fn() },
    $transaction: jest.fn((fn: (client: typeof tx) => unknown) => fn(tx)),
  };
  const service = new OptometristaService(
    prismaMock as unknown as PrismaService,
  );

  const empresaA: EscopoUsuario = {
    superadmin: false,
    usuarioId: 'u-a',
    empresaId: 'empresa-a',
  };
  const filialA: EscopoUsuario = { ...empresaA, filialId: 'filial-a' };
  const superadmin: EscopoUsuario = { superadmin: true, usuarioId: 'root' };

  const registroA = {
    id: 'prof-a',
    pessoaId: 'pessoa-a',
    createdAt: new Date(),
    updatedAt: new Date(),
    pessoa: {
      nome: 'Ana',
      cpf: '1',
      email: 'ana@a.com',
      filialId: 'filial-a',
      filial: { empresaId: 'empresa-a' },
      usuario: {
        id: 'usuario-ana',
        email: 'ana@a.com',
        empresaId: 'empresa-a',
      },
    },
  };
  const dtoUpdate = (filialId?: string) =>
    ({ pessoa: { nome: 'Ana', email: 'ana@a.com', filialId } }) as never;

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.optometrista.findFirst.mockResolvedValue(null);
  });

  it('empresa A nao le, altera, muda status nem remove registro da empresa B', async () => {
    await expect(service.findById('prof-b', empresaA)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      service.update('prof-b', dtoUpdate(), empresaA),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.updateStatus('prof-b', Status.inativo, empresaA),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.deleteById('prof-b', empresaA)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(prismaMock.optometrista.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'prof-b',
          pessoa: { filial: { empresaId: 'empresa-a' } },
        },
      }),
    );
    expect(tx.pessoa.update).not.toHaveBeenCalled();
    expect(tx.usuario.update).not.toHaveBeenCalled();
    expect(tx.pessoa.delete).not.toHaveBeenCalled();
  });

  it('usuario de filial fica restrito a propria filial', async () => {
    await expect(service.findById('prof-b', filialA)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prismaMock.optometrista.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'prof-b',
          pessoa: {
            filial: { empresaId: 'empresa-a' },
            filialId: 'filial-a',
          },
        },
      }),
    );
  });

  it('nao move o profissional para filial de outra empresa', async () => {
    prismaMock.optometrista.findFirst.mockResolvedValue(registroA);
    prismaMock.filial.findUnique.mockResolvedValue({
      id: 'filial-b',
      empresaId: 'empresa-b',
    });

    const resposta = await service.update(
      'prof-a',
      dtoUpdate('filial-b'),
      empresaA,
    );

    expect(resposta.status).toBe(422);
    expect(tx.pessoa.update).not.toHaveBeenCalled();
    expect(tx.usuario.update).not.toHaveBeenCalled();
  });

  it('usuario de filial nao move o profissional para outra filial', async () => {
    prismaMock.optometrista.findFirst.mockResolvedValue(registroA);
    prismaMock.filial.findUnique.mockResolvedValue({
      id: 'filial-a2',
      empresaId: 'empresa-a',
    });

    const resposta = await service.update(
      'prof-a',
      dtoUpdate('filial-a2'),
      filialA,
    );

    expect(resposta.status).toBe(422);
    expect(tx.pessoa.update).not.toHaveBeenCalled();
  });

  it('troca de filial na mesma empresa nao altera a empresa do usuario', async () => {
    prismaMock.optometrista.findFirst.mockResolvedValue(registroA);
    prismaMock.filial.findUnique.mockResolvedValue({
      id: 'filial-a2',
      empresaId: 'empresa-a',
    });

    await service.update('prof-a', dtoUpdate('filial-a2'), empresaA);

    expect(tx.pessoa.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ filialId: 'filial-a2' }),
      }),
    );
    const dadosUsuario = tx.usuario.update.mock.calls[0][0].data;
    expect(dadosUsuario).not.toHaveProperty('empresaId');
  });

  it('superadmin acessa e remove registro de qualquer empresa', async () => {
    prismaMock.optometrista.findFirst.mockResolvedValue(registroA);

    const resposta = await service.findById('prof-a', superadmin);
    await service.deleteById('prof-a', superadmin);

    expect(resposta.status).toBe(200);
    expect(prismaMock.optometrista.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'prof-a' } }),
    );
    expect(tx.optometrista.delete).toHaveBeenCalledWith({
      where: { id: 'prof-a' },
    });
  });
});
