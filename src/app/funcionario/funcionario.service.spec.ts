import { NotFoundException } from '@nestjs/common';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateFuncionarioDto } from './dto/funcionario.dto';
import { FuncionarioService } from './funcionario.service';

describe('FuncionarioService (escopo multi-empresa)', () => {
  const empresaA: EscopoUsuario = {
    superadmin: false,
    usuarioId: 'usuario-a',
    empresaId: 'empresa-a',
  };
  const filialUsuarioA: EscopoUsuario = {
    ...empresaA,
    filialId: 'filial-a1',
  };
  const superadmin: EscopoUsuario = { superadmin: true, usuarioId: 'root' };

  const tx = {
    pessoa: { update: jest.fn(), delete: jest.fn() },
    usuario: { update: jest.fn(), delete: jest.fn() },
    atribuicao: { deleteMany: jest.fn() },
    endereco: { deleteMany: jest.fn(), createMany: jest.fn() },
    contato: { deleteMany: jest.fn(), createMany: jest.fn() },
    funcionario: { update: jest.fn() },
  };

  const prismaMock = {
    funcionario: { findFirst: jest.fn() },
    pessoa: { findUnique: jest.fn() },
    usuario: { findUnique: jest.fn() },
    $transaction: jest.fn((fn: (client: typeof tx) => unknown) => fn(tx)),
  };

  const service = new FuncionarioService(
    prismaMock as unknown as PrismaService,
  );

  const funcionarioB = {
    id: 'func-b',
    pessoaId: 'pessoa-b',
    cargo: 'vendedor',
    createdAt: new Date(),
    updatedAt: new Date(),
    pessoa: {
      nome: 'Func B',
      cpf: '1',
      email: 'b@b.com',
      filialId: 'filial-b',
      usuario: { id: 'usuario-b', email: 'b@b.com', empresaId: 'empresa-b' },
    },
  };

  const dto = {
    cargo: 'gerente',
    pessoa: { nome: 'Novo', email: 'novo@a.com' },
  } as unknown as UpdateFuncionarioDto;

  beforeEach(() => jest.clearAllMocks());

  it('empresa A nao le funcionario da empresa B', async () => {
    prismaMock.funcionario.findFirst.mockResolvedValue(null);

    await expect(service.findById('func-b', empresaA)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prismaMock.funcionario.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'func-b', pessoa: { filial: { empresaId: 'empresa-a' } } },
      }),
    );
  });

  it('usuario de filial so ve funcionarios da propria filial', async () => {
    prismaMock.funcionario.findFirst.mockResolvedValue(null);

    await expect(
      service.findById('func-a2', filialUsuarioA),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prismaMock.funcionario.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'func-a2',
          pessoa: { filial: { empresaId: 'empresa-a' }, filialId: 'filial-a1' },
        },
      }),
    );
  });

  it('empresa A nao altera email, cargo ou perfis de funcionario da empresa B', async () => {
    prismaMock.funcionario.findFirst.mockResolvedValue(null);

    await expect(
      service.update('func-b', { ...dto, acessoIds: ['perfil'] }, empresaA),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('empresa A nao altera status de funcionario da empresa B', async () => {
    prismaMock.funcionario.findFirst.mockResolvedValue(null);

    await expect(
      service.updateStatus('func-b', 'inativo', empresaA),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('empresa A nao exclui funcionario da empresa B', async () => {
    prismaMock.funcionario.findFirst.mockResolvedValue(null);

    await expect(service.deleteById('func-b', empresaA)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('superadmin le e exclui funcionario de qualquer empresa', async () => {
    prismaMock.funcionario.findFirst.mockResolvedValue(funcionarioB);

    await expect(service.findById('func-b', superadmin)).resolves.toEqual(
      expect.objectContaining({ id: 'func-b' }),
    );
    expect(prismaMock.funcionario.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'func-b', pessoa: {} } }),
    );

    const resposta = await service.deleteById('func-b', superadmin);
    expect(resposta.status).toBe(200);
    expect(tx.pessoa.delete).toHaveBeenCalledWith({
      where: { id: 'pessoa-b' },
    });
  });
});
