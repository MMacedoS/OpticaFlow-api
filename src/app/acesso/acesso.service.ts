import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseJson } from 'src/interface/response/response.interface';
import { CreatePermissaoDto } from './dto/create-permissao.dto';
import { CreateAcessoDto } from './dto/create-acesso.dto';
import { VincularPermissoesDto } from './dto/vincular-permissoes.dto';
import { AtribuirAcessoUsuarioDto } from './dto/atribuir-acesso-usuario.dto';
import { AcessoResumo, PermissaoResumo } from './interfaces/acesso.interface';

@Injectable()
export class AcessoService {
  constructor(private readonly prisma: PrismaService) {}

  async createPermissao(dto: CreatePermissaoDto): Promise<ResponseJson> {
    const permissaoExistente = await this.prisma.permissao.findFirst({
      where: {
        empresaId: dto.empresaId ?? null,
        modulo: dto.modulo,
        acao: dto.acao,
      },
    });

    if (permissaoExistente) {
      return {
        status: 400,
        message: 'Permissão já cadastrada para este módulo e ação.',
      };
    }

    const permissao = await this.prisma.permissao.create({
      data: {
        empresaId: dto.empresaId,
        modulo: dto.modulo,
        acao: dto.acao,
        descricao: dto.descricao,
      },
    });

    return {
      status: 201,
      message: 'Permissão criada com sucesso.',
      data: permissao,
    };
  }

  async createAcesso(dto: CreateAcessoDto): Promise<ResponseJson> {
    const acessoExistente = await this.prisma.acesso.findUnique({
      where: { nome: dto.nome },
    });

    if (acessoExistente) {
      return { status: 400, message: 'Acesso já existe com este nome.' };
    }

    const permissaoIds = dto.permissaoIds
      ? Array.from(new Set(dto.permissaoIds))
      : [];

    if (permissaoIds.length > 0) {
      const permissoes = await this.prisma.permissao.findMany({
        where: { id: { in: permissaoIds } },
      });

      if (permissoes.length !== permissaoIds.length) {
        return {
          status: 422,
          message: 'Uma ou mais permissões informadas não existem.',
        };
      }

      const permissaoInvalida = permissoes.find((permissao) => {
        if (!dto.empresaId) {
          return permissao.empresaId !== null;
        }

        return !!permissao.empresaId && permissao.empresaId !== dto.empresaId;
      });

      if (permissaoInvalida) {
        return {
          status: 422,
          message: 'Existem permissões fora do escopo da empresa do acesso.',
        };
      }
    }

    const novoAcesso = await this.prisma.$transaction(async (tx) => {
      const acesso = await tx.acesso.create({
        data: {
          empresaId: dto.empresaId,
          nome: dto.nome,
          descricao: dto.descricao,
        },
      });

      if (permissaoIds.length > 0) {
        await tx.acessoPermissao.createMany({
          data: permissaoIds.map((permissaoId) => ({
            acessoId: acesso.id,
            permissaoId,
          })),
          skipDuplicates: true,
        });
      }

      return acesso;
    });

    const acessoComPermissoes = await this.prisma.acesso.findUnique({
      where: { id: novoAcesso.id },
      include: {
        permissao: {
          include: {
            permissao: true,
          },
        },
      },
    });

    return {
      status: 201,
      message: 'Acesso criado com sucesso.',
      data: acessoComPermissoes,
    };
  }

  async vincularPermissoes(
    acessoId: string,
    dto: VincularPermissoesDto,
  ): Promise<ResponseJson> {
    const acesso = await this.prisma.acesso.findUnique({
      where: { id: acessoId },
    });

    if (!acesso) {
      return { status: 422, message: 'Acesso não encontrado.' };
    }

    const permissaoIds = Array.from(new Set(dto.permissaoIds));

    const permissoes = await this.prisma.permissao.findMany({
      where: { id: { in: permissaoIds } },
    });

    if (permissoes.length !== permissaoIds.length) {
      return {
        status: 422,
        message: 'Uma ou mais permissões informadas não existem.',
      };
    }

    const permissaoInvalida = permissoes.find((permissao) => {
      if (!acesso.empresaId) {
        return permissao.empresaId !== null;
      }

      return !!permissao.empresaId && permissao.empresaId !== acesso.empresaId;
    });

    if (permissaoInvalida) {
      return {
        status: 422,
        message: 'Existem permissões fora do escopo da empresa do acesso.',
      };
    }

    await this.prisma.acessoPermissao.createMany({
      data: permissaoIds.map((permissaoId) => ({
        acessoId,
        permissaoId,
      })),
      skipDuplicates: true,
    });

    const acessoAtualizado = await this.prisma.acesso.findUnique({
      where: { id: acessoId },
      include: {
        permissao: {
          include: {
            permissao: true,
          },
        },
      },
    });

    return {
      status: 200,
      message: 'Permissões vinculadas ao acesso com sucesso.',
      data: acessoAtualizado,
    };
  }

  async atribuirAcessoUsuario(
    dto: AtribuirAcessoUsuarioDto,
  ): Promise<ResponseJson> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: dto.usuarioId },
      select: { id: true, empresaId: true },
    });

    if (!usuario) {
      return { status: 422, message: 'Usuário não encontrado.' };
    }

    const acesso = await this.prisma.acesso.findUnique({
      where: { id: dto.acessoId },
      select: { id: true, empresaId: true },
    });

    if (!acesso) {
      return { status: 422, message: 'Acesso não encontrado.' };
    }

    if (
      acesso.empresaId &&
      usuario.empresaId &&
      acesso.empresaId !== usuario.empresaId
    ) {
      return {
        status: 422,
        message: 'Acesso e usuário pertencem a empresas diferentes.',
      };
    }

    const atribuicaoExistente = await this.prisma.atribuicao.findFirst({
      where: {
        usuarioId: dto.usuarioId,
        acessoId: dto.acessoId,
      },
    });

    if (atribuicaoExistente) {
      return {
        status: 400,
        message: 'Este acesso já está atribuído ao usuário.',
      };
    }

    const atribuicao = await this.prisma.atribuicao.create({
      data: {
        usuarioId: dto.usuarioId,
        acessoId: dto.acessoId,
      },
      include: {
        acesso: {
          include: {
            permissao: {
              include: {
                permissao: true,
              },
            },
          },
        },
      },
    });

    return {
      status: 201,
      message: 'Acesso atribuído ao usuário com sucesso.',
      data: atribuicao,
    };
  }

  async listarPermissoes(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    empresaId?: string,
  ): Promise<PermissaoResumo[]> {
    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, limit);
    const skip = (pageNumber - 1) * limitNumber;

    const whereFilter = {
      ...(empresaId ? { empresaId } : {}),
      ...(search
        ? {
            OR: [
              { modulo: { contains: search, mode: 'insensitive' as const } },
              { acao: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    return this.prisma.permissao.findMany({
      skip,
      take: limitNumber,
      where: whereFilter,
      select: {
        id: true,
        empresaId: true,
        modulo: true,
        acao: true,
        descricao: true,
      },
      orderBy: {
        modulo: 'asc',
      },
    });
  }

  async listarAcessos(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    empresaId?: string,
  ): Promise<AcessoResumo[]> {
    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, limit);
    const skip = (pageNumber - 1) * limitNumber;

    const whereFilter = {
      ...(empresaId ? { empresaId } : {}),
      ...(search
        ? {
            OR: [
              { nome: { contains: search, mode: 'insensitive' as const } },
              { descricao: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    return this.prisma.acesso.findMany({
      skip,
      take: limitNumber,
      where: whereFilter,
      select: {
        id: true,
        nome: true,
        descricao: true,
        empresaId: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async listarAtribuicoesDoUsuario(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    if (!usuario) {
      return { status: 422, message: 'Usuário não encontrado.' };
    }

    const atribuicoes = await this.prisma.atribuicao.findMany({
      where: { usuarioId },
      select: {
        acesso: {
          select: {
            id: true,
            nome: true,
            descricao: true,
            permissao: {
              select: {
                permissao: {
                  select: {
                    id: true,
                    modulo: true,
                    acao: true,
                    descricao: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });

    return {
      status: 200,
      message: 'Atribuições carregadas com sucesso.',
      data: atribuicoes,
    };
  }
}
