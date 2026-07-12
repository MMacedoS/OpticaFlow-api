import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClienteDto, updateClienteDto } from './cliente.dto/cliente.dto';
import { ResponseJson } from 'src/interface/response/response.interface';
import { Status, Usuario } from '@prisma/client';
import { FilialService } from 'src/app/filial/filial.service';

@Injectable()
export class ClienteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly filialService: FilialService,
  ) {}

  async create(dto: ClienteDto, usuario: Usuario): Promise<ResponseJson> {
    if (!usuario.pessoaId) {
      return { status: 400, message: 'Usuário não possui pessoa associada.' };
    }

    const pessoaUser = await this.filialService.findByPessoaId(
      usuario.pessoaId,
    );

    if (!pessoaUser || !pessoaUser.filialId) {
      return { status: 400, message: 'Usuário não possui filial associada.' };
    }

    try {
      const clienteExistente = await this.prisma.cliente.findFirst({
        where: {
          convenioId: dto.convenioId ?? '',
          pessoa: {
            OR: [{ cpf: dto.pessoa.cpf }, { email: dto.pessoa.email }],
          },
        },
      });

      if (clienteExistente) {
        return {
          status: 400,
          message:
            'Já existe um cliente com este CPF ou email para este convênio.',
        };
      }

      const cliente = await this.prisma.$transaction(async (tx) => {
        const pessoa = await this.prisma.pessoa.create({
          data: {
            nome: dto.pessoa.nome,
            cpf: dto.pessoa.cpf,
            email: dto.pessoa.email,
            data_nascimento: dto.pessoa.data_nascimento,
            genero: dto.pessoa.genero,
            status: dto.pessoa.status,
            filialId: pessoaUser.filialId,
            enderecos: {
              create: dto.pessoa.enderecos?.map((endereco) => ({
                ...endereco,
                principal: endereco.principal ?? true,
                numero: endereco.numero ?? '',
              })),
            },
            contatos: {
              create: dto.pessoa.contatos?.map((contato) => ({
                ...contato,
                principal: contato.principal ?? true,
              })),
            },
          },
        });

        await this.prisma.cliente.create({
          data: {
            convenioId: dto.convenioId ?? null,
            pessoaId: pessoa.id,
            status: dto.pessoa.status,
          },
        });

        return pessoa;
      });

      return {
        status: 201,
        message: 'Cliente criado com sucesso.',
        data: cliente,
      };
    } catch (error) {
      return {
        status: 500,
        message:
          'Erro ao criar o cliente.' +
          (error instanceof Error ? ` Detalhes: ${error.message}` : ''),
      };
    }
  }

  async findById(id: string): Promise<ResponseJson> {
    try {
      const cliente = await this.prisma.cliente.findUnique({
        where: { id },
        include: { pessoa: true },
      });

      if (!cliente) {
        return { status: 404, message: 'Cliente não encontrado.' };
      }

      return { status: 200, message: 'Cliente encontrado.', data: cliente };
    } catch (error) {
      return {
        status: 500,
        message: 'Erro ao buscar o cliente.',
      };
    }
  }

  async findAllByFilialId(
    filialId: string,
    criteria: { page: number; limit: number; search?: string },
  ): Promise<ResponseJson> {
    const pageNumber = Math.max(1, criteria.page ?? 1);
    const limitNumber = Math.max(1, criteria.limit ?? 10);
    const skip = (pageNumber - 1) * limitNumber;

    const searchFilter = criteria.search
      ? {
          OR: [
            {
              nome: { contains: criteria.search, mode: 'insensitive' as const },
            },
            {
              cpf: { contains: criteria.search, mode: 'insensitive' as const },
            },
          ],
        }
      : {};

    const [customers, total] = await this.prisma.$transaction([
      this.prisma.cliente.findMany({
        where: {
          pessoa: {
            filialId,
            ...searchFilter,
          },
        },
        skip: skip,
        take: limitNumber,
        include: {
          convenio: true,
          pessoa: { include: { enderecos: true, contatos: true } },
        },
      }),
      this.prisma.cliente.count({
        where: {
          pessoa: {
            filialId,
            ...searchFilter,
          },
        },
      }),
    ]);

    return {
      status: 200,
      message: 'Clientes encontrados.',
      data: {
        customers: customers,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total: total,
          totalPages: Math.ceil(total / limitNumber),
        },
      },
    };
  }

  async updateStatus(id: string, status: Status): Promise<ResponseJson> {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
    });

    if (!cliente) {
      return { status: 404, message: 'cliente não encontrado.' };
    }

    const updatedCliente = await this.prisma.$transaction(async (tx) => {
      const clienteUpd = await tx.cliente.update({
        where: { id },
        data: { status },
      });

      await tx.pessoa.update({
        where: { id: cliente.pessoaId },
        data: { status },
      });

      return clienteUpd;
    });

    return {
      status: 200,
      message: 'Status atualizado com sucesso.',
      data: updatedCliente,
    };
  }

  async update(id: string, dto: updateClienteDto): Promise<ResponseJson> {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
    });

    if (!cliente) {
      return { status: 404, message: 'Cliente não encontrado.' };
    }

    const updatedCliente = await this.prisma.$transaction(async (tx) => {
      const pessoaUpd = await tx.pessoa.update({
        where: { id: cliente.pessoaId },
        data: {
          nome: dto.pessoa.nome,
          cpf: dto.pessoa.cpf,
          email: dto.pessoa.email,
          data_nascimento: dto.pessoa.data_nascimento,
          genero: dto.pessoa.genero,
          status: dto.pessoa.status,
        },
      });

      await tx.endereco.deleteMany({ where: { pessoaId: cliente.pessoaId } });
      await tx.endereco.createMany({
        data:
          dto.pessoa.enderecos?.map((end) => ({
            ...end,
            pessoaId: cliente.pessoaId,
            principal: end.principal ?? true,
            numero: end.numero ?? '',
          })) ?? [],
      });

      await tx.contato.deleteMany({ where: { pessoaId: cliente.pessoaId } });
      await tx.contato.createMany({
        data:
          dto.pessoa.contatos?.map((cont) => ({
            ...cont,
            pessoaId: cliente.pessoaId,
            principal: cont.principal ?? true,
          })) ?? [],
      });

      const clienteUpd = await tx.cliente.update({
        where: { id },
        data: {
          convenioId: dto.convenioId,
          status: dto.status,
        },
      });
      return { ...clienteUpd, pessoa: pessoaUpd };
    });

    return {
      status: 200,
      message: 'Cliente atualizado com sucesso.',
      data: updatedCliente,
    };
  }

  async deleteById(id: string): Promise<ResponseJson> {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
    });

    if (!cliente) {
      return { status: 404, message: 'Cliente não encontrado.' };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.contato.deleteMany({ where: { pessoaId: cliente.pessoaId } });
      await tx.endereco.deleteMany({ where: { pessoaId: cliente.pessoaId } });
      await tx.cliente.delete({ where: { id } });
      await tx.pessoa.delete({ where: { id: cliente.pessoaId } });
    });

    return {
      status: 200,
      message: 'Cliente deletado com sucesso.',
    };
  }
}
