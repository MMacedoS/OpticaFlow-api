import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsuarioDto } from './dto/usuario.dto';
import { Usuario } from './usuario.interface';
import { ResponseJson } from 'src/interface/response/response.interface';

@Injectable()
export class UsuarioService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: UsuarioDto): Promise<ResponseJson> {
    console.log('Creating user with data:', dto);
    const usuarioExistente = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (usuarioExistente) {
      return { status: 400, message: 'Usuário já existe com este email.' };
    }

    if (dto.pessoaId) {
      const pessoaExistente = await this.prisma.pessoa.findUnique({
        where: { id: dto.pessoaId },
      });

      if (!pessoaExistente) {
        return { status: 422, message: 'Pessoa não encontrada com este ID.' };
      }
    }

    const passwordHash = await bcrypt.hash(dto.senha, 10);

    let usuario;

    try {
      usuario = await this.prisma.usuario.create({
        data: {
          email: dto.email,
          senha: passwordHash,
          username: dto.username,
          pessoaId: dto.pessoaId,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return { status: 422, message: 'Usuário já existe com estes dados.' };
      }

      throw error;
    }

    if (!usuario) {
      return { status: 422, message: 'Erro ao criar usuário.' };
    }

    return {
      status: 201,
      message: 'Usuário criado com sucesso.',
      data: {
        id: usuario.id,
        email: usuario.email,
        username: usuario.username,
        pessoaId: usuario.pessoaId,
      },
    };
  }

  async findByEmail(email: string): Promise<any> {
    return this.prisma.usuario.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        pessoaId: true,
      },
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search: string = '',
  ): Promise<Usuario[]> {
    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, limit);

    const skip = (pageNumber - 1) * limitNumber;

    const searchFilter = search
      ? {
          OR: [
            { username: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    return await this.prisma.usuario.findMany({
      skip: skip,
      take: limitNumber,
      where: searchFilter,
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });
  }

  async deleteById(id: string): Promise<ResponseJson> {
    const user = await this.findById(id);
    if (!user) {
      return { status: 422, message: 'Usuário não encontrado.' };
    }

    await this.prisma.usuario.delete({
      where: { id },
    });

    return { status: 200, message: 'Usuário deletado com sucesso.' };
  }
}
