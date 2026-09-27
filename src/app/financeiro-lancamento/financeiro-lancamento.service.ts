import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FinanceiroLancamento, Prisma, StatusFinanceiro } from '@prisma/client';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  BaixarLancamentoDto,
  CreateFinanceiroLancamentoDto,
  UpdateFinanceiroLancamentoDto,
} from './dto/financeiro-lancamento.dto';
import {
  FiltroLancamento,
  TotaisLancamento,
} from './interfaces/financeiro-lancamento.interface';

const LANCAMENTO_INCLUDE = {
  filial: { select: { id: true, nome: true } },
  criado_por: { select: { id: true, username: true } },
  compra: {
    select: {
      id: true,
      fornecedor: { select: { razao_social: true, nome_fantasia: true } },
    },
  },
  venda: {
    select: {
      id: true,
      cliente: { select: { pessoa: { select: { nome: true } } } },
    },
  },
} satisfies Prisma.FinanceiroLancamentoInclude;

const inicioDeHoje = () => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return hoje;
};

@Injectable()
export class FinanceiroLancamentoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateFinanceiroLancamentoDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const { empresaId, filialId } = await this.resolverDestino(
      escopo.filialId ?? dto.filialId,
      escopo,
    );

    if (dto.pago && !dto.forma_pagamento) {
      throw new UnprocessableEntityException(
        'Informe a forma de pagamento para lançar como pago.',
      );
    }

    const lancamento = await this.prisma.financeiroLancamento.create({
      data: {
        empresaId,
        filialId,
        criadoPorId: escopo.usuarioId,
        tipo: dto.tipo,
        categoria: dto.categoria,
        descricao: dto.descricao,
        valor: this.arredondar(dto.valor),
        vencimento: dto.vencimento ? new Date(dto.vencimento) : null,
        status: dto.pago ? StatusFinanceiro.pago : StatusFinanceiro.pendente,
        pagoEm: dto.pago ? new Date() : null,
        forma_pagamento: dto.pago ? dto.forma_pagamento : null,
      },
      include: LANCAMENTO_INCLUDE,
    });

    return {
      status: 201,
      message: 'Lançamento criado com sucesso.',
      data: lancamento,
    };
  }

  async findAll(
    escopo: EscopoUsuario,
    filtro: FiltroLancamento,
  ): Promise<ResponseJson> {
    const page = Math.max(1, filtro.page);
    const limit = Math.max(1, filtro.limit);
    const base = this.filtroBase(escopo, filtro);

    const where: Prisma.FinanceiroLancamentoWhereInput = {
      ...base,
      ...(filtro.vencidos
        ? {
            status: StatusFinanceiro.pendente,
            vencimento: { lt: inicioDeHoje() },
          }
        : filtro.status && { status: filtro.status }),
    };

    const [lancamentos, total, totais] = await Promise.all([
      this.prisma.financeiroLancamento.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where,
        include: LANCAMENTO_INCLUDE,
        orderBy: [{ vencimento: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.financeiroLancamento.count({ where }),
      this.calcularTotais(base),
    ]);

    return {
      status: 200,
      message: 'Lançamentos listados com sucesso.',
      data: {
        lancamentos,
        totais,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async findById(id: string, escopo: EscopoUsuario): Promise<ResponseJson> {
    const lancamento = await this.prisma.financeiroLancamento.findFirst({
      where: { id, ...this.filtroEmpresa(escopo) },
      include: LANCAMENTO_INCLUDE,
    });

    if (!lancamento) {
      throw new NotFoundException('Lançamento não encontrado.');
    }

    return { status: 200, message: 'Lançamento encontrado.', data: lancamento };
  }

  async update(
    id: string,
    dto: UpdateFinanceiroLancamentoDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const lancamento = await this.buscarNoEscopo(id, escopo);
    this.exigirAvulsoPendente(lancamento, 'editado');

    const atualizado = await this.prisma.financeiroLancamento.update({
      where: { id },
      data: {
        categoria: dto.categoria,
        descricao: dto.descricao,
        valor: dto.valor === undefined ? undefined : this.arredondar(dto.valor),
        vencimento:
          dto.vencimento === undefined
            ? undefined
            : dto.vencimento
              ? new Date(dto.vencimento)
              : null,
      },
      include: LANCAMENTO_INCLUDE,
    });

    return {
      status: 200,
      message: 'Lançamento atualizado com sucesso.',
      data: atualizado,
    };
  }

  async baixar(
    id: string,
    dto: BaixarLancamentoDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const lancamento = await this.buscarNoEscopo(id, escopo);

    await this.mudarStatus(id, lancamento.status, StatusFinanceiro.pendente, {
      status: StatusFinanceiro.pago,
      pagoEm: dto.pagoEm ? new Date(dto.pagoEm) : new Date(),
      forma_pagamento: dto.forma_pagamento,
    });

    const resposta = await this.findById(id, escopo);
    return {
      ...resposta,
      message:
        lancamento.tipo === 'receita'
          ? 'Recebimento registrado.'
          : 'Pagamento registrado.',
    };
  }

  async estornar(id: string, escopo: EscopoUsuario): Promise<ResponseJson> {
    const lancamento = await this.buscarNoEscopo(id, escopo);

    await this.mudarStatus(id, lancamento.status, StatusFinanceiro.pago, {
      status: StatusFinanceiro.pendente,
      pagoEm: null,
      forma_pagamento: null,
    });

    const resposta = await this.findById(id, escopo);
    return {
      ...resposta,
      message: 'Baixa estornada; lançamento voltou a pendente.',
    };
  }

  async cancelar(id: string, escopo: EscopoUsuario): Promise<ResponseJson> {
    const lancamento = await this.buscarNoEscopo(id, escopo);
    this.exigirAvulsoPendente(lancamento, 'cancelado');

    await this.mudarStatus(id, lancamento.status, StatusFinanceiro.pendente, {
      status: StatusFinanceiro.cancelado,
    });

    const resposta = await this.findById(id, escopo);
    return { ...resposta, message: 'Lançamento cancelado.' };
  }

  async deleteById(id: string, escopo: EscopoUsuario): Promise<ResponseJson> {
    const lancamento = await this.buscarNoEscopo(id, escopo);

    if (this.temOrigem(lancamento)) {
      throw new ConflictException(
        'Lançamentos de compras e vendas não podem ser excluídos.',
      );
    }

    if (lancamento.status === StatusFinanceiro.pago) {
      throw new ConflictException(
        'Estorne a baixa antes de excluir o lançamento.',
      );
    }

    await this.prisma.financeiroLancamento.delete({ where: { id } });

    return { status: 200, message: 'Lançamento excluído com sucesso.' };
  }

  private filtroEmpresa(escopo: EscopoUsuario): { empresaId?: string } {
    return escopo.empresaId ? { empresaId: escopo.empresaId } : {};
  }

  private filtroBase(
    escopo: EscopoUsuario,
    filtro: FiltroLancamento,
  ): Prisma.FinanceiroLancamentoWhereInput {
    const search = filtro.search.trim();

    return {
      ...this.filtroEmpresa(escopo),
      ...(escopo.filialId && { filialId: escopo.filialId }),
      ...(filtro.tipo && { tipo: filtro.tipo }),
      ...(filtro.categoria && {
        categoria: { equals: filtro.categoria, mode: 'insensitive' },
      }),
      ...((filtro.dataInicio || filtro.dataFim) && {
        vencimento: {
          ...(filtro.dataInicio && { gte: new Date(filtro.dataInicio) }),
          ...(filtro.dataFim && { lte: new Date(filtro.dataFim) }),
        },
      }),
      ...(search && {
        OR: [
          { descricao: { contains: search, mode: 'insensitive' } },
          { categoria: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
  }

  private async calcularTotais(
    base: Prisma.FinanceiroLancamentoWhereInput,
  ): Promise<TotaisLancamento> {
    const soma = (where: Prisma.FinanceiroLancamentoWhereInput) =>
      this.prisma.financeiroLancamento
        .aggregate({ where: { AND: [base, where] }, _sum: { valor: true } })
        .then((r) => this.arredondar(r._sum.valor ?? 0));

    const [pendente, vencido, pago] = await Promise.all([
      soma({ status: StatusFinanceiro.pendente }),
      soma({
        status: StatusFinanceiro.pendente,
        vencimento: { lt: inicioDeHoje() },
      }),
      soma({ status: StatusFinanceiro.pago }),
    ]);

    return { pendente, vencido, pago };
  }

  private async buscarNoEscopo(id: string, escopo: EscopoUsuario) {
    const lancamento = await this.prisma.financeiroLancamento.findFirst({
      where: { id, ...this.filtroEmpresa(escopo) },
    });

    if (!lancamento) {
      throw new NotFoundException('Lançamento não encontrado.');
    }

    return lancamento;
  }

  private async resolverDestino(
    filialId: string | undefined,
    escopo: EscopoUsuario,
  ): Promise<{ empresaId: string; filialId: string | null }> {
    if (filialId) {
      const filial = await this.prisma.filial.findFirst({
        where: { id: filialId, ...this.filtroEmpresa(escopo) },
        select: { id: true, empresaId: true },
      });

      if (!filial) {
        throw new UnprocessableEntityException('Filial não encontrada.');
      }

      return { empresaId: filial.empresaId, filialId: filial.id };
    }

    if (!escopo.empresaId) {
      throw new UnprocessableEntityException('Informe a filial do lançamento.');
    }

    return { empresaId: escopo.empresaId, filialId: null };
  }

  private temOrigem(lancamento: FinanceiroLancamento): boolean {
    return Boolean(lancamento.compraId || lancamento.vendaId);
  }

  private exigirAvulsoPendente(lancamento: FinanceiroLancamento, acao: string) {
    if (this.temOrigem(lancamento)) {
      throw new ConflictException(
        `Lançamentos de compras e vendas não podem ser ${acao}s aqui; altere a compra ou a venda de origem.`,
      );
    }

    if (lancamento.status !== StatusFinanceiro.pendente) {
      throw new ConflictException(
        `Só lançamentos pendentes podem ser ${acao}s. Status atual: ${lancamento.status}.`,
      );
    }
  }

  /** Muda o status apenas se ainda estiver no esperado (evita dupla baixa). */
  private async mudarStatus(
    id: string,
    atual: StatusFinanceiro,
    esperado: StatusFinanceiro,
    data: Prisma.FinanceiroLancamentoUpdateManyMutationInput,
  ): Promise<void> {
    if (atual !== esperado) {
      throw new ConflictException(
        `Operação disponível apenas para lançamentos ${esperado}s. Status atual: ${atual}.`,
      );
    }

    const { count } = await this.prisma.financeiroLancamento.updateMany({
      where: { id, status: esperado },
      data,
    });

    if (count === 0) {
      throw new ConflictException(
        'O lançamento foi alterado por outra operação. Atualize a página.',
      );
    }
  }

  private arredondar(valor: number): number {
    return Math.round(valor * 100) / 100;
  }
}
