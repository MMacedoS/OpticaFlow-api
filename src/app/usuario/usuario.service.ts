import { atribuirAcessosPorModulo } from 'src/common/acesso/atribuir-acessos';
import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUsuarioDto } from './dto/createUsuario.dto';
import { Usuario } from './interface/usuario.interface';
import { ResponseJson } from 'src/interface/response/response.interface';
import { UpdateUsuarioDto } from './dto/updateUsuario.dto';

/** Campos publicos do usuario. Nunca inclui a senha. */
const USUARIO_PUBLICO = {
  id: true,
  email: true,
  username: true,
  pessoaId: true,
  empresaId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UsuarioSelect;

@Injectable()
export class UsuarioService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateUsuarioDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const usuarioExistente = await this.findByEmail(dto.email);

    if (usuarioExistente) {
      return { status: 400, message: 'Usuário já existe com este email.' };
    }

    // Usuario comum sempre cria na propria empresa. O superadmin cria na
    // empresa da pessoa vinculada (ou sem empresa, se nao houver pessoa).
    let empresaId: string | null = escopo.superadmin
      ? null
      : (escopo.empresaId ?? null);

    if (dto.pessoaId) {
      const pessoa = await this.buscarPessoaNoEscopo(
        dto.pessoaId,
        escopo.superadmin ? undefined : escopo.empresaId,
      );

      if (!pessoa) {
        return { status: 422, message: 'Pessoa não encontrada com este ID.' };
      }

      empresaId = pessoa.filial.empresaId;
    }

    const passwordHash = await bcrypt.hash(dto.senha, 10);

    let usuario;

    try {
      usuario = await this.prisma.$transaction(async (tx) => {
        const novoUsuario = await tx.usuario.create({
          data: {
            email: dto.email.trim().toLowerCase(),
            senha: passwordHash,
            username: dto.username,
            pessoaId: dto.pessoaId,
            empresaId,
          },
        });

        // Perfis padrao: somente quando o superadmin cria o usuario. Usuario
        // criado por um usuario comum nasce SEM perfis; o administrador da
        // empresa atribui os perfis pelo modulo de acesso (ou o usuario e
        // criado pelo cadastro de funcionario, que atribui perfis por cargo).
        // Evita escalar privilegios concedendo todos os modulos do sistema.
        if (escopo.superadmin) {
          await atribuirAcessosPorModulo(tx, novoUsuario.id);
        }

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
        empresaId: usuario.empresaId,
      },
    };
  }

  /**
   * Uso interno (auth): retorna o registro completo, INCLUINDO a senha.
   * Nunca expor em rotas; o controller usa findByEmailNoEscopo.
   */
  async findByEmail(email: string): Promise<any> {
    return this.prisma.usuario.findFirst({
      where: { email: { equals: email.trim(), mode: 'insensitive' } },
    });
  }

  /** Uso interno (auth, filial, convenio): sem filtro de empresa. */
  async findById(id: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({
      where: { id: id },
      select: USUARIO_PUBLICO,
    });
  }

  /**
   * Rotas GET /usuario/:id e /usuario/email/:email: mesmo formato de antes
   * (objeto do usuario, sem envelope), mas restrito ao escopo e sem senha.
   */
  async findByIdNoEscopo(id: string, escopo: EscopoUsuario): Promise<Usuario> {
    return this.buscarNoEscopo({ id }, escopo);
  }

  async findByEmailNoEscopo(
    email: string,
    escopo: EscopoUsuario,
  ): Promise<Usuario> {
    return this.buscarNoEscopo(
      { email: { equals: email.trim(), mode: 'insensitive' } },
      escopo,
    );
  }

  async findAll(
    escopo: EscopoUsuario,
    page: number = 1,
    limit: number = 10,
    search: string = '',
  ): Promise<ResponseJson> {
    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, limit);

    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.UsuarioWhereInput = {
      ...this.filtroEscopo(escopo),
      ...(search && {
        OR: [
          { username: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [usuarios, totalUsuarios] = await Promise.all([
      this.prisma.usuario.findMany({
        skip: skip,
        take: limitNumber,
        where,
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
      this.prisma.usuario.count({ where }),
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

  /** Uso interno (EnrichUserInterceptor, auth): sem filtro de empresa. */
  async findPessoaByUserId(userId: string): Promise<any> {
    return await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        pessoaId: true,
        empresaId: true,
        superadmin: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        pessoa: {
          include: {
            optometrista: { select: { id: true } },
            oftalmologista: { select: { id: true } },
          },
        },
      },
    });
  }

  async deleteById(id: string, escopo: EscopoUsuario): Promise<ResponseJson> {
    await this.buscarNoEscopo({ id }, escopo);

    await this.prisma.usuario.delete({
      where: { id },
    });

    return { status: 200, message: 'Usuário deletado com sucesso.' };
  }

  async updateStatus(
    id: string,
    status: string,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    await this.buscarNoEscopo({ id }, escopo);

    await this.prisma.usuario.update({
      where: { id },
      data: { status: status as Prisma.EnumStatusFieldUpdateOperationsInput },
    });

    return {
      status: 200,
      message: 'Status do usuário atualizado com sucesso.',
    };
  }

  async update(
    id: string,
    dto: UpdateUsuarioDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const user = await this.buscarNoEscopo({ id }, escopo);

    if (dto.pessoaId && dto.pessoaId !== user.pessoaId) {
      // A nova pessoa precisa ser da mesma empresa do usuario alterado.
      const pessoa = await this.buscarPessoaNoEscopo(
        dto.pessoaId,
        escopo.empresaId ?? user.empresaId ?? undefined,
      );

      if (!pessoa) {
        return { status: 422, message: 'Pessoa não encontrada com este ID.' };
      }
    }

    const passwordHash = dto.senha ? await bcrypt.hash(dto.senha, 10) : null;

    let updatedUser;

    try {
      updatedUser = await this.prisma.usuario.update({
        where: { id },
        data: {
          email: dto.email,
          username: dto.username,
          pessoaId: dto.pessoaId,
          ...(passwordHash && { senha: passwordHash }),
        },
        select: USUARIO_PUBLICO,
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

  /**
   * Superadmin ve todos os usuarios. Os demais so enxergam usuarios da
   * propria empresa e nunca um superadmin (nao podem le-lo nem altera-lo).
   */
  private filtroEscopo(escopo: EscopoUsuario): Prisma.UsuarioWhereInput {
    if (escopo.superadmin) {
      return {};
    }

    return { empresaId: escopo.empresaId ?? '', superadmin: false };
  }

  private async buscarNoEscopo(
    where: Prisma.UsuarioWhereInput,
    escopo: EscopoUsuario,
  ) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { ...where, ...this.filtroEscopo(escopo) },
      select: USUARIO_PUBLICO,
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return usuario;
  }

  /** Pessoa existente e, se informada a empresa, de uma filial dela. */
  private async buscarPessoaNoEscopo(pessoaId: string, empresaId?: string) {
    return this.prisma.pessoa.findFirst({
      where: {
        id: pessoaId,
        ...(empresaId && { filial: { empresaId } }),
      },
      select: { id: true, filial: { select: { empresaId: true } } },
    });
  }
}
