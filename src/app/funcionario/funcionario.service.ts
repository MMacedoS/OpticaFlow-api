import { ControleAcesso } from './../../constants/acessos';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { FuncionarioDto, UpdateFuncionarioDto } from './dto/funcionario.dto';
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
            data_nascimento: dto.pessoa.data_nascimento,
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
            nome: { notIn: ControleAcesso.getRestricoes(dto.cargo) },
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
            cargo: dto.cargo,
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
          employees: funcionario,
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

  async findById(id: string): Promise<any> {
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
            status: true,
            usuario: {
              select: {
                id: true,
                email: true,
                username: true,
                empresaId: true,
                status: true,
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
      id: funcionario.id,
      pessoaId: funcionario.pessoaId,
      nome: funcionario.pessoa.nome,
      cpf: funcionario.pessoa.cpf,
      email: funcionario.pessoa.email,
      filialId: funcionario.pessoa.filialId,
      usuario: funcionario.pessoa.usuario,
      createdAt: funcionario.createdAt,
      updatedAt: funcionario.updatedAt,
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

    await this.prisma.$transaction(async (tx) => {
      await tx.pessoa.update({
        where: { id: funcionario.pessoaId },
        data: {
          nome: dto.pessoa.nome,
          cpf: dto.pessoa.cpf,
          email: dto.pessoa.email,
          data_nascimento: dto.pessoa.data_nascimento,
        },
      });

      await tx.endereco.deleteMany({
        where: { pessoaId: funcionario.pessoaId },
      });

      if (dto.pessoa.enderecos && dto.pessoa.enderecos.length > 0) {
        await tx.endereco.createMany({
          data: dto.pessoa.enderecos.map((endereco) => ({
            ...endereco,
            pessoaId: funcionario.pessoaId,
            numero: endereco.numero || '',
          })),
        });
      }

      if (dto.pessoa.contatos && dto.pessoa.contatos.length > 0) {
        await tx.contato.deleteMany({
          where: { pessoaId: funcionario.pessoaId },
        });

        await tx.contato.createMany({
          data: dto.pessoa.contatos.map((contato) => ({
            ...contato,
            pessoaId: funcionario.pessoaId,
          })),
        });
      }

      await tx.usuario.update({
        where: { id: usuario.id },
        data: {
          email: dto.pessoa.email,
          username: dto.pessoa.nome,
        },
      });

      if (dto.cargo && dto.cargo !== funcionario.cargo) {
        await tx.atribuicao.deleteMany({
          where: { usuarioId: usuario.id },
        });

        const todosAcessos = await tx.acesso.findMany({
          where: {
            nome: { notIn: ControleAcesso.getRestricoes(dto.cargo) },
          },
          select: { id: true },
        });

        await tx.atribuicao.createMany({
          data: todosAcessos.map((acesso) => ({
            usuarioId: usuario.id,
            acessoId: acesso.id,
          })),
          skipDuplicates: true,
        });

        await tx.funcionario.update({
          where: { id },
          data: {
            cargo: dto.cargo,
          },
        });
      }
    });

    return this.findById(id);
  }

  async updateStatus(id: string, status: string): Promise<ResponseJson> {
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

    await this.prisma.$transaction(async (tx) => {
      await tx.pessoa.update({
        where: { id: funcionario.pessoaId },
        data: {
          status: status as any,
        },
      });

      await tx.usuario.update({
        where: { id: usuario.id },
        data: {
          status: status as any,
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
        await tx.atribuicao.deleteMany({
          where: { usuarioId: funcionario.pessoa.usuario.id },
        });
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
