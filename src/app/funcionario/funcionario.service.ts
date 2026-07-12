import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { FuncionarioResumo } from './interfaces/funcionario.interface';
import { FuncionarioDto } from './dto/funcionario.dto';
import { getSenhaBase } from 'src/utils/validator';

@Injectable()
export class FuncionarioService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: FuncionarioDto): Promise<ResponseJson> {
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
      const funcionario = await this.prisma.$transaction(async (tx) => {
        const pessoa = await tx.pessoa.create({
          data: {
            nome: dto.pessoa.nome,
            cpf: dto.pessoa.cpf,
            email: dto.pessoa.email,
            filialId: filial.id,
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
            nome: { notIn: ['empresa', 'usuario', 'filial', 'funcionario'] },
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

        const novoFuncionario = await tx.funcionario.create({
          data: {
            pessoaId: pessoa.id,
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

        return novoFuncionario;
      });

      return {
        status: 201,
        message: 'Funcionário criado com sucesso.',
        data: {
          id: funcionario.id,
          pessoaId: funcionario.pessoaId,
          nome: funcionario.pessoa.nome,
          cpf: funcionario.pessoa.cpf,
          email: funcionario.pessoa.email,
          filialId: funcionario.pessoa.filialId,
          createdAt: funcionario.createdAt,
          updatedAt: funcionario.updatedAt,
        },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return {
          status: 422,
          message: 'Funcionário já existe com estes dados.',
        };
      }

      throw error;
    }
  }

  // async findAllByFilial(
  //   filialId: string,
  //   page: number = 1,
  //   limit: number = 10,
  //   search: string = '',
  // ): Promise<FuncionarioResumo[]> {
  //   const pageNumber = Math.max(1, page);
  //   const limitNumber = Math.max(1, limit);
  //   const skip = (pageNumber - 1) * limitNumber;

  //   const searchFilter = search
  //     ? {
  //         OR: [
  //           { nome: { contains: search, mode: 'insensitive' as const } },
  //           { cpf: { contains: search, mode: 'insensitive' as const } },
  //           { email: { contains: search, mode: 'insensitive' as const } },
  //           {
  //             usuario: {
  //               is: {
  //                 email: { contains: search, mode: 'insensitive' as const },
  //               },
  //             },
  //           },
  //           {
  //             usuario: {
  //               is: {
  //                 username: { contains: search, mode: 'insensitive' as const },
  //               },
  //             },
  //           },
  //         ],
  //       }
  //     : {};

  //   const funcionarios = await this.prisma.funcionario.findMany({
  //     skip,
  //     take: limitNumber,
  //     where: {
  //       pessoa: {
  //         filialId,
  //         ...searchFilter,
  //       },
  //     },
  //     select: {
  //       id: true,
  //       pessoaId: true,
  //       createdAt: true,
  //       updatedAt: true,
  //       pessoa: {
  //         select: {
  //           nome: true,
  //           cpf: true,
  //           email: true,
  //           filialId: true,
  //           usuario: {
  //             select: {
  //               id: true,
  //               email: true,
  //               username: true,
  //               empresaId: true,
  //             },
  //           },
  //         },
  //       },
  //     },
  //     orderBy: {
  //       createdAt: 'desc',
  //     },
  //   });

  //   return funcionarios.map((funcionario) => ({
  //     id: funcionario.id,
  //     pessoaId: funcionario.pessoaId,
  //     nome: funcionario.pessoa.nome,
  //     cpf: funcionario.pessoa.cpf,
  //     email: funcionario.pessoa.email,
  //     filialId: funcionario.pessoa.filialId,
  //     usuario: funcionario.pessoa.usuario,
  //     createdAt: funcionario.createdAt,
  //     updatedAt: funcionario.updatedAt,
  //   }));
  // }

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
            {
              email: {
                contains: criteria.search,
                mode: 'insensitive' as const,
              },
            },
            {
              usuario: {
                is: {
                  email: {
                    contains: criteria.search,
                    mode: 'insensitive' as const,
                  },
                },
              },
            },
            {
              cargo: {
                contains: criteria.search,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {};

    const [employees, total] = await this.prisma.$transaction([
      this.prisma.funcionario.findMany({
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
      this.prisma.funcionario.count({
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
        employees: employees,
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
    const funcionario = await this.prisma.funcionario.findUnique({
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

    if (!funcionario) {
      return { status: 422, message: 'Funcionário não encontrado.' };
    }

    return {
      status: 200,
      message: 'Funcionário encontrado.',
      data: {
        id: funcionario.id,
        pessoaId: funcionario.pessoaId,
        nome: funcionario.pessoa.nome,
        cpf: funcionario.pessoa.cpf,
        email: funcionario.pessoa.email,
        filialId: funcionario.pessoa.filialId,
        usuario: funcionario.pessoa.usuario,
        createdAt: funcionario.createdAt,
        updatedAt: funcionario.updatedAt,
      },
    };
  }

  async update(id: string, dto: UpdateFuncionarioDto): Promise<ResponseJson> {
    const funcionario = await this.prisma.funcionario.findUnique({
      where: { id },
      include: {
        pessoa: {
          include: {
            usuario: true,
          },
        },
      },
    });

    if (!funcionario) {
      return { status: 422, message: 'Funcionário não encontrado.' };
    }

    const usuario = funcionario.pessoa.usuario;

    if (!usuario) {
      return {
        status: 422,
        message: 'Usuário vinculado ao funcionário não foi encontrado.',
      };
    }

    if (dto.pessoa.cpf && dto.pessoa.cpf !== funcionario.pessoa.cpf) {
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

    const senhaHash = dto.pessoa.cpf
      ? await bcrypt.hash(dto.pessoa.cpf, 10)
      : null;

    await this.prisma.$transaction(async (tx) => {
      await tx.pessoa.update({
        where: { id: funcionario.pessoaId },
        data: {
          nome: dto.pessoa.nome,
          cpf: dto.pessoa.cpf,
          email: dto.pessoa.email,
          filialId: filialDestino.id,
        },
      });

      await tx.usuario.update({
        where: { id: usuario.id },
        data: {
          empresaId: filialDestino.empresaId,
          email: dto.email,
          username: dto.username,
          ...(senhaHash && { senha: senhaHash }),
        },
      });
    });

    return this.findById(id);
  }

  async deleteById(id: string): Promise<ResponseJson> {
    const funcionario = await this.prisma.funcionario.findUnique({
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

    if (!funcionario) {
      return { status: 422, message: 'Funcionário não encontrado.' };
    }

    await this.prisma.$transaction(async (tx) => {
      if (funcionario.pessoa.usuario) {
        await tx.usuario.delete({
          where: { id: funcionario.pessoa.usuario.id },
        });
      }

      await tx.pessoa.delete({
        where: { id: funcionario.pessoaId },
      });
    });

    return { status: 200, message: 'Funcionário deletado com sucesso.' };
  }
}
