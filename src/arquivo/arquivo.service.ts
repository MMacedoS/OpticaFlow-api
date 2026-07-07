import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateArquivoDto, UpdateArquivoDto } from './dto/arquivo.dto';
import { ArquivoResumo } from './interfaces/arquivo.interface';

@Injectable()
export class ArquivoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateArquivoDto): Promise<ResponseJson> {
    const validacao = await this.validarRelacionamentos(dto.empresaId, {
      filialId: dto.filialId,
      pessoaId: dto.pessoaId,
      atendimentoId: dto.atendimentoId,
      prontuarioId: dto.prontuarioId,
      enviadoPorId: dto.enviadoPorId,
    });

    if (!validacao.valido) {
      return { status: 422, message: validacao.mensagem };
    }

    const arquivo = await this.prisma.arquivo.create({
      data: {
        empresaId: dto.empresaId,
        filialId: dto.filialId,
        pessoaId: dto.pessoaId,
        atendimentoId: dto.atendimentoId,
        prontuarioId: dto.prontuarioId,
        enviadoPorId: dto.enviadoPorId,
        nome: dto.nome,
        path: dto.path,
        mime_type: dto.mime_type,
        tamanho: dto.tamanho,
      },
    });

    return {
      status: 201,
      message: 'Arquivo criado com sucesso.',
      data: arquivo,
    };
  }

  async findAllByEmpresa(
    empresaId: string,
    page: number = 1,
    limit: number = 10,
    search: string = '',
    filialId?: string,
    pessoaId?: string,
    atendimentoId?: string,
    prontuarioId?: string,
    enviadoPorId?: string,
    mimeType?: string,
  ): Promise<ResponseJson> {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { id: true },
    });

    if (!empresa) {
      return { status: 422, message: 'Empresa nao encontrada.' };
    }

    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, limit);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.ArquivoWhereInput = {
      empresaId,
      ...(filialId && { filialId }),
      ...(pessoaId && { pessoaId }),
      ...(atendimentoId && { atendimentoId }),
      ...(prontuarioId && { prontuarioId }),
      ...(enviadoPorId && { enviadoPorId }),
      ...(mimeType && {
        mime_type: { contains: mimeType, mode: 'insensitive' },
      }),
      ...(search
        ? {
            OR: [
              { nome: { contains: search, mode: 'insensitive' } },
              { path: { contains: search, mode: 'insensitive' } },
              { mime_type: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [arquivos, total] = await this.prisma.$transaction([
      this.prisma.arquivo.findMany({
        skip,
        take: limitNumber,
        where,
        include: {
          filial: { select: { id: true, nome: true } },
          pessoa: { select: { id: true, nome: true } },
          atendimento: { select: { id: true, dataAtendimento: true } },
          prontuario: { select: { id: true, resumo_clinico: true } },
          enviado_por: { select: { id: true, email: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.arquivo.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Arquivos listados com sucesso.',
      data: {
        arquivos: arquivos.map((arquivo) => ({
          ...this.mapResumo(arquivo),
          filial: arquivo.filial,
          pessoa: arquivo.pessoa,
          atendimento: arquivo.atendimento,
          prontuario: arquivo.prontuario,
          enviadoPor: arquivo.enviado_por,
        })),
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total: total,
          totalPages: Math.ceil(total / limitNumber),
        },
      },
    };
  }

  async findById(id: string): Promise<ResponseJson> {
    const arquivo = await this.prisma.arquivo.findUnique({
      where: { id },
      include: {
        filial: { select: { id: true, nome: true } },
        pessoa: { select: { id: true, nome: true } },
        atendimento: { select: { id: true, dataAtendimento: true } },
        prontuario: { select: { id: true, resumo_clinico: true } },
        enviado_por: { select: { id: true, email: true, username: true } },
      },
    });

    if (!arquivo) {
      return { status: 422, message: 'Arquivo nao encontrado.' };
    }

    return {
      status: 200,
      message: 'Arquivo encontrado.',
      data: {
        ...this.mapResumo(arquivo),
        filial: arquivo.filial,
        pessoa: arquivo.pessoa,
        atendimento: arquivo.atendimento,
        prontuario: arquivo.prontuario,
        enviadoPor: arquivo.enviado_por,
      },
    };
  }

  async update(id: string, dto: UpdateArquivoDto): Promise<ResponseJson> {
    const arquivo = await this.prisma.arquivo.findUnique({
      where: { id },
      select: {
        id: true,
        empresaId: true,
        filialId: true,
        pessoaId: true,
        atendimentoId: true,
        prontuarioId: true,
        enviadoPorId: true,
      },
    });

    if (!arquivo) {
      return { status: 422, message: 'Arquivo nao encontrado.' };
    }

    const validacao = await this.validarRelacionamentos(arquivo.empresaId, {
      filialId: dto.filialId ?? arquivo.filialId ?? undefined,
      pessoaId: dto.pessoaId ?? arquivo.pessoaId ?? undefined,
      atendimentoId: dto.atendimentoId ?? arquivo.atendimentoId ?? undefined,
      prontuarioId: dto.prontuarioId ?? arquivo.prontuarioId ?? undefined,
      enviadoPorId: dto.enviadoPorId ?? arquivo.enviadoPorId ?? undefined,
    });

    if (!validacao.valido) {
      return { status: 422, message: validacao.mensagem };
    }

    const arquivoAtualizado = await this.prisma.arquivo.update({
      where: { id },
      data: {
        filialId: dto.filialId,
        pessoaId: dto.pessoaId,
        atendimentoId: dto.atendimentoId,
        prontuarioId: dto.prontuarioId,
        enviadoPorId: dto.enviadoPorId,
        nome: dto.nome,
        path: dto.path,
        mime_type: dto.mime_type,
        tamanho: dto.tamanho,
      },
    });

    return {
      status: 200,
      message: 'Arquivo atualizado com sucesso.',
      data: arquivoAtualizado,
    };
  }

  async deleteById(id: string): Promise<ResponseJson> {
    const arquivo = await this.prisma.arquivo.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!arquivo) {
      return { status: 422, message: 'Arquivo nao encontrado.' };
    }

    await this.prisma.arquivo.delete({ where: { id } });

    return {
      status: 200,
      message: 'Arquivo removido com sucesso.',
    };
  }

  private async validarRelacionamentos(
    empresaId: string,
    relacionamentos: {
      filialId?: string;
      pessoaId?: string;
      atendimentoId?: string;
      prontuarioId?: string;
      enviadoPorId?: string;
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

    if (relacionamentos.pessoaId) {
      const pessoa = await this.prisma.pessoa.findUnique({
        where: { id: relacionamentos.pessoaId },
        select: {
          id: true,
          filial: {
            select: {
              empresaId: true,
            },
          },
        },
      });

      if (!pessoa || pessoa.filial.empresaId !== empresaId) {
        return {
          valido: false,
          mensagem: 'Pessoa nao encontrada para a empresa informada.',
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

    if (relacionamentos.prontuarioId) {
      const prontuario = await this.prisma.prontuario.findUnique({
        where: { id: relacionamentos.prontuarioId },
        select: { id: true, empresaId: true },
      });

      if (!prontuario || prontuario.empresaId !== empresaId) {
        return {
          valido: false,
          mensagem: 'Prontuario nao encontrado para a empresa informada.',
        };
      }
    }

    if (relacionamentos.enviadoPorId) {
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: relacionamentos.enviadoPorId },
        select: { id: true, empresaId: true },
      });

      if (!usuario || usuario.empresaId !== empresaId) {
        return {
          valido: false,
          mensagem: 'Usuario nao encontrado para a empresa informada.',
        };
      }
    }

    return { valido: true, mensagem: '' };
  }

  private mapResumo(arquivo: ArquivoResumo): ArquivoResumo {
    return {
      id: arquivo.id,
      empresaId: arquivo.empresaId,
      filialId: arquivo.filialId,
      pessoaId: arquivo.pessoaId,
      atendimentoId: arquivo.atendimentoId,
      prontuarioId: arquivo.prontuarioId,
      enviadoPorId: arquivo.enviadoPorId,
      nome: arquivo.nome,
      path: arquivo.path,
      mime_type: arquivo.mime_type,
      tamanho: arquivo.tamanho,
      createdAt: arquivo.createdAt,
      updatedAt: arquivo.updatedAt,
    };
  }
}
