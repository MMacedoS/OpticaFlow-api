import { NotFoundException } from '@nestjs/common';
import { CanalNotificacao } from '@prisma/client';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificacaoService } from './notificacao.service';

describe('NotificacaoService - isolamento entre empresas', () => {
  const prismaMock = {
    notificacao: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({ id: 'not-1' }),
      update: jest.fn(),
      delete: jest.fn(),
    },
    empresa: { findUnique: jest.fn() },
    usuario: { findUnique: jest.fn() },
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
  };
  const service = new NotificacaoService(
    prismaMock as unknown as PrismaService,
  );

  const empresaA: EscopoUsuario = {
    superadmin: false,
    usuarioId: 'u-a',
    empresaId: 'empresa-a',
  };
  const superadmin: EscopoUsuario = { superadmin: true, usuarioId: 'root' };
  const dto = {
    empresaId: 'empresa-b',
    canal: CanalNotificacao.sistema,
    titulo: 'Aviso',
    mensagem: 'Teste',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.notificacao.findFirst.mockResolvedValue(null);
    prismaMock.empresa.findUnique.mockImplementation(
      ({ where }: { where: { id: string } }) => ({ id: where.id }),
    );
  });

  it('ignora o empresaId do corpo e grava na empresa do usuario', async () => {
    await service.create(dto, empresaA);

    expect(prismaMock.notificacao.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ empresaId: 'empresa-a' }),
    });
  });

  it('rejeita usuario destino de outra empresa', async () => {
    prismaMock.usuario.findUnique.mockResolvedValue({
      id: 'u-b',
      empresaId: 'empresa-b',
    });

    const resposta = await service.create(
      { ...dto, usuarioDestinoId: 'u-b' },
      empresaA,
    );

    expect(resposta.status).toBe(422);
    expect(prismaMock.notificacao.create).not.toHaveBeenCalled();
  });

  it('superadmin escolhe a empresa pelo corpo', async () => {
    await service.create(dto, superadmin);

    expect(prismaMock.notificacao.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ empresaId: 'empresa-b' }),
    });
  });

  it('nao lista notificacoes de outra empresa', async () => {
    await expect(
      service.findAllByEmpresa('empresa-b', empresaA),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prismaMock.notificacao.findMany).not.toHaveBeenCalled();
  });

  it('empresa A nao le, altera, marca nem remove notificacao da empresa B', async () => {
    await expect(service.findById('n-b', empresaA)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      service.update('n-b', { titulo: 'x' }, empresaA),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.marcarComoLida('n-b', empresaA),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.marcarComoNaoLida('n-b', empresaA),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.deleteById('n-b', empresaA)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(prismaMock.notificacao.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'n-b', empresaId: 'empresa-a' },
      }),
    );
    expect(prismaMock.notificacao.update).not.toHaveBeenCalled();
    expect(prismaMock.notificacao.delete).not.toHaveBeenCalled();
  });

  it('superadmin marca notificacao de qualquer empresa', async () => {
    prismaMock.notificacao.findFirst.mockResolvedValue({ id: 'n-b' });

    const resposta = await service.marcarComoLida('n-b', superadmin);

    expect(resposta.status).toBe(200);
    expect(prismaMock.notificacao.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'n-b' } }),
    );
  });
});
