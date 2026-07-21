import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma, Status } from '@prisma/client';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDto, UpdateDto } from './dto/optometrista.dto';
import { getSenhaBase } from 'src/utils/validator';
import { ControleAcesso } from 'src/constants/acessos';

@Injectable()
export class OptometristaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDto): Promise<ResponseJson> {
    const filial = await this.prisma.filial.findUnique({
      where: { id: dto.pessoa.filialId },
      select: { id: true, empresaId: true },
    });

    if (!filial) {
      return { status: 422, message: 'Filial não encontrada.' };
    }

    if (dto.pessoa.cpf) {
      const pessoaComCpf = await this.prisma.pessoa.findUnique({
        where: { cpf: dto.pessoa.cpf },
      });

      if (pessoaComCpf) {
        return { status: 400, message: 'Já existe pessoa com este CPF.' };
      }
    }

    const usuarioExistente = await this.prisma.usuario.findUnique({
      where: { email: dto.pessoa.email },
    });

    if (usuarioExistente) {
      return { status: 400, message: 'Usuário já existe com este email.' };
    }

    const senhaBase = getSenhaBase(dto.pessoa.cpf);
    const passwordHash = await bcrypt.hash(senhaBase, 10);

    try {
      const optometrista = await this.prisma.$transaction(async (tx) => {
        const pessoa = await tx.pessoa.create({
          data: {
            nome: dto.pessoa.nome,
            cpf: dto.pessoa.cpf,
            email: dto.pessoa.email,
            data_nascimento: dto.pessoa.data_nascimento,
            filialId: filial.id,
            enderecos: {
              create: dto.pessoa.enderecos?.map((endereco) => ({
                ...endereco,
                numero: endereco.numero || '',
              })),
            },
            contatos: {
              create: dto.pessoa.contatos?.map((contato) => ({
                ...contato,
              })),
            },
          },
        });

        const user = await tx.usuario.create({
          data: {
            empresaId: filial.empresaId,
            email: dto.pessoa.email,
            senha: passwordHash,
            username: dto.pessoa.nome,
            pessoaId: pessoa.id,
          },
        });

        const todosAcessos = await tx.acesso.findMany({
          where: {
            nome: { notIn: ControleAcesso.getRestricoes('optometrista') },
          },
          select: { id: true },
        });

        await tx.atribuicao.createMany({
          data: todosAcessos.map((acesso) => ({
            usuarioId: user.id,
            acessoId: acesso.id,
          })),
          skipDuplicates: true,
        });

        const novoOptometrista = await tx.optometrista.create({
          data: {
            pessoaId: pessoa.id,
            registro_profissional: dto.registro_profissional,
          },
          include: {
            pessoa: {
              include: {
                usuario: {
                  select: {
                    id: true,
                    email: true,
                    username: true,
                    empresaId: true,
                  },
                },
              },
            },
          },
        });

        return novoOptometrista;
      });

      return {
        status: 201,
        message: 'Optometrista criado com sucesso.',
        data: {
          id: optometrista.id,
          pessoaId: optometrista.pessoaId,
          nome: optometrista.pessoa.nome,
          cpf: optometrista.pessoa.cpf,
          email: optometrista.pessoa.email,
          filialId: optometrista.pessoa.filialId,
          createdAt: optometrista.createdAt,
          updatedAt: optometrista.updatedAt,
        },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return {
          status: 422,
          message: 'Optometrista já existe com estes dados.',
        };
      }

      throw error;
    }
  }

  async findAllByFilial(
    filialId: string,
    page: number = 1,
    limit: number = 10,
    search: string = '',
  ): Promise<ResponseJson> {
    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, limit);
    const skip = (pageNumber - 1) * limitNumber;

    const searchFilter = search
      ? {
          OR: [
            { nome: { contains: search, mode: 'insensitive' as const } },
            { cpf: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            {
              usuario: {
                email: { contains: search, mode: 'insensitive' as const },
              },
            },
            {
              usuario: {
                username: { contains: search, mode: 'insensitive' as const },
              },
            },
          ],
        }
      : {};

    const [optometristas, total] = await this.prisma.$transaction([
      this.prisma.optometrista.findMany({
        skip,
        take: limitNumber,
        where: {
          pessoa: {
            filialId,
            ...searchFilter,
          },
        },
        select: {
          id: true,
          pessoaId: true,
          registro_profissional: true,
          createdAt: true,
          updatedAt: true,
          pessoa: {
            select: {
              id: true,
              nome: true,
              cpf: true,
              email: true,
              filialId: true,
              data_nascimento: true,
              status: true,
              enderecos: true,
              contatos: true,
              usuario: {
                select: {
                  id: true,
                  status: true,
                  email: true,
                  username: true,
                  empresaId: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.optometrista.count({
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
      message: 'Optometrista encontrados.',
      data: {
        optometrists: optometristas,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total: total,
          totalPages: Math.ceil(total / limitNumber),
        },
      },
    };
  }

  async findById(id: string): Promise<ResponseJson> {
    const optometrista = await this.prisma.optometrista.findUnique({
      where: { id },
      select: {
        id: true,
        pessoaId: true,
        createdAt: true,
        updatedAt: true,
        pessoa: {
          select: {
            nome: true,
            cpf: true,
            email: true,
            filialId: true,
            usuario: {
              select: {
                id: true,
                email: true,
                username: true,
                empresaId: true,
              },
            },
          },
        },
      },
    });

    if (!optometrista) {
      return { status: 422, message: 'Optometrista não encontrado.' };
    }

    return {
      status: 200,
      message: 'Optometrista encontrado.',
      data: {
        id: optometrista.id,
        pessoaId: optometrista.pessoaId,
        nome: optometrista.pessoa.nome,
        cpf: optometrista.pessoa.cpf,
        email: optometrista.pessoa.email,
        filialId: optometrista.pessoa.filialId,
        usuario: optometrista.pessoa.usuario,
        createdAt: optometrista.createdAt,
        updatedAt: optometrista.updatedAt,
      },
    };
  }

  async update(id: string, dto: UpdateDto): Promise<ResponseJson> {
    const optometrista = await this.prisma.optometrista.findUnique({
      where: { id },
      include: {
        pessoa: {
          include: {
            usuario: true,
          },
        },
      },
    });

    if (!optometrista) {
      return { status: 422, message: 'optometrista não encontrado.' };
    }

    const usuario = optometrista.pessoa.usuario;

    if (!usuario) {
      return {
        status: 422,
        message: 'Usuário vinculado ao optometrista não foi encontrado.',
      };
    }

    if (dto.pessoa.cpf && dto.pessoa.cpf !== optometrista.pessoa.cpf) {
      const pessoaComCpf = await this.prisma.pessoa.findUnique({
        where: { cpf: dto.pessoa.cpf },
      });

      if (pessoaComCpf) {
        return { status: 400, message: 'Já existe pessoa com este CPF.' };
      }
    }

    if (dto.pessoa.email && dto.pessoa.email !== usuario.email) {
      const usuarioComEmail = await this.prisma.usuario.findUnique({
        where: { email: dto.pessoa.email },
      });

      if (usuarioComEmail && usuarioComEmail.id !== usuario.id) {
        return { status: 400, message: 'Usuário já existe com este email.' };
      }
    }

    const filialDestinoId = dto.pessoa.filialId ?? optometrista.pessoa.filialId;

    const filialDestino = await this.prisma.filial.findUnique({
      where: { id: filialDestinoId },
      select: { id: true, empresaId: true },
    });

    if (!filialDestino) {
      return { status: 422, message: 'Filial não encontrada.' };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.pessoa.update({
        where: { id: optometrista.pessoaId },
        data: {
          nome: dto.pessoa.nome,
          cpf: dto.pessoa.cpf,
          email: dto.pessoa.email,
          data_nascimento: dto.pessoa.data_nascimento,
          filialId: filialDestino.id,
        },
      });

      await tx.endereco.deleteMany({
        where: { pessoaId: optometrista.pessoaId },
      });

      if (dto.pessoa.enderecos && dto.pessoa.enderecos.length > 0) {
        await tx.endereco.createMany({
          data: dto.pessoa.enderecos.map((endereco) => ({
            ...endereco,
            pessoaId: optometrista.pessoaId,
            numero: endereco.numero || '',
          })),
        });
      }

      await tx.contato.deleteMany({
        where: { pessoaId: optometrista.pessoaId },
      });

      if (dto.pessoa.contatos && dto.pessoa.contatos.length > 0) {
        await tx.contato.createMany({
          data: dto.pessoa.contatos.map((contato) => ({
            ...contato,
            pessoaId: optometrista.pessoaId,
          })),
        });
      }

      await tx.usuario.update({
        where: { id: usuario.id },
        data: {
          empresaId: filialDestino.empresaId,
          email: dto.pessoa.email,
          username: dto.pessoa.nome,
        },
      });
    });

    return this.findById(id);
  }

  async updateStatus(id: string, status: Status): Promise<ResponseJson> {
    const optometrista = await this.prisma.optometrista.findUnique({
      where: { id },
      include: {
        pessoa: {
          include: {
            usuario: true,
          },
        },
      },
    });

    if (!optometrista) {
      return { status: 422, message: 'Optometrista não encontrado.' };
    }

    const usuario = optometrista.pessoa.usuario;

    if (!usuario) {
      return {
        status: 422,
        message: 'Usuário vinculado ao optometrista não foi encontrado.',
      };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.pessoa.update({
        where: { id: optometrista.pessoaId },
        data: { status },
      });

      await tx.usuario.update({
        where: { id: usuario.id },
        data: { status },
      });
    });

    return this.findById(id);
  }

  async deleteById(id: string): Promise<ResponseJson> {
    const optometrista = await this.prisma.optometrista.findUnique({
      where: { id },
      include: {
        pessoa: {
          include: {
            usuario: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!optometrista) {
      return { status: 422, message: 'Optometrista não encontrado.' };
    }

    await this.prisma.$transaction(async (tx) => {
      if (optometrista.pessoa.usuario) {
        await tx.usuario.delete({
          where: { id: optometrista.pessoa.usuario.id },
        });
      }

      await tx.pessoa.delete({
        where: { id: optometrista.pessoaId },
      });

      await tx.optometrista.delete({
        where: { id },
      });
    });

    return { status: 200, message: 'Optometrista deletado com sucesso.' };
  }
}
