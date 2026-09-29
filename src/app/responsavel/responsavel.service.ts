import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateResponsavelDto,
  UpdateResponsavelDto,
} from './dto/responsavel.dto';
import { ResponsavelResumo } from './interfaces/responsavel.interface';

@Injectable()
export class ResponsavelService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateResponsavelDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const filial = await this.buscarFilialNoEscopo(dto.filialId, escopo);

    if (!filial) {
      return { status: 422, message: 'Filial não encontrada.' };
    }

    if (dto.cpf) {
      const pessoaComCpf = await this.prisma.pessoa.findUnique({
        where: { cpf: dto.cpf },
      });

      if (pessoaComCpf) {
        return { status: 400, message: 'Já existe pessoa com este CPF.' };
      }
    }

    const usuarioExistente = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (usuarioExistente) {
      return { status: 400, message: 'Usuário já existe com este email.' };
    }

    const senhaHash = await bcrypt.hash(dto.senha, 10);

    try {
      const responsavel = await this.prisma.$transaction(async (tx) => {
        const pessoa = await tx.pessoa.create({
          data: {
            nome: dto.nome,
            cpf: dto.cpf,
            email: dto.email,
            filialId: filial.id,
          },
        });

        await tx.usuario.create({
          data: {
            empresaId: filial.empresaId,
            email: dto.email,
            senha: senhaHash,
            username: dto.username ?? dto.nome,
            pessoaId: pessoa.id,
          },
        });

        const novoResponsavel = await tx.responsavel.create({
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

        return novoResponsavel;
      });

      return {
        status: 201,
        message: 'Responsável criado com sucesso.',
        data: {
          id: responsavel.id,
          pessoaId: responsavel.pessoaId,
          nome: responsavel.pessoa.nome,
          cpf: responsavel.pessoa.cpf,
          email: responsavel.pessoa.email,
          filialId: responsavel.pessoa.filialId,
          createdAt: responsavel.createdAt,
          updatedAt: responsavel.updatedAt,
        },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return {
          status: 422,
          message: 'Responsável já existe com estes dados.',
        };
      }

      throw error;
    }
  }

  async findAllByFilial(
    filialId: string,
    escopo: EscopoUsuario,
    page: number = 1,
    limit: number = 10,
    search: string = '',
  ): Promise<ResponsavelResumo[]> {
    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, limit);
    const skip = (pageNumber - 1) * limitNumber;

    const filial = await this.buscarFilialNoEscopo(filialId, escopo);

    if (!filial) {
      throw new NotFoundException('Filial não encontrada.');
    }

    const searchFilter = search
      ? {
          OR: [
            { nome: { contains: search, mode: 'insensitive' as const } },
            { cpf: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            {
              usuario: {
                is: {
                  email: { contains: search, mode: 'insensitive' as const },
                },
              },
            },
            {
              usuario: {
                is: {
                  username: { contains: search, mode: 'insensitive' as const },
                },
              },
            },
          ],
        }
      : {};

    const responsaveis = await this.prisma.responsavel.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return responsaveis.map((responsavel) => ({
      id: responsavel.id,
      pessoaId: responsavel.pessoaId,
      nome: responsavel.pessoa.nome,
      cpf: responsavel.pessoa.cpf,
      email: responsavel.pessoa.email,
      filialId: responsavel.pessoa.filialId,
      usuario: responsavel.pessoa.usuario,
      createdAt: responsavel.createdAt,
      updatedAt: responsavel.updatedAt,
    }));
  }

  async findById(id: string, escopo: EscopoUsuario): Promise<ResponseJson> {
    const responsavel = await this.prisma.responsavel.findFirst({
      where: { id, ...this.filtroEscopo(escopo) },
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

    if (!responsavel) {
      throw new NotFoundException('Responsável não encontrado.');
    }

    return {
      status: 200,
      message: 'Responsável encontrado.',
      data: {
        id: responsavel.id,
        pessoaId: responsavel.pessoaId,
        nome: responsavel.pessoa.nome,
        cpf: responsavel.pessoa.cpf,
        email: responsavel.pessoa.email,
        filialId: responsavel.pessoa.filialId,
        usuario: responsavel.pessoa.usuario,
        createdAt: responsavel.createdAt,
        updatedAt: responsavel.updatedAt,
      },
    };
  }

  async update(
    id: string,
    dto: UpdateResponsavelDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const responsavel = await this.prisma.responsavel.findFirst({
      where: { id, ...this.filtroEscopo(escopo) },
      include: {
        pessoa: {
          include: {
            usuario: {
              select: { id: true, email: true, superadmin: true },
            },
          },
        },
      },
    });

    if (!responsavel) {
      throw new NotFoundException('Responsável não encontrado.');
    }

    const usuario = responsavel.pessoa.usuario;

    if (!usuario) {
      return {
        status: 422,
        message: 'Usuário vinculado ao responsável não foi encontrado.',
      };
    }

    this.impedirAlterarSuperadmin(usuario.superadmin, escopo);

    if (dto.cpf && dto.cpf !== responsavel.pessoa.cpf) {
      const pessoaComCpf = await this.prisma.pessoa.findUnique({
        where: { cpf: dto.cpf },
      });

      if (pessoaComCpf) {
        return { status: 400, message: 'Já existe pessoa com este CPF.' };
      }
    }

    if (dto.email && dto.email !== usuario.email) {
      const usuarioComEmail = await this.prisma.usuario.findUnique({
        where: { email: dto.email },
      });

      if (usuarioComEmail && usuarioComEmail.id !== usuario.id) {
        return { status: 400, message: 'Usuário já existe com este email.' };
      }
    }

    const filialDestinoId = dto.filialId ?? responsavel.pessoa.filialId;
    const filialDestino = await this.buscarFilialNoEscopo(
      filialDestinoId,
      escopo,
    );

    if (!filialDestino) {
      return { status: 422, message: 'Filial não encontrada.' };
    }

    const senhaHash = dto.senha ? await bcrypt.hash(dto.senha, 10) : null;

    await this.prisma.$transaction(async (tx) => {
      await tx.pessoa.update({
        where: { id: responsavel.pessoaId },
        data: {
          nome: dto.nome,
          cpf: dto.cpf,
          email: dto.email,
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

    return this.findById(id, escopo);
  }

  async deleteById(id: string, escopo: EscopoUsuario): Promise<ResponseJson> {
    const responsavel = await this.prisma.responsavel.findFirst({
      where: { id, ...this.filtroEscopo(escopo) },
      include: {
        pessoa: {
          include: {
            usuario: {
              select: { id: true, superadmin: true },
            },
          },
        },
      },
    });

    if (!responsavel) {
      throw new NotFoundException('Responsável não encontrado.');
    }

    this.impedirAlterarSuperadmin(
      responsavel.pessoa.usuario?.superadmin,
      escopo,
    );

    await this.prisma.$transaction(async (tx) => {
      if (responsavel.pessoa.usuario) {
        await tx.usuario.delete({
          where: { id: responsavel.pessoa.usuario.id },
        });
      }

      await tx.pessoa.delete({
        where: { id: responsavel.pessoaId },
      });
    });

    return { status: 200, message: 'Responsável deletado com sucesso.' };
  }

  /**
   * Responsaveis visiveis ao usuario: superadmin ve todos; usuario de
   * empresa ve os da empresa; usuario de filial, apenas os da sua filial.
   */
  private filtroEscopo(escopo: EscopoUsuario): Prisma.ResponsavelWhereInput {
    if (escopo.superadmin) {
      return {};
    }

    return {
      pessoa: {
        filial: { empresaId: escopo.empresaId ?? '' },
        ...(escopo.filialId && { filialId: escopo.filialId }),
      },
    };
  }

  /**
   * Filial informada no body/rota, validada no escopo do usuario. Filiais de
   * outra empresa (ou outra filial, para usuario de filial) retornam null,
   * como se nao existissem.
   */
  private async buscarFilialNoEscopo(
    filialId: string,
    escopo: EscopoUsuario,
  ): Promise<{ id: string; empresaId: string } | null> {
    if (!escopo.superadmin && escopo.filialId && filialId !== escopo.filialId) {
      return null;
    }

    return this.prisma.filial.findFirst({
      where: {
        id: filialId,
        ...(!escopo.superadmin && { empresaId: escopo.empresaId ?? '' }),
      },
      select: { id: true, empresaId: true },
    });
  }

  private impedirAlterarSuperadmin(
    alvoSuperadmin: boolean | undefined,
    escopo: EscopoUsuario,
  ): void {
    if (alvoSuperadmin && !escopo.superadmin) {
      throw new ForbiddenException(
        'Somente o superadmin pode alterar este usuário.',
      );
    }
  }
}
