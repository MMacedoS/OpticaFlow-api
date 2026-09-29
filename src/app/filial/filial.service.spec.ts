import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateFilialDto } from './dto/update.dto';
import { FilialService } from './filial.service';

describe('FilialService (escopo multi-empresa)', () => {
  const empresaA: EscopoUsuario = { superadmin: false, empresaId: 'empresa-a' };
  const filialUsuarioA: EscopoUsuario = {
    superadmin: false,
    empresaId: 'empresa-a',
    filialId: 'filial-a1',
  };
  const superadmin: EscopoUsuario = { superadmin: true, usuarioId: 'root' };

  const tx = {
    filial: { update: jest.fn(), delete: jest.fn() },
    pessoa: { update: jest.fn(), updateMany: jest.fn(), deleteMany: jest.fn() },
    usuario: {
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    endereco_filial: { deleteMany: jest.fn(), createMany: jest.fn() },
    contato_filial: { deleteMany: jest.fn(), createMany: jest.fn() },
    config_filial: { deleteMany: jest.fn() },
    atribuicao: { deleteMany: jest.fn() },
    endereco: { deleteMany: jest.fn(), createMany: jest.fn() },
    contato: { deleteMany: jest.fn(), createMany: jest.fn() },
    funcionario: { deleteMany: jest.fn() },
    cliente: { deleteMany: jest.fn() },
  };

  const prismaMock = {
    filial: { findFirst: jest.fn(), findUnique: jest.fn() },
    pessoa: { findFirst: jest.fn(), findMany: jest.fn() },
    usuario: { findUnique: jest.fn() },
    config_filial: { upsert: jest.fn() },
    $transaction: jest.fn((fn: (client: typeof tx) => unknown) => fn(tx)),
  };

  const service = new FilialService(prismaMock as unknown as PrismaService);

  const dtoUpdate = {
    nome: 'Filial Nova',
    enderecos: [],
    contatos: [],
    pessoa: {
      id: 'pessoa-de-outra-empresa',
      nome: 'Gerente',
      cpf: '00000000000',
      email: 'gerente@a.com',
    },
  } as unknown as UpdateFilialDto;

  beforeEach(() => jest.clearAllMocks());

  describe('findById', () => {
    it('empresa A nao le filial da empresa B', async () => {
      prismaMock.filial.findFirst.mockResolvedValue(null);

      await expect(
        service.findById('filial-b', empresaA),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.filial.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { AND: [{ id: 'filial-b' }, { empresaId: 'empresa-a' }] },
        }),
      );
    });

    it('usuario de filial fica restrito a propria filial', async () => {
      prismaMock.filial.findFirst.mockResolvedValue(null);

      await expect(
        service.findById('filial-a2', filialUsuarioA),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.filial.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              { id: 'filial-a2' },
              { empresaId: 'empresa-a', id: 'filial-a1' },
            ],
          },
        }),
      );
    });

    it('superadmin le qualquer filial', async () => {
      prismaMock.filial.findFirst.mockResolvedValue({ id: 'filial-b' });

      await expect(service.findById('filial-b', superadmin)).resolves.toEqual({
        id: 'filial-b',
      });
      expect(prismaMock.filial.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { AND: [{ id: 'filial-b' }, {}] } }),
      );
    });
  });

  describe('update', () => {
    it('empresa A nao altera filial da empresa B', async () => {
      prismaMock.filial.findFirst.mockResolvedValue(null);

      await expect(
        service.update('filial-b', dtoUpdate, empresaA),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('nao altera pessoa arbitraria informada no corpo', async () => {
      prismaMock.filial.findFirst.mockResolvedValue({ id: 'filial-a1' });
      prismaMock.pessoa.findFirst.mockResolvedValue(null);

      await expect(
        service.update('filial-a1', dtoUpdate, empresaA),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.pessoa.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            filialId: 'filial-a1',
            funcionario: { cargo: 'gerente' },
            id: 'pessoa-de-outra-empresa',
          },
        }),
      );
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('atualiza o responsavel da propria filial', async () => {
      prismaMock.filial.findFirst.mockResolvedValue({ id: 'filial-a1' });
      prismaMock.pessoa.findFirst.mockResolvedValue({
        id: 'gerente-a1',
        usuario: { id: 'usuario-gerente' },
      });
      prismaMock.usuario.findUnique.mockResolvedValue(null);
      tx.filial.update.mockResolvedValue({ id: 'filial-a1' });
      tx.pessoa.update.mockResolvedValue({ id: 'gerente-a1' });
      prismaMock.filial.findUnique.mockResolvedValue({
        id: 'filial-a1',
        pessoas: [],
      });

      const resposta = await service.update(
        'filial-a1',
        { ...dtoUpdate, pessoa: { ...dtoUpdate.pessoa, id: undefined } },
        filialUsuarioA,
      );

      expect(resposta.status).toBe(200);
      expect(tx.pessoa.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'gerente-a1' } }),
      );
      expect(tx.usuario.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'usuario-gerente' } }),
      );
    });
  });

  describe('updateStatus', () => {
    it('empresa A nao altera status de filial da empresa B', async () => {
      prismaMock.filial.findFirst.mockResolvedValue(null);

      await expect(
        service.updateStatus('filial-b', 'inativo', empresaA),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('usuario de filial nao altera status de filiais', async () => {
      await expect(
        service.updateStatus('filial-a1', 'inativo', filialUsuarioA),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('deleteById', () => {
    it('empresa A nao exclui filial da empresa B', async () => {
      prismaMock.filial.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteById('filial-b', empresaA),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('superadmin exclui filial de qualquer empresa', async () => {
      prismaMock.filial.findFirst.mockResolvedValue({
        id: 'filial-b',
        pessoas: [],
      });

      const resposta = await service.deleteById('filial-b', superadmin);

      expect(resposta.status).toBe(200);
      expect(tx.filial.delete).toHaveBeenCalledWith({
        where: { id: 'filial-b' },
      });
    });
  });

  describe('upsertConfig', () => {
    it('empresa A nao altera configuracao de filial da empresa B', async () => {
      prismaMock.filial.findFirst.mockResolvedValue(null);

      await expect(
        service.upsertConfig('filial-b', { moeda: 'BRL' }, empresaA),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.config_filial.upsert).not.toHaveBeenCalled();
    });
  });

  describe('findAllByEmpresa', () => {
    it('lista somente filiais da empresa do usuario', async () => {
      (prismaMock.$transaction as jest.Mock).mockResolvedValueOnce([[], 0]);
      const findMany = jest.fn();
      const count = jest.fn();
      Object.assign(prismaMock.filial, { findMany, count });

      await service.findAllByEmpresa(empresaA, 1, 10, '', 'ativo', 'empresa-b');

      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { empresaId: 'empresa-a', status: 'ativo' },
        }),
      );
    });
  });
});
