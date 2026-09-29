import { Injectable, NotFoundException } from '@nestjs/common';
import { CanalNotificacao, Prisma } from '@prisma/client';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateNotificacaoDto,
  UpdateNotificacaoDto,
} from './dto/notificacao.dto';
import { NotificacaoResumo } from './interfaces/notificacao.interface';

@Injectable()
export class NotificacaoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateNotificacaoDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    // Usuario comum sempre grava na propria empresa (e filial, se tiver).
    const empresaId = escopo.superadmin ? dto.empresaId : escopo.empresaId;

    if (!empresaId) {
      return { status: 422, message: 'Informe a empresa da notificacao.' };
    }

    if (escopo.filialId && dto.filialId && dto.filialId !== escopo.filialId) {
      return {
        status: 422,
        message: 'Filial nao encontrada para a empresa informada.',
      };
    }

    const filialId = escopo.filialId ?? dto.filialId;

    const validacao = await this.validarRelacionamentos(
      empresaId,
      {
        filialId,
        pessoaId: dto.pessoaId,
        usuarioDestinoId: dto.usuarioDestinoId,
        usuarioRemetenteId: dto.usuarioRemetenteId,
      },
      escopo.filialId,
    );

    if (!validacao.valido) {
      return { status: 422, message: validacao.mensagem };
    }

    const notificacao = await this.prisma.notificacao.create({
      data: {
        empresaId,
        filialId,
        pessoaId: dto.pessoaId,
        usuarioDestinoId: dto.usuarioDestinoId,
        usuarioRemetenteId: dto.usuarioRemetenteId,
        canal: dto.canal,
        titulo: dto.titulo,
        mensagem: dto.mensagem,
      },
    });

    return {
      status: 201,
      message: 'Notificacao criada com sucesso.',
      data: notificacao,
    };
  }

  async findAllByEmpresa(
    empresaId: string,
    escopo: EscopoUsuario,
    page: number = 1,
    limit: number = 10,
    search: string = '',
    filialId?: string,
    pessoaId?: string,
    usuarioDestinoId?: string,
    usuarioRemetenteId?: string,
    canal?: CanalNotificacao,
    lida?: boolean,
  ): Promise<ResponseJson> {
    if (!escopo.superadmin && empresaId !== escopo.empresaId) {
      throw new NotFoundException('Empresa nao encontrada.');
    }

    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { id: true },
    });

    if (!empresa) {
      return { status: 422, message: 'Empresa nao encontrada.' };
    }

    if (escopo.filialId && filialId && filialId !== escopo.filialId) {
      throw new NotFoundException('Filial nao encontrada.');
    }

    const filialFiltro = escopo.filialId ?? filialId;

    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, limit);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.NotificacaoWhereInput = {
      empresaId,
      ...(filialFiltro && { filialId: filialFiltro }),
      ...(pessoaId && { pessoaId }),
      ...(usuarioDestinoId && { usuarioDestinoId }),
      ...(usuarioRemetenteId && { usuarioRemetenteId }),
      ...(canal && { canal }),
      ...(lida === undefined
        ? {}
        : lida
          ? { lidaEm: { not: null } }
          : { lidaEm: null }),
      ...(search
        ? {
            OR: [
              { titulo: { contains: search, mode: 'insensitive' } },
              { mensagem: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [notificacoes, total] = await this.prisma.$transaction([
      this.prisma.notificacao.findMany({
        skip,
        take: limitNumber,
        where,
        include: {
          filial: { select: { id: true, nome: true } },
          pessoa: { select: { id: true, nome: true } },
          usuario_destino: {
            select: { id: true, email: true, username: true },
          },
          usuario_remetente: {
            select: { id: true, email: true, username: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notificacao.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Notificacoes listadas com sucesso.',
      data: {
        itens: notificacoes.map((notificacao) => ({
          ...this.mapResumo(notificacao),
          filial: notificacao.filial,
          pessoa: notificacao.pessoa,
          usuarioDestino: notificacao.usuario_destino,
          usuarioRemetente: notificacao.usuario_remetente,
        })),
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber),
        },
      },
    };
  }

  async findById(id: string, escopo: EscopoUsuario): Promise<ResponseJson> {
    const notificacao = await this.prisma.notificacao.findFirst({
      where: { id, ...this.filtroEscopo(escopo) },
      include: {
        filial: { select: { id: true, nome: true } },
        pessoa: { select: { id: true, nome: true } },
        usuario_destino: { select: { id: true, email: true, username: true } },
        usuario_remetente: {
          select: { id: true, email: true, username: true },
        },
      },
    });

    if (!notificacao) {
      throw new NotFoundException('Notificacao nao encontrada.');
    }

    return {
      status: 200,
      message: 'Notificacao encontrada.',
      data: {
        ...this.mapResumo(notificacao),
        filial: notificacao.filial,
        pessoa: notificacao.pessoa,
        usuarioDestino: notificacao.usuario_destino,
        usuarioRemetente: notificacao.usuario_remetente,
      },
    };
  }

  async update(
    id: string,
    dto: UpdateNotificacaoDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    if (escopo.filialId && dto.filialId && dto.filialId !== escopo.filialId) {
      return {
        status: 422,
        message: 'Filial nao encontrada para a empresa informada.',
      };
    }

    const notificacao = await this.prisma.notificacao.findFirst({
      where: { id, ...this.filtroEscopo(escopo) },
      select: {
        id: true,
        empresaId: true,
        filialId: true,
        pessoaId: true,
        usuarioDestinoId: true,
        usuarioRemetenteId: true,
      },
    });

    if (!notificacao) {
      throw new NotFoundException('Notificacao nao encontrada.');
    }

    const validacao = await this.validarRelacionamentos(
      notificacao.empresaId,
      {
        filialId: dto.filialId ?? notificacao.filialId ?? undefined,
        pessoaId: dto.pessoaId ?? notificacao.pessoaId ?? undefined,
        usuarioDestinoId:
          dto.usuarioDestinoId ?? notificacao.usuarioDestinoId ?? undefined,
        usuarioRemetenteId:
          dto.usuarioRemetenteId ?? notificacao.usuarioRemetenteId ?? undefined,
      },
      escopo.filialId,
    );

    if (!validacao.valido) {
      return { status: 422, message: validacao.mensagem };
    }

    const lidaEm =
      dto.lida === undefined ? undefined : dto.lida ? new Date() : null;

    const notificacaoAtualizada = await this.prisma.notificacao.update({
      where: { id },
      data: {
        filialId: dto.filialId,
        pessoaId: dto.pessoaId,
        usuarioDestinoId: dto.usuarioDestinoId,
        usuarioRemetenteId: dto.usuarioRemetenteId,
        canal: dto.canal,
        titulo: dto.titulo,
        mensagem: dto.mensagem,
        lidaEm,
      },
    });

    return {
      status: 200,
      message: 'Notificacao atualizada com sucesso.',
      data: notificacaoAtualizada,
    };
  }

  async marcarComoLida(
    id: string,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const notificacao = await this.prisma.notificacao.findFirst({
      where: { id, ...this.filtroEscopo(escopo) },
      select: { id: true },
    });

    if (!notificacao) {
      throw new NotFoundException('Notificacao nao encontrada.');
    }

    const notificacaoAtualizada = await this.prisma.notificacao.update({
      where: { id },
      data: { lidaEm: new Date() },
    });

    return {
      status: 200,
      message: 'Notificacao marcada como lida com sucesso.',
      data: notificacaoAtualizada,
    };
  }

  async marcarComoNaoLida(
    id: string,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const notificacao = await this.prisma.notificacao.findFirst({
      where: { id, ...this.filtroEscopo(escopo) },
      select: { id: true },
    });

    if (!notificacao) {
      throw new NotFoundException('Notificacao nao encontrada.');
    }

    const notificacaoAtualizada = await this.prisma.notificacao.update({
      where: { id },
      data: { lidaEm: null },
    });

    return {
      status: 200,
      message: 'Notificacao marcada como nao lida com sucesso.',
      data: notificacaoAtualizada,
    };
  }

  async deleteById(id: string, escopo: EscopoUsuario): Promise<ResponseJson> {
    const notificacao = await this.prisma.notificacao.findFirst({
      where: { id, ...this.filtroEscopo(escopo) },
      select: { id: true },
    });

    if (!notificacao) {
      throw new NotFoundException('Notificacao nao encontrada.');
    }

    await this.prisma.notificacao.delete({ where: { id } });

    return {
      status: 200,
      message: 'Notificacao removida com sucesso.',
    };
  }

  /** Empresa do usuario e, se ele tiver filial, a filial dele. */
  private filtroEscopo(escopo: EscopoUsuario): Prisma.NotificacaoWhereInput {
    if (escopo.superadmin) {
      return {};
    }

    return {
      empresaId: escopo.empresaId,
      ...(escopo.filialId && { filialId: escopo.filialId }),
    };
  }

  private async validarRelacionamentos(
    empresaId: string,
    relacionamentos: {
      filialId?: string;
      pessoaId?: string;
      usuarioDestinoId?: string;
      usuarioRemetenteId?: string;
    },
    filialRestrita?: string,
  ): Promise<{ valido: boolean; mensagem: string }> {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { id: true },
    });

    if (!empresa) {
      return { valido: false, mensagem: 'Empresa nao encontrada.' };
    }

    if (relacionamentos.filialId) {
      const filial = await this.prisma.filial.findUnique({
        where: { id: relacionamentos.filialId },
        select: { id: true, empresaId: true },
      });

      if (!filial || filial.empresaId !== empresaId) {
        return {
          valido: false,
          mensagem: 'Filial nao encontrada para a empresa informada.',
        };
      }
    }

    if (relacionamentos.pessoaId) {
      const pessoa = await this.prisma.pessoa.findUnique({
        where: { id: relacionamentos.pessoaId },
        select: {
          id: true,
          filialId: true,
          filial: {
            select: {
              empresaId: true,
            },
          },
        },
      });

      if (
        !pessoa ||
        pessoa.filial.empresaId !== empresaId ||
        (filialRestrita && pessoa.filialId !== filialRestrita)
      ) {
        return {
          valido: false,
          mensagem: 'Pessoa nao encontrada para a empresa informada.',
        };
      }
    }

    if (relacionamentos.usuarioDestinoId) {
      const usuarioDestino = await this.prisma.usuario.findUnique({
        where: { id: relacionamentos.usuarioDestinoId },
        select: { id: true, empresaId: true },
      });

      if (!usuarioDestino || usuarioDestino.empresaId !== empresaId) {
        return {
          valido: false,
          mensagem: 'Usuario destino nao encontrado para a empresa informada.',
        };
      }
    }

    if (relacionamentos.usuarioRemetenteId) {
      const usuarioRemetente = await this.prisma.usuario.findUnique({
        where: { id: relacionamentos.usuarioRemetenteId },
        select: { id: true, empresaId: true },
      });

      if (!usuarioRemetente || usuarioRemetente.empresaId !== empresaId) {
        return {
          valido: false,
          mensagem:
            'Usuario remetente nao encontrado para a empresa informada.',
        };
      }
    }

    return { valido: true, mensagem: '' };
  }

  private mapResumo(notificacao: NotificacaoResumo): NotificacaoResumo {
    return {
      id: notificacao.id,
      empresaId: notificacao.empresaId,
      filialId: notificacao.filialId,
      pessoaId: notificacao.pessoaId,
      usuarioDestinoId: notificacao.usuarioDestinoId,
      usuarioRemetenteId: notificacao.usuarioRemetenteId,
      canal: notificacao.canal,
      titulo: notificacao.titulo,
      mensagem: notificacao.mensagem,
      lidaEm: notificacao.lidaEm,
      createdAt: notificacao.createdAt,
    };
  }
}
