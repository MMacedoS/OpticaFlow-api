import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateOftalmologistaDto,
  UpdateOftalmologistaDto,
} from './dto/oftalmologista.dto';
import { OftalmologistaResumo } from './interfaces/oftalmologista.interface';

@Injectable()
export class OftalmologistaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOftalmologistaDto): Promise<ResponseJson> {
    const filial = await this.prisma.filial.findUnique({
      where: { id: dto.filialId },
      select: { id: true, empresaId: true },
    });

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
      const oftalmologista = await this.prisma.$transaction(async (tx) => {
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

        const novoOftalmologista = await tx.oftalmologista.create({
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

        return novoOftalmologista;
      });

      return {
        status: 201,
        message: 'Oftalmologista criado com sucesso.',
        data: {
          id: oftalmologista.id,
          pessoaId: oftalmologista.pessoaId,
          nome: oftalmologista.pessoa.nome,
          cpf: oftalmologista.pessoa.cpf,
          email: oftalmologista.pessoa.email,
          filialId: oftalmologista.pessoa.filialId,
          createdAt: oftalmologista.createdAt,
          updatedAt: oftalmologista.updatedAt,
        },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return {
          status: 422,
          message: 'Oftalmologista já existe com estes dados.',
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
  ): Promise<OftalmologistaResumo[]> {
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

    const oftalmologistas = await this.prisma.oftalmologista.findMany({
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

    return oftalmologistas.map((oftalmologista) => ({
      id: oftalmologista.id,
      pessoaId: oftalmologista.pessoaId,
      nome: oftalmologista.pessoa.nome,
      cpf: oftalmologista.pessoa.cpf,
      email: oftalmologista.pessoa.email,
      filialId: oftalmologista.pessoa.filialId,
      usuario: oftalmologista.pessoa.usuario,
      createdAt: oftalmologista.createdAt,
      updatedAt: oftalmologista.updatedAt,
    }));
  }

  async findById(id: string): Promise<ResponseJson> {
    const oftalmologista = await this.prisma.oftalmologista.findUnique({
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

    if (!oftalmologista) {
      return { status: 422, message: 'Oftalmologista não encontrado.' };
    }

    return {
      status: 200,
      message: 'Oftalmologista encontrado.',
      data: {
        id: oftalmologista.id,
        pessoaId: oftalmologista.pessoaId,
        nome: oftalmologista.pessoa.nome,
        cpf: oftalmologista.pessoa.cpf,
        email: oftalmologista.pessoa.email,
        filialId: oftalmologista.pessoa.filialId,
        usuario: oftalmologista.pessoa.usuario,
        createdAt: oftalmologista.createdAt,
        updatedAt: oftalmologista.updatedAt,
      },
    };
  }

  async update(
    id: string,
    dto: UpdateOftalmologistaDto,
  ): Promise<ResponseJson> {
    const oftalmologista = await this.prisma.oftalmologista.findUnique({
      where: { id },
      include: {
        pessoa: {
          include: {
            usuario: true,
          },
        },
      },
    });

    if (!oftalmologista) {
      return { status: 422, message: 'Oftalmologista não encontrado.' };
    }

    const usuario = oftalmologista.pessoa.usuario;

    if (!usuario) {
      return {
        status: 422,
        message: 'Usuário vinculado ao oftalmologista não foi encontrado.',
      };
    }

    if (dto.cpf && dto.cpf !== oftalmologista.pessoa.cpf) {
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

    const filialDestinoId = dto.filialId ?? oftalmologista.pessoa.filialId;
    const filialDestino = await this.prisma.filial.findUnique({
      where: { id: filialDestinoId },
      select: { id: true, empresaId: true },
    });

    if (!filialDestino) {
      return { status: 422, message: 'Filial não encontrada.' };
    }

    const senhaHash = dto.senha ? await bcrypt.hash(dto.senha, 10) : null;

    await this.prisma.$transaction(async (tx) => {
      await tx.pessoa.update({
        where: { id: oftalmologista.pessoaId },
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

    return this.findById(id);
  }

  async deleteById(id: string): Promise<ResponseJson> {
    const oftalmologista = await this.prisma.oftalmologista.findUnique({
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

    if (!oftalmologista) {
      return { status: 422, message: 'Oftalmologista não encontrado.' };
    }

    await this.prisma.$transaction(async (tx) => {
      if (oftalmologista.pessoa.usuario) {
        await tx.usuario.delete({
          where: { id: oftalmologista.pessoa.usuario.id },
        });
      }

      await tx.pessoa.delete({
        where: { id: oftalmologista.pessoaId },
      });
    });

    return { status: 200, message: 'Oftalmologista deletado com sucesso.' };
  }
}
