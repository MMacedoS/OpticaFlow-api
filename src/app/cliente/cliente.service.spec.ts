import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Usuario } from '@prisma/client';
import { FilialService } from 'src/app/filial/filial.service';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClienteDto, updateClienteDto } from './cliente.dto/cliente.dto';
import { ClienteService } from './cliente.service';

describe('ClienteService (escopo multi-empresa)', () => {
  const empresaA: EscopoUsuario = { superadmin: false, empresaId: 'empresa-a' };
  const filialUsuarioA: EscopoUsuario = {
    superadmin: false,
    empresaId: 'empresa-a',
    filialId: 'filial-a1',
  };
  const superadmin: EscopoUsuario = { superadmin: true };

  const tx = {
    pessoa: { update: jest.fn(), delete: jest.fn() },
    cliente: { update: jest.fn(), delete: jest.fn() },
    endereco: { deleteMany: jest.fn(), createMany: jest.fn() },
    contato: { deleteMany: jest.fn(), createMany: jest.fn() },
  };

  const prismaMock = {
    cliente: { findFirst: jest.fn(), create: jest.fn() },
    convenio: { findFirst: jest.fn() },
    pessoa: { create: jest.fn() },
    $transaction: jest.fn((fn: (client: typeof tx) => unknown) => fn(tx)),
  };

  const filialServiceMock = { findByPessoaId: jest.fn() };

  const service = new ClienteService(
    prismaMock as unknown as PrismaService,
    filialServiceMock as unknown as FilialService,
  );

  const clienteA = {
    id: 'cliente-a',
    pessoaId: 'pessoa-a',
    convenioId: null,
    pessoa: { filial: { empresaId: 'empresa-a' } },
  };

  const dtoUpdate = {
    convenioId: 'convenio-b',
    pessoa: { nome: 'Cliente', cpf: '1', email: 'c@a.com' },
  } as unknown as updateClienteDto;

  beforeEach(() => jest.clearAllMocks());

  it('empresa A nao altera cliente da empresa B', async () => {
    prismaMock.cliente.findFirst.mockResolvedValue(null);

    await expect(
      service.update('cliente-b', dtoUpdate, empresaA),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prismaMock.cliente.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'cliente-b',
          pessoa: { filial: { empresaId: 'empresa-a' } },
        },
      }),
    );
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('nao vincula convenio de outra empresa ao atualizar', async () => {
    prismaMock.cliente.findFirst.mockResolvedValue(clienteA);
    prismaMock.convenio.findFirst.mockResolvedValue(null);

    await expect(
      service.update('cliente-a', dtoUpdate, empresaA),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(prismaMock.convenio.findFirst).toHaveBeenCalledWith({
      where: { id: 'convenio-b', empresaId: 'empresa-a' },
      select: { id: true },
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('nao vincula convenio de outra empresa ao criar', async () => {
    filialServiceMock.findByPessoaId.mockResolvedValue({
      id: 'pessoa-user',
      filialId: 'filial-a1',
      filial: { id: 'filial-a1', empresaId: 'empresa-a' },
    });
    prismaMock.convenio.findFirst.mockResolvedValue(null);

    await expect(
      service.create(
        {
          convenioId: 'convenio-b',
          pessoa: { nome: 'X', cpf: '1', email: 'x@a.com' },
        },
        { pessoaId: 'pessoa-user' } as Usuario,
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(prismaMock.pessoa.create).not.toHaveBeenCalled();
  });

  it('empresa A nao altera status de cliente da empresa B', async () => {
    prismaMock.cliente.findFirst.mockResolvedValue(null);

    await expect(
      service.updateStatus('cliente-b', 'inativo', filialUsuarioA),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prismaMock.cliente.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'cliente-b',
          pessoa: {
            filial: { empresaId: 'empresa-a' },
            filialId: 'filial-a1',
          },
        },
      }),
    );
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('empresa A nao exclui cliente da empresa B', async () => {
    prismaMock.cliente.findFirst.mockResolvedValue(null);

    await expect(
      service.deleteById('cliente-b', empresaA),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('superadmin exclui cliente de qualquer empresa', async () => {
    prismaMock.cliente.findFirst.mockResolvedValue({
      ...clienteA,
      id: 'cliente-b',
      pessoaId: 'pessoa-b',
    });

    const resposta = await service.deleteById('cliente-b', superadmin);

    expect(resposta.status).toBe(200);
    expect(prismaMock.cliente.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'cliente-b', pessoa: {} } }),
    );
    expect(tx.cliente.delete).toHaveBeenCalledWith({
      where: { id: 'cliente-b' },
    });
  });
});
