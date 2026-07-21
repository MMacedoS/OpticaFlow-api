import { Injectable } from '@nestjs/common';
import { Status } from '@prisma/client';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { PessoaDto } from './dto/pessoa';

@Injectable()
export class PessoaService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.pessoa.findUnique({
      where: { id: id },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.pessoa.findFirst({
      where: { email: email },
    });
  }

  async findAllByFilial(
    filialId: string,
    page: number,
    limit: number,
    search: string,
  ): Promise<ResponseJson> {
    const skip = (page - 1) * limit;

    const [pessoas, total] = await this.prisma.$transaction([
      this.prisma.pessoa.findMany({
        where: {
          filialId: filialId,
          OR: [
            { nome: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { cpf: { contains: search, mode: 'insensitive' } },
          ],
        },
        skip,
        select: {
          id: true,
          nome: true,
          cpf: true,
          email: true,
          data_nascimento: true,
          genero: true,
          status: true,
          enderecos: true,
          contatos: true,
        },
        take: limit,
      }),
      this.prisma.pessoa.count({
        where: {
          filialId: filialId,
          OR: [
            { nome: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { cpf: { contains: search, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    return {
      status: 200,
      message: 'Pessoas encontradas com sucesso.',
      data: {
        peoples: pessoas,
        pagination: {
          total: total,
          page: page,
          limit: limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async create(dto: PessoaDto) {
    if (!dto.filialId) {
      return { status: 400, message: 'O id da filial é obrigatório.' };
    }

    const filial = await this.prisma.filial.findUnique({
      where: { id: dto.filialId },
    });

    if (!filial) {
      return { status: 404, message: 'Filial não encontrada.' };
    }

    return this.prisma.$transaction(async (tx) => {
      const people = await tx.pessoa.create({
        data: {
          filialId: filial.id,
          nome: dto.nome,
          cpf: dto.cpf,
          email: dto.email,
          data_nascimento: dto.data_nascimento,
          genero: dto.genero ?? undefined,
          status: dto.status ?? undefined,

          enderecos: {
            create: dto.enderecos?.map((endereco) => ({
              ...endereco,
              numero: endereco.numero || '',
            })),
          },
          contatos: {
            create: dto.contatos?.map((contato) => ({
              ...contato,
            })),
          },
        },
      });

      if (dto.is_cliente) {
        await tx.cliente.create({
          data: {
            pessoaId: people.id,
          },
        });
      }

      return people;
    });
  }

  async update(id: string, data: PessoaDto) {
    if (data.filialId) {
      const filial = await this.prisma.filial.findUnique({
        where: { id: data.filialId },
      });

      if (!filial) {
        return { status: 404, message: 'Filial não encontrada.' };
      }
    }

    const pessoa = await this.findById(id);

    if (!pessoa) {
      return { status: 404, message: 'Pessoa não encontrada.' };
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedPessoa = await tx.pessoa.update({
        where: { id: id },
        data: {
          filialId: data.filialId ?? pessoa.filialId,
          nome: data.nome ?? pessoa.nome,
          cpf: data.cpf ?? pessoa.cpf,
          email: data.email ?? pessoa.email,
          data_nascimento: data.data_nascimento ?? pessoa.data_nascimento,
          genero: data.genero ?? pessoa.genero,
          status: data.status ?? pessoa.status,
          enderecos: {
            deleteMany: {},
            create: data.enderecos?.map((endereco) => ({
              ...endereco,
              numero: endereco.numero || '',
            })),
          },
          contatos: {
            deleteMany: {},
            create: data.contatos?.map((contato) => ({
              ...contato,
            })),
          },
        },
      });

      if (data.is_cliente) {
        const cliente = await tx.cliente.findUnique({
          where: { pessoaId: id },
        });

        if (!cliente) {
          await tx.cliente.create({
            data: {
              pessoaId: updatedPessoa.id,
            },
          });
        }
      }

      return updatedPessoa;
    });
  }

  async updateStatus(id: string, status: Status) {
    const pessoa = await this.findById(id);

    if (!pessoa) {
      return { status: 404, message: 'Pessoa não encontrada.' };
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.cliente.updateMany({
        where: { pessoaId: id },
        data: { status: status },
      });

      await tx.usuario.updateMany({
        where: { pessoaId: id },
        data: { status: status },
      });

      return await tx.pessoa.update({
        where: { id: id },
        data: { status: status },
      });
    });
  }

  async delete(id: string) {
    const pessoa = await this.findById(id);

    if (!pessoa) {
      return { status: 404, message: 'Pessoa não encontrada.' };
    }

    try {
      const deleted = await this.prisma.$transaction(async (tx) => {
        await tx.funcionario.deleteMany({ where: { pessoaId: id } });
        await tx.cliente.deleteMany({ where: { pessoaId: id } });
        await tx.oftalmologista.deleteMany({ where: { pessoaId: id } });
        await tx.optometrista.deleteMany({ where: { pessoaId: id } });
        await tx.usuario.deleteMany({ where: { pessoaId: id } });
        await tx.endereco.deleteMany({ where: { pessoaId: id } });
        await tx.contato.deleteMany({ where: { pessoaId: id } });
        await tx.agenda.deleteMany({ where: { pessoaId: id } });
        await tx.atendimento.deleteMany({ where: { pacienteId: id } });

        return await tx.pessoa.delete({
          where: { id: id },
        });
      });

      return {
        status: 200,
        message: 'Pessoa deletada com sucesso.',
        data: deleted,
      };
    } catch (error) {
      return {
        status: 400,
        message:
          'Não foi possível deletar a pessoa pois ela possui históricos de atendimentos, vendas ou agendas vinculados.',
      };
    }
  }
}
