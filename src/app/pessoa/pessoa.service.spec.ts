import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { PessoaDto } from './dto/pessoa';
import { PessoaService } from './pessoa.service';

describe('PessoaService (escopo multi-empresa)', () => {
  const empresaA: EscopoUsuario = { superadmin: false, empresaId: 'empresa-a' };
  const filialUsuarioA: EscopoUsuario = {
    superadmin: false,
    empresaId: 'empresa-a',
    filialId: 'filial-a1',
  };
  const superadmin: EscopoUsuario = { superadmin: true };

  const tx = {
    pessoa: { update: jest.fn(), delete: jest.fn() },
    cliente: {
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
    },
    usuario: { updateMany: jest.fn(), deleteMany: jest.fn() },
    funcionario: { deleteMany: jest.fn() },
    oftalmologista: { deleteMany: jest.fn() },
    optometrista: { deleteMany: jest.fn() },
    endereco: { deleteMany: jest.fn() },
    contato: { deleteMany: jest.fn() },
    agenda: { deleteMany: jest.fn() },
    atendimento: { deleteMany: jest.fn() },
  };

  const prismaMock = {
    pessoa: { findFirst: jest.fn() },
    filial: { findFirst: jest.fn() },
    $transaction: jest.fn((fn: (client: typeof tx) => unknown) => fn(tx)),
  };

  const service = new PessoaService(prismaMock as unknown as PrismaService);

  const pessoaA = {
    id: 'pessoa-a',
    filialId: 'filial-a1',
    nome: 'Pessoa A',
    cpf: '1',
    email: 'a@a.com',
    data_nascimento: null,
    genero: null,
    status: 'ativo',
  };

  beforeEach(() => jest.clearAllMocks());

  it('empresa A nao altera pessoa da empresa B', async () => {
    prismaMock.pessoa.findFirst.mockResolvedValue(null);

    await expect(
      service.update('pessoa-b', { nome: 'X' } as PessoaDto, empresaA),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prismaMock.pessoa.findFirst).toHaveBeenCalledWith({
      where: { id: 'pessoa-b', filial: { empresaId: 'empresa-a' } },
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('nao move pessoa para filial de outra empresa', async () => {
    prismaMock.pessoa.findFirst.mockResolvedValue(pessoaA);
    prismaMock.filial.findFirst.mockResolvedValue(null);

    await expect(
      service.update(
        'pessoa-a',
        { filialId: 'filial-b' } as PessoaDto,
        empresaA,
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(prismaMock.filial.findFirst).toHaveBeenCalledWith({
      where: { id: 'filial-b', empresaId: 'empresa-a' },
      select: { id: true },
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('usuario de filial nao move pessoa para outra filial da empresa', async () => {
    prismaMock.pessoa.findFirst.mockResolvedValue(pessoaA);

    await expect(
      service.update(
        'pessoa-a',
        { filialId: 'filial-a2' } as PessoaDto,
        filialUsuarioA,
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('empresa A nao altera status de pessoa da empresa B', async () => {
    prismaMock.pessoa.findFirst.mockResolvedValue(null);

    await expect(
      service.updateStatus('pessoa-b', 'inativo', filialUsuarioA),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prismaMock.pessoa.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'pessoa-b',
        filial: { empresaId: 'empresa-a' },
        filialId: 'filial-a1',
      },
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('empresa A nao exclui pessoa da empresa B', async () => {
    prismaMock.pessoa.findFirst.mockResolvedValue(null);

    await expect(service.delete('pessoa-b', empresaA)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('superadmin altera status e exclui pessoa de qualquer empresa', async () => {
    prismaMock.pessoa.findFirst.mockResolvedValue({
      ...pessoaA,
      id: 'pessoa-b',
    });
    tx.pessoa.update.mockResolvedValue({ id: 'pessoa-b', status: 'inativo' });
    tx.pessoa.delete.mockResolvedValue({ id: 'pessoa-b' });

    await expect(
      service.updateStatus('pessoa-b', 'inativo', superadmin),
    ).resolves.toEqual({ id: 'pessoa-b', status: 'inativo' });
    expect(prismaMock.pessoa.findFirst).toHaveBeenCalledWith({
      where: { id: 'pessoa-b' },
    });

    const resposta = await service.delete('pessoa-b', superadmin);
    expect(resposta.status).toBe(200);
  });
});
