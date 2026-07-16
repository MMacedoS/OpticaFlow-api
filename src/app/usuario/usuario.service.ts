import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUsuarioDto } from './dto/createUsuario.dto';
import { Usuario } from './usuario.interface';
import { ResponseJson } from 'src/interface/response/response.interface';
import { UpdateUsuarioDto } from './dto/updateUsuario.dto';
import { Observable } from 'rxjs';

@Injectable()
export class UsuarioService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUsuarioDto): Promise<ResponseJson> {
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
      usuario = await this.prisma.$transaction(async (tx) => {
        const novoUsuario = await tx.usuario.create({
          data: {
            email: dto.email,
            senha: passwordHash,
            username: dto.username,
            pessoaId: dto.pessoaId,
          },
        });

        await this.vincularTodosAcessos(novoUsuario.id, tx);

        return novoUsuario;
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

  private async vincularTodosAcessos(
    usuarioId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const acessos = await tx.acesso.findMany({
      select: {
        id: true,
      },
    });

    if (acessos.length === 0) {
      return;
    }

    await tx.atribuicao.createMany({
      data: acessos.map((acesso) => ({
        usuarioId,
        acessoId: acesso.id,
      })),
      skipDuplicates: true,
    });
  }

  async findByEmail(email: string): Promise<any> {
    return this.prisma.usuario.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({
      where: { id: id },
      select: {
        id: true,
        email: true,
        username: true,
        pessoaId: true,
        empresaId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findAll(
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
            { username: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [usuarios, totalUsuarios] = await Promise.all([
      this.prisma.usuario.findMany({
        skip: skip,
        take: limitNumber,
        where: searchFilter,
        select: {
          id: true,
          username: true,
          email: true,
          empresaId: true,
          empresa: true,
          status: true,
          pessoa: true,
          createdAt: true,
        },
      }),
      this.prisma.usuario.count({ where: searchFilter }),
    ]);

    return {
      status: 200,
      message: 'Usuários listados com sucesso.',
      data: {
        users: usuarios,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total: totalUsuarios,
          totalPages: Math.ceil(totalUsuarios / limitNumber),
        },
      },
    };
  }

  async findPessoaByUserId(userId: string): Promise<any> {
    return await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        pessoaId: true,
        empresaId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        pessoa: true,
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

  async updateStatus(id: string, status: string): Promise<ResponseJson> {
    const user = await this.findById(id);
    if (!user) {
      return { status: 422, message: 'Usuário não encontrado.' };
    }

    await this.prisma.usuario.update({
      where: { id },
      data: { status: status as Prisma.EnumStatusFieldUpdateOperationsInput },
    });

    return {
      status: 200,
      message: 'Status do usuário atualizado com sucesso.',
    };
  }

  async update(id: string, dto: UpdateUsuarioDto): Promise<ResponseJson> {
    const user = await this.findById(id);
    if (!user) {
      return { status: 422, message: 'Usuário não encontrado.' };
    }

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const updatingUser = await this.prisma.usuario.update({
        where: { id },
        data: {
          email: dto.email,
          username: dto.username,
          pessoaId: dto.pessoaId,
        },
      });

      if (dto.senha) {
        const passwordHash = await bcrypt.hash(dto.senha, 10);
        await tx.usuario.update({
          where: { id },
          data: { senha: passwordHash },
        });
      }
      return updatingUser;
    });

    return {
      status: 200,
      message: 'Usuário atualizado com sucesso.',
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        pessoaId: updatedUser.pessoaId,
      },
    };
  }
}
