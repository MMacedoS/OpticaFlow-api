import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';

export interface FiltroAuditoria {
  page: number;
  limit: number;
  search?: string;
  usuarioId?: string;
  entidade?: string;
  acao?: string;
  entidadeId?: string;
  dataInicio?: string;
  dataFim?: string;
}

const INCLUDE_AUDITORIA = {
  filial: { select: { id: true, nome: true } },
  usuario: {
    select: {
      id: true,
      email: true,
      username: true,
      pessoa: { select: { nome: true } },
    },
  },
} satisfies Prisma.AuditoriaInclude;

/** Consulta da auditoria. Os registros sao gravados pelo AuditoriaInterceptor e nunca alterados. */
@Injectable()
export class AuditoriaService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    escopo: EscopoUsuario,
    filtro: FiltroAuditoria,
  ): Promise<ResponseJson> {
    const page = Math.max(1, filtro.page);
    const limit = Math.min(100, Math.max(1, filtro.limit));
    const search = filtro.search?.trim();

    const where: Prisma.AuditoriaWhereInput = {
      ...this.whereEscopo(escopo),
      ...(filtro.usuarioId && { usuarioId: filtro.usuarioId }),
      ...(filtro.entidade && { entidade: filtro.entidade }),
      ...(filtro.acao && { acao: filtro.acao }),
      ...(filtro.entidadeId && { entidadeId: filtro.entidadeId }),
      ...this.wherePeriodo(filtro.dataInicio, filtro.dataFim),
      ...(search && {
        OR: [
          { entidadeId: { contains: search, mode: 'insensitive' } },
          { ip: { contains: search, mode: 'insensitive' } },
          { usuario: { email: { contains: search, mode: 'insensitive' } } },
          {
            usuario: {
              pessoa: { nome: { contains: search, mode: 'insensitive' } },
            },
          },
        ],
      }),
    };

    const [auditorias, total] = await this.prisma.$transaction([
      this.prisma.auditoria.findMany({
        where,
        include: INCLUDE_AUDITORIA,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditoria.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Auditorias listadas com sucesso.',
      data: {
        audits: auditorias,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  /** Valores disponiveis para os filtros da tela (dentro do escopo). */
  async opcoes(escopo: EscopoUsuario): Promise<ResponseJson> {
    const where = this.whereEscopo(escopo);

    const [entidades, acoes, usuarios] = await Promise.all([
      this.prisma.auditoria.findMany({
        where,
        distinct: ['entidade'],
        select: { entidade: true },
        orderBy: { entidade: 'asc' },
      }),
      this.prisma.auditoria.findMany({
        where,
        distinct: ['acao'],
        select: { acao: true },
        orderBy: { acao: 'asc' },
      }),
      this.prisma.usuario.findMany({
        where: { auditorias: { some: where } },
        select: {
          id: true,
          email: true,
          pessoa: { select: { nome: true } },
        },
        orderBy: { email: 'asc' },
      }),
    ]);

    return {
      status: 200,
      message: 'Opções de filtro da auditoria.',
      data: {
        entidades: entidades.map((item) => item.entidade),
        acoes: acoes.map((item) => item.acao),
        usuarios: usuarios.map((usuario) => ({
          id: usuario.id,
          nome: usuario.pessoa?.nome ?? usuario.email,
          email: usuario.email,
        })),
      },
    };
  }

  async findById(id: string, escopo: EscopoUsuario): Promise<ResponseJson> {
    const auditoria = await this.prisma.auditoria.findFirst({
      where: { id, ...this.whereEscopo(escopo) },
      include: INCLUDE_AUDITORIA,
    });

    if (!auditoria) {
      throw new NotFoundException('Registro de auditoria não encontrado.');
    }

    return {
      status: 200,
      message: 'Auditoria encontrada com sucesso.',
      data: auditoria,
    };
  }

  /** Superadmin ve tudo; demais, a empresa e (se tiver) a propria filial. */
  private whereEscopo(escopo: EscopoUsuario): Prisma.AuditoriaWhereInput {
    if (escopo.superadmin) return {};

    return {
      empresaId: escopo.empresaId,
      ...(escopo.filialId && { filialId: escopo.filialId }),
    };
  }

  private wherePeriodo(
    dataInicio?: string,
    dataFim?: string,
  ): Prisma.AuditoriaWhereInput {
    const inicio = dataInicio ? new Date(`${dataInicio}T00:00:00`) : undefined;
    const fim = dataFim ? new Date(`${dataFim}T23:59:59.999`) : undefined;
    const valida = (data?: Date) => data && !Number.isNaN(data.getTime());

    if (!valida(inicio) && !valida(fim)) return {};

    return {
      createdAt: {
        ...(valida(inicio) && { gte: inicio }),
        ...(valida(fim) && { lte: fim }),
      },
    };
  }
}
