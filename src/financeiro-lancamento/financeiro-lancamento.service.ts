import { Injectable } from '@nestjs/common';
import { Prisma, TipoFinanceiro } from '@prisma/client';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateFinanceiroLancamentoDto,
  UpdateFinanceiroLancamentoDto,
} from './dto/financeiro-lancamento.dto';
import { FinanceiroLancamentoResumo } from './interfaces/financeiro-lancamento.interface';

@Injectable()
export class FinanceiroLancamentoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFinanceiroLancamentoDto): Promise<ResponseJson> {
    const validacao = await this.validarRelacionamentos(dto.empresaId, {
      filialId: dto.filialId,
      atendimentoId: dto.atendimentoId,
      vendaId: dto.vendaId,
      compraId: dto.compraId,
      ordemServicoId: dto.ordemServicoId,
      criadoPorId: dto.criadoPorId,
    });

    if (!validacao.valido) {
      return { status: 422, message: validacao.mensagem };
    }

    try {
      const lancamento = await this.prisma.financeiroLancamento.create({
        data: {
          empresaId: dto.empresaId,
          filialId: dto.filialId,
          atendimentoId: dto.atendimentoId,
          vendaId: dto.vendaId,
          compraId: dto.compraId,
          ordemServicoId: dto.ordemServicoId,
          criadoPorId: dto.criadoPorId,
          tipo: dto.tipo,
          categoria: dto.categoria,
          descricao: dto.descricao,
          valor: dto.valor,
          vencimento: dto.vencimento ? new Date(dto.vencimento) : undefined,
          pagoEm: dto.pagoEm ? new Date(dto.pagoEm) : undefined,
          status: dto.status,
        },
      });

      return this.findById(lancamento.id);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        return {
          status: 422,
          message: 'Relacionamento invalido ao criar lancamento financeiro.',
        };
      }

      throw error;
    }
  }

  async findAllByEmpresa(
    empresaId: string,
    page: number = 1,
    limit: number = 10,
    search: string = '',
    filialId?: string,
    tipo?: string,
    status?: string,
    categoria?: string,
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

    const tipoFinanceiro = this.parseTipoFinanceiro(tipo);
    if (tipo && !tipoFinanceiro) {
      return { status: 422, message: 'Tipo financeiro invalido.' };
    }

    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, limit);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.FinanceiroLancamentoWhereInput = {
      empresaId,
      ...(filialId && { filialId }),
      ...(tipoFinanceiro && { tipo: tipoFinanceiro }),
      ...(status && { status }),
      ...(categoria && { categoria }),
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
              { categoria: { contains: search, mode: 'insensitive' } },
              { descricao: { contains: search, mode: 'insensitive' } },
              { status: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [lancamentos, total] = await this.prisma.$transaction([
      this.prisma.financeiroLancamento.findMany({
        skip,
        take: limitNumber,
        where,
        include: {
          filial: {
            select: {
              id: true,
              nome: true,
            },
          },
          atendimento: {
            select: {
              id: true,
              dataAtendimento: true,
              status: true,
            },
          },
          venda: {
            select: {
              id: true,
              dataVenda: true,
              status: true,
              valor_total: true,
            },
          },
          compra: {
            select: {
              id: true,
              dataCompra: true,
              status: true,
              valor_total: true,
            },
          },
          ordem_servico: {
            select: {
              id: true,
              numero: true,
              status: true,
              valor_total: true,
            },
          },
          criado_por: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.financeiroLancamento.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Lancamentos financeiros listados com sucesso.',
      data: lancamentos.map((lancamento) => this.mapResumo(lancamento)),
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async findById(id: string): Promise<ResponseJson> {
    const lancamento = await this.prisma.financeiroLancamento.findUnique({
      where: { id },
      include: {
        filial: {
          select: {
            id: true,
            nome: true,
          },
        },
        atendimento: {
          select: {
            id: true,
            dataAtendimento: true,
            status: true,
          },
        },
        venda: {
          select: {
            id: true,
            dataVenda: true,
            status: true,
            valor_total: true,
          },
        },
        compra: {
          select: {
            id: true,
            dataCompra: true,
            status: true,
            valor_total: true,
          },
        },
        ordem_servico: {
          select: {
            id: true,
            numero: true,
            status: true,
            valor_total: true,
          },
        },
        criado_por: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
    });

    if (!lancamento) {
      return { status: 422, message: 'Lancamento financeiro nao encontrado.' };
    }

    return {
      status: 200,
      message: 'Lancamento financeiro encontrado.',
      data: {
        ...this.mapResumo(lancamento),
        filial: lancamento.filial,
        atendimento: lancamento.atendimento,
        venda: lancamento.venda,
        compra: lancamento.compra,
        ordemServico: lancamento.ordem_servico,
        criadoPor: lancamento.criado_por,
      },
    };
  }

  async update(
    id: string,
    dto: UpdateFinanceiroLancamentoDto,
  ): Promise<ResponseJson> {
    const lancamento = await this.prisma.financeiroLancamento.findUnique({
      where: { id },
      select: {
        id: true,
        empresaId: true,
        filialId: true,
      },
    });

    if (!lancamento) {
      return { status: 422, message: 'Lancamento financeiro nao encontrado.' };
    }

    const validacao = await this.validarRelacionamentos(lancamento.empresaId, {
      filialId: dto.filialId ?? lancamento.filialId ?? undefined,
      atendimentoId: dto.atendimentoId,
      vendaId: dto.vendaId,
      compraId: dto.compraId,
      ordemServicoId: dto.ordemServicoId,
      criadoPorId: dto.criadoPorId,
    });

    if (!validacao.valido) {
      return { status: 422, message: validacao.mensagem };
    }

    await this.prisma.financeiroLancamento.update({
      where: { id },
      data: {
        filialId: dto.filialId,
        atendimentoId: dto.atendimentoId,
        vendaId: dto.vendaId,
        compraId: dto.compraId,
        ordemServicoId: dto.ordemServicoId,
        criadoPorId: dto.criadoPorId,
        tipo: dto.tipo,
        categoria: dto.categoria,
        descricao: dto.descricao,
        valor: dto.valor,
        vencimento: dto.vencimento ? new Date(dto.vencimento) : undefined,
        pagoEm: dto.pagoEm ? new Date(dto.pagoEm) : undefined,
        status: dto.status,
      },
    });

    return this.findById(id);
  }

  async deleteById(id: string): Promise<ResponseJson> {
    const lancamento = await this.prisma.financeiroLancamento.findUnique({
      where: { id },
      select: {
        id: true,
      },
    });

    if (!lancamento) {
      return { status: 422, message: 'Lancamento financeiro nao encontrado.' };
    }

    await this.prisma.financeiroLancamento.delete({
      where: { id },
    });

    return {
      status: 200,
      message: 'Lancamento financeiro deletado com sucesso.',
    };
  }

  private mapResumo(
    lancamento: FinanceiroLancamentoResumo,
  ): FinanceiroLancamentoResumo {
    return {
      id: lancamento.id,
      empresaId: lancamento.empresaId,
      filialId: lancamento.filialId,
      atendimentoId: lancamento.atendimentoId,
      vendaId: lancamento.vendaId,
      compraId: lancamento.compraId,
      ordemServicoId: lancamento.ordemServicoId,
      criadoPorId: lancamento.criadoPorId,
      tipo: lancamento.tipo,
      categoria: lancamento.categoria,
      descricao: lancamento.descricao,
      valor: lancamento.valor,
      vencimento: lancamento.vencimento,
      pagoEm: lancamento.pagoEm,
      status: lancamento.status,
      createdAt: lancamento.createdAt,
      updatedAt: lancamento.updatedAt,
    };
  }

  private parseTipoFinanceiro(tipo?: string): TipoFinanceiro | undefined {
    if (!tipo) {
      return undefined;
    }

    const tipoNormalizado = tipo.toLowerCase().trim();

    if (tipoNormalizado === TipoFinanceiro.receita) {
      return TipoFinanceiro.receita;
    }

    if (tipoNormalizado === TipoFinanceiro.despesa) {
      return TipoFinanceiro.despesa;
    }

    return undefined;
  }

  private async validarRelacionamentos(
    empresaId: string,
    dados: {
      filialId?: string;
      atendimentoId?: string;
      vendaId?: string;
      compraId?: string;
      ordemServicoId?: string;
      criadoPorId?: string;
    },
  ): Promise<{ valido: boolean; mensagem: string }> {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { id: true },
    });

    if (!empresa) {
      return { valido: false, mensagem: 'Empresa nao encontrada.' };
    }

    if (dados.filialId) {
      const filial = await this.prisma.filial.findUnique({
        where: { id: dados.filialId },
        select: { id: true, empresaId: true },
      });

      if (!filial || filial.empresaId !== empresaId) {
        return {
          valido: false,
          mensagem: 'Filial nao encontrada para a empresa informada.',
        };
      }
    }

    if (dados.atendimentoId) {
      const atendimento = await this.prisma.atendimento.findUnique({
        where: { id: dados.atendimentoId },
        select: { id: true, empresaId: true, filialId: true },
      });

      if (!atendimento || atendimento.empresaId !== empresaId) {
        return {
          valido: false,
          mensagem: 'Atendimento nao encontrado para a empresa informada.',
        };
      }

      if (dados.filialId && atendimento.filialId !== dados.filialId) {
        return {
          valido: false,
          mensagem: 'Atendimento nao pertence a filial informada.',
        };
      }
    }

    if (dados.vendaId) {
      const venda = await this.prisma.venda.findUnique({
        where: { id: dados.vendaId },
        select: { id: true, empresaId: true, filialId: true },
      });

      if (!venda || venda.empresaId !== empresaId) {
        return {
          valido: false,
          mensagem: 'Venda nao encontrada para a empresa informada.',
        };
      }

      if (dados.filialId && venda.filialId !== dados.filialId) {
        return {
          valido: false,
          mensagem: 'Venda nao pertence a filial informada.',
        };
      }
    }

    if (dados.compraId) {
      const compra = await this.prisma.compra.findUnique({
        where: { id: dados.compraId },
        select: { id: true, empresaId: true, filialId: true },
      });

      if (!compra || compra.empresaId !== empresaId) {
        return {
          valido: false,
          mensagem: 'Compra nao encontrada para a empresa informada.',
        };
      }

      if (dados.filialId && compra.filialId !== dados.filialId) {
        return {
          valido: false,
          mensagem: 'Compra nao pertence a filial informada.',
        };
      }
    }

    if (dados.ordemServicoId) {
      const ordemServico = await this.prisma.ordemServico.findUnique({
        where: { id: dados.ordemServicoId },
        select: { id: true, empresaId: true, filialId: true },
      });

      if (!ordemServico || ordemServico.empresaId !== empresaId) {
        return {
          valido: false,
          mensagem: 'Ordem de servico nao encontrada para a empresa informada.',
        };
      }

      if (dados.filialId && ordemServico.filialId !== dados.filialId) {
        return {
          valido: false,
          mensagem: 'Ordem de servico nao pertence a filial informada.',
        };
      }
    }

    if (dados.criadoPorId) {
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: dados.criadoPorId },
        select: { id: true, empresaId: true },
      });

      if (!usuario) {
        return {
          valido: false,
          mensagem: 'Usuario criador nao encontrado.',
        };
      }

      if (usuario.empresaId && usuario.empresaId !== empresaId) {
        return {
          valido: false,
          mensagem: 'Usuario criador nao pertence a empresa informada.',
        };
      }
    }

    return { valido: true, mensagem: '' };
  }
}
