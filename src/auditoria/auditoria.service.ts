import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAuditoriaDto, UpdateAuditoriaDto } from './dto/auditoria.dto';
import { AuditoriaResumo } from './interfaces/auditoria.interface';

@Injectable()
export class AuditoriaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAuditoriaDto): Promise<ResponseJson> {
    const validacao = await this.validarRelacionamentos(dto.empresaId, {
      filialId: dto.filialId,
      usuarioId: dto.usuarioId,
      atendimentoId: dto.atendimentoId,
    });

    if (!validacao.valido) {
      return { status: 422, message: validacao.mensagem };
    }

    const auditoria = await this.prisma.auditoria.create({
      data: {
        empresaId: dto.empresaId,
        filialId: dto.filialId,
        usuarioId: dto.usuarioId,
        atendimentoId: dto.atendimentoId,
        entidade: dto.entidade,
        entidadeId: dto.entidadeId,
        acao: dto.acao,
        dados_antes: dto.dados_antes as Prisma.InputJsonValue | undefined,
        dados_depois: dto.dados_depois as Prisma.InputJsonValue | undefined,
        ip: dto.ip,
        user_agent: dto.user_agent,
      },
    });

    return {
      status: 201,
      message: 'Auditoria criada com sucesso.',
      data: auditoria,
    };
  }

  async findAllByEmpresa(
    empresaId: string,
    page: number = 1,
    limit: number = 10,
    search: string = '',
    filialId?: string,
    usuarioId?: string,
    atendimentoId?: string,
    entidade?: string,
    entidadeId?: string,
    acao?: string,
    ip?: string,
    dataInicio?: string,
    dataFim?: string,
  ): Promise<ResponseJson> {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { id: true },
    });

    if (!empresa) {
      return { status: 422, message: 'Empresa nao encontrada.' };
    }

    if (filialId) {
      const filial = await this.prisma.filial.findUnique({
        where: { id: filialId },
        select: { id: true, empresaId: true },
      });

      if (!filial || filial.empresaId !== empresaId) {
        return {
          status: 422,
          message: 'Filial nao encontrada para a empresa informada.',
        };
      }
    }

    if (usuarioId) {
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: { id: true, empresaId: true },
      });

      if (!usuario || usuario.empresaId !== empresaId) {
        return {
          status: 422,
          message: 'Usuario nao encontrado para a empresa informada.',
        };
      }
    }

    if (atendimentoId) {
      const atendimento = await this.prisma.atendimento.findUnique({
        where: { id: atendimentoId },
        select: { id: true, empresaId: true },
      });

      if (!atendimento || atendimento.empresaId !== empresaId) {
        return {
          status: 422,
          message: 'Atendimento nao encontrado para a empresa informada.',
        };
      }
    }

    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, limit);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.AuditoriaWhereInput = {
      empresaId,
      ...(filialId && { filialId }),
      ...(usuarioId && { usuarioId }),
      ...(atendimentoId && { atendimentoId }),
      ...(entidade && {
        entidade: { contains: entidade, mode: 'insensitive' },
      }),
      ...(entidadeId && { entidadeId }),
      ...(acao && { acao: { contains: acao, mode: 'insensitive' } }),
      ...(ip && { ip: { contains: ip, mode: 'insensitive' } }),
      ...(dataInicio || dataFim
        ? {
            createdAt: {
              ...(dataInicio && { gte: new Date(dataInicio) }),
              ...(dataFim && { lte: new Date(dataFim) }),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { entidade: { contains: search, mode: 'insensitive' } },
              { entidadeId: { contains: search, mode: 'insensitive' } },
              { acao: { contains: search, mode: 'insensitive' } },
              { ip: { contains: search, mode: 'insensitive' } },
              { user_agent: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [auditorias, total] = await this.prisma.$transaction([
      this.prisma.auditoria.findMany({
        skip,
        take: limitNumber,
        where,
        include: {
          filial: { select: { id: true, nome: true } },
          usuario: { select: { id: true, email: true, username: true } },
          atendimento: {
            select: {
              id: true,
              dataAtendimento: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditoria.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Auditorias listadas com sucesso.',
      data: {
        audits: auditorias.map((auditoria) => ({
          ...this.mapResumo(auditoria),
          filial: auditoria.filial,
          usuario: auditoria.usuario,
          atendimento: auditoria.atendimento,
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

  async findById(id: string): Promise<ResponseJson> {
    const auditoria = await this.prisma.auditoria.findUnique({
      where: { id },
      include: {
        filial: { select: { id: true, nome: true } },
        usuario: { select: { id: true, email: true, username: true } },
        atendimento: {
          select: {
            id: true,
            dataAtendimento: true,
            status: true,
          },
        },
      },
    });

    if (!auditoria) {
      return { status: 422, message: 'Auditoria nao encontrada.' };
    }

    return {
      status: 200,
      message: 'Auditoria encontrada.',
      data: {
        ...this.mapResumo(auditoria),
        filial: auditoria.filial,
        usuario: auditoria.usuario,
        atendimento: auditoria.atendimento,
      },
    };
  }

  async update(id: string, dto: UpdateAuditoriaDto): Promise<ResponseJson> {
    const auditoria = await this.prisma.auditoria.findUnique({
      where: { id },
      select: {
        id: true,
        empresaId: true,
        filialId: true,
        usuarioId: true,
        atendimentoId: true,
      },
    });

    if (!auditoria) {
      return { status: 422, message: 'Auditoria nao encontrada.' };
    }

    const validacao = await this.validarRelacionamentos(auditoria.empresaId, {
      filialId: dto.filialId ?? auditoria.filialId ?? undefined,
      usuarioId: dto.usuarioId ?? auditoria.usuarioId ?? undefined,
      atendimentoId: dto.atendimentoId ?? auditoria.atendimentoId ?? undefined,
    });

    if (!validacao.valido) {
      return { status: 422, message: validacao.mensagem };
    }

    const auditoriaAtualizada = await this.prisma.auditoria.update({
      where: { id },
      data: {
        filialId: dto.filialId,
        usuarioId: dto.usuarioId,
        atendimentoId: dto.atendimentoId,
        entidade: dto.entidade,
        entidadeId: dto.entidadeId,
        acao: dto.acao,
        dados_antes: dto.dados_antes as Prisma.InputJsonValue | undefined,
        dados_depois: dto.dados_depois as Prisma.InputJsonValue | undefined,
        ip: dto.ip,
        user_agent: dto.user_agent,
      },
    });

    return {
      status: 200,
      message: 'Auditoria atualizada com sucesso.',
      data: auditoriaAtualizada,
    };
  }

  async deleteById(id: string): Promise<ResponseJson> {
    const auditoria = await this.prisma.auditoria.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!auditoria) {
      return { status: 422, message: 'Auditoria nao encontrada.' };
    }

    await this.prisma.auditoria.delete({ where: { id } });

    return {
      status: 200,
      message: 'Auditoria removida com sucesso.',
    };
  }

  private async validarRelacionamentos(
    empresaId: string,
    relacionamentos: {
      filialId?: string;
      usuarioId?: string;
      atendimentoId?: string;
    },
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

    if (relacionamentos.usuarioId) {
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: relacionamentos.usuarioId },
        select: { id: true, empresaId: true },
      });

      if (!usuario || usuario.empresaId !== empresaId) {
        return {
          valido: false,
          mensagem: 'Usuario nao encontrado para a empresa informada.',
        };
      }
    }

    if (relacionamentos.atendimentoId) {
      const atendimento = await this.prisma.atendimento.findUnique({
        where: { id: relacionamentos.atendimentoId },
        select: { id: true, empresaId: true },
      });

      if (!atendimento || atendimento.empresaId !== empresaId) {
        return {
          valido: false,
          mensagem: 'Atendimento nao encontrado para a empresa informada.',
        };
      }
    }

    return { valido: true, mensagem: '' };
  }

  private mapResumo(auditoria: AuditoriaResumo): AuditoriaResumo {
    return {
      id: auditoria.id,
      empresaId: auditoria.empresaId,
      filialId: auditoria.filialId,
      usuarioId: auditoria.usuarioId,
      atendimentoId: auditoria.atendimentoId,
      entidade: auditoria.entidade,
      entidadeId: auditoria.entidadeId,
      acao: auditoria.acao,
      dados_antes: auditoria.dados_antes,
      dados_depois: auditoria.dados_depois,
      ip: auditoria.ip,
      user_agent: auditoria.user_agent,
      createdAt: auditoria.createdAt,
    };
  }
}
