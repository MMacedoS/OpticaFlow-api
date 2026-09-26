import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  Prisma,
  StatusCompra,
  TipoFinanceiro,
  TipoMovimentoEstoque,
  TipoProduto,
} from '@prisma/client';
import { MovimentoEstoqueService } from 'src/app/movimento-estoque/movimento-estoque.service';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CompraItemDto,
  CreateCompraDto,
  ReceberCompraDto,
  UpdateCompraDto,
} from './dto/compra.dto';
import { FiltroCompra } from './interfaces/compra.interface';

/** Status do lancamento financeiro gerado pela compra. */
export const STATUS_FINANCEIRO = {
  pendente: 'pendente',
  pago: 'pago',
  cancelado: 'cancelado',
} as const;

const COMPRA_INCLUDE = {
  filial: { select: { id: true, nome: true } },
  fornecedor: {
    select: { id: true, razao_social: true, nome_fantasia: true, cnpj: true },
  },
  itens: {
    include: {
      produto: { select: { id: true, nome: true, sku: true, tipo: true } },
    },
    orderBy: { id: 'asc' },
  },
  financeiro: {
    select: {
      id: true,
      valor: true,
      vencimento: true,
      pagoEm: true,
      status: true,
    },
  },
} satisfies Prisma.CompraInclude;

@Injectable()
export class CompraService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly movimentoEstoque: MovimentoEstoqueService,
  ) {}

  async create(
    dto: CreateCompraDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const filial = await this.resolverFilial(
      escopo.filialId ?? dto.filialId,
      escopo,
    );

    if (dto.fornecedorId) {
      await this.validarFornecedor(dto.fornecedorId, filial.empresaId);
    }

    await this.validarItens(dto.itens, filial.empresaId);

    const compra = await this.prisma.compra.create({
      data: {
        empresaId: filial.empresaId,
        filialId: filial.id,
        fornecedorId: dto.fornecedorId,
        dataCompra: dto.dataCompra ? new Date(dto.dataCompra) : undefined,
        observacoes: dto.observacoes,
        valor_total: this.calcularTotal(dto.itens),
        itens: { create: dto.itens.map((item) => this.dadosItem(item)) },
      },
      include: COMPRA_INCLUDE,
    });

    return {
      status: 201,
      message: 'Compra registrada como rascunho.',
      data: compra,
    };
  }

  async findAll(
    escopo: EscopoUsuario,
    filtro: FiltroCompra,
  ): Promise<ResponseJson> {
    const page = Math.max(1, filtro.page);
    const limit = Math.max(1, filtro.limit);
    const search = filtro.search.trim();

    const where: Prisma.CompraWhereInput = {
      ...this.filtroEmpresa(escopo),
      ...(escopo.filialId && { filialId: escopo.filialId }),
      ...(filtro.status && { status: filtro.status }),
      ...(filtro.fornecedorId && { fornecedorId: filtro.fornecedorId }),
      ...((filtro.dataInicio || filtro.dataFim) && {
        dataCompra: {
          ...(filtro.dataInicio && { gte: new Date(filtro.dataInicio) }),
          ...(filtro.dataFim && { lte: new Date(filtro.dataFim) }),
        },
      }),
      ...(search && {
        OR: [
          { observacoes: { contains: search, mode: 'insensitive' } },
          {
            fornecedor: {
              is: {
                OR: [
                  { razao_social: { contains: search, mode: 'insensitive' } },
                  { nome_fantasia: { contains: search, mode: 'insensitive' } },
                ],
              },
            },
          },
        ],
      }),
    };

    const [compras, total] = await this.prisma.$transaction([
      this.prisma.compra.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where,
        include: COMPRA_INCLUDE,
        orderBy: { dataCompra: 'desc' },
      }),
      this.prisma.compra.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Compras listadas com sucesso.',
      data: {
        compras,
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
    const compra = await this.prisma.compra.findFirst({
      where: { id, ...this.filtroEmpresa(escopo) },
      include: COMPRA_INCLUDE,
    });

    if (!compra) {
      throw new NotFoundException('Compra não encontrada.');
    }

    return { status: 200, message: 'Compra encontrada.', data: compra };
  }

  async update(
    id: string,
    dto: UpdateCompraDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const compra = await this.buscarNoEscopo(id, escopo);
    this.exigirStatus(compra.status, StatusCompra.rascunho, 'editadas');

    if (dto.fornecedorId) {
      await this.validarFornecedor(dto.fornecedorId, compra.empresaId);
    }

    if (dto.itens) {
      await this.validarItens(dto.itens, compra.empresaId);
    }

    const atualizada = await this.prisma.$transaction(async (tx) => {
      if (dto.itens) {
        await tx.compraItem.deleteMany({ where: { compraId: id } });
        await tx.compraItem.createMany({
          data: dto.itens.map((item) => ({
            ...this.dadosItem(item),
            compraId: id,
          })),
        });
      }

      return tx.compra.update({
        where: { id },
        data: {
          fornecedorId: dto.fornecedorId,
          dataCompra: dto.dataCompra ? new Date(dto.dataCompra) : undefined,
          observacoes: dto.observacoes,
          ...(dto.itens && { valor_total: this.calcularTotal(dto.itens) }),
        },
        include: COMPRA_INCLUDE,
      });
    });

    return {
      status: 200,
      message: 'Compra atualizada com sucesso.',
      data: atualizada,
    };
  }

  async receber(
    id: string,
    dto: ReceberCompraDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const compra = await this.buscarNoEscopo(id, escopo);
    this.exigirStatus(compra.status, StatusCompra.rascunho, 'recebidas');

    await this.prisma.$transaction(async (tx) => {
      await this.mudarStatus(tx, id, StatusCompra.rascunho, {
        status: StatusCompra.recebida,
        recebidaEm: new Date(),
      });

      const estoque = await this.movimentoEstoque.obterOuCriarEstoque(
        tx,
        compra.empresaId,
        compra.filialId,
      );

      for (const item of compra.itens) {
        await this.movimentoEstoque.registrar(tx, {
          empresaId: compra.empresaId,
          estoqueId: estoque.id,
          produtoId: item.produtoId,
          tipo: TipoMovimentoEstoque.entrada,
          quantidade: item.quantidade,
          motivo: 'Recebimento de compra',
          referencia: `Compra ${id}`,
        });

        await tx.produto.update({
          where: { id: item.produtoId },
          data: { preco_custo: this.custoUnitario(item) },
        });
      }

      await tx.financeiroLancamento.create({
        data: {
          empresaId: compra.empresaId,
          filialId: compra.filialId,
          compraId: id,
          tipo: TipoFinanceiro.despesa,
          categoria: 'Compras',
          descricao: this.descricaoFinanceiro(compra),
          valor: compra.valor_total,
          vencimento: dto.vencimento
            ? new Date(dto.vencimento)
            : compra.dataCompra,
          status: STATUS_FINANCEIRO.pendente,
        },
      });
    });

    return this.findById(id, escopo).then((resposta) => ({
      ...resposta,
      message: 'Compra recebida: estoque e financeiro atualizados.',
    }));
  }

  async cancelar(id: string, escopo: EscopoUsuario): Promise<ResponseJson> {
    const compra = await this.buscarNoEscopo(id, escopo);

    if (compra.status === StatusCompra.cancelada) {
      throw new ConflictException('Esta compra já está cancelada.');
    }

    if (compra.status === StatusCompra.rascunho) {
      await this.prisma.$transaction((tx) =>
        this.mudarStatus(tx, id, StatusCompra.rascunho, {
          status: StatusCompra.cancelada,
        }),
      );
    } else {
      await this.estornar(compra);
    }

    return this.findById(id, escopo).then((resposta) => ({
      ...resposta,
      message:
        compra.status === StatusCompra.recebida
          ? 'Compra cancelada: estoque estornado e despesa cancelada.'
          : 'Compra cancelada.',
    }));
  }

  async deleteById(id: string, escopo: EscopoUsuario): Promise<ResponseJson> {
    const compra = await this.buscarNoEscopo(id, escopo);
    this.exigirStatus(compra.status, StatusCompra.rascunho, 'excluídas');

    await this.prisma.compra.delete({ where: { id } });

    return { status: 200, message: 'Compra excluída com sucesso.' };
  }

  private async estornar(
    compra: Awaited<ReturnType<CompraService['buscarNoEscopo']>>,
  ): Promise<void> {
    const pagos = await this.prisma.financeiroLancamento.count({
      where: { compraId: compra.id, status: STATUS_FINANCEIRO.pago },
    });

    if (pagos > 0) {
      throw new ConflictException(
        'A despesa desta compra já foi paga; estorne o pagamento antes de cancelar.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await this.mudarStatus(tx, compra.id, StatusCompra.recebida, {
        status: StatusCompra.cancelada,
      });

      const estoque = await this.movimentoEstoque.obterOuCriarEstoque(
        tx,
        compra.empresaId,
        compra.filialId,
      );

      for (const item of compra.itens) {
        await this.movimentoEstoque.registrar(tx, {
          empresaId: compra.empresaId,
          estoqueId: estoque.id,
          produtoId: item.produtoId,
          tipo: TipoMovimentoEstoque.saida,
          quantidade: item.quantidade,
          motivo: 'Estorno de compra cancelada',
          referencia: `Compra ${compra.id}`,
        });
      }

      await tx.financeiroLancamento.updateMany({
        where: {
          compraId: compra.id,
          status: { not: STATUS_FINANCEIRO.cancelado },
        },
        data: { status: STATUS_FINANCEIRO.cancelado },
      });
    });
  }

  /** Muda o status apenas se ainda estiver no esperado (evita dupla execucao). */
  private async mudarStatus(
    tx: Prisma.TransactionClient,
    id: string,
    statusAtual: StatusCompra,
    data: Prisma.CompraUpdateManyMutationInput,
  ): Promise<void> {
    const { count } = await tx.compra.updateMany({
      where: { id, status: statusAtual },
      data,
    });

    if (count === 0) {
      throw new ConflictException(
        'A compra foi alterada por outra operação. Atualize a página.',
      );
    }
  }

  private exigirStatus(
    atual: StatusCompra,
    esperado: StatusCompra,
    acao: string,
  ): void {
    if (atual !== esperado) {
      throw new ConflictException(
        `Só compras em ${esperado} podem ser ${acao}. Status atual: ${atual}.`,
      );
    }
  }

  private filtroEmpresa(escopo: EscopoUsuario): { empresaId?: string } {
    return escopo.empresaId ? { empresaId: escopo.empresaId } : {};
  }

  private async buscarNoEscopo(id: string, escopo: EscopoUsuario) {
    const compra = await this.prisma.compra.findFirst({
      where: { id, ...this.filtroEmpresa(escopo) },
      include: {
        itens: true,
        fornecedor: { select: { razao_social: true, nome_fantasia: true } },
      },
    });

    if (!compra) {
      throw new NotFoundException('Compra não encontrada.');
    }

    return compra;
  }

  private async resolverFilial(
    filialId: string | undefined,
    escopo: EscopoUsuario,
  ): Promise<{ id: string; empresaId: string }> {
    if (!filialId) {
      throw new BadRequestException('Informe a filial da compra.');
    }

    const filial = await this.prisma.filial.findFirst({
      where: { id: filialId, ...this.filtroEmpresa(escopo) },
      select: { id: true, empresaId: true },
    });

    if (!filial) {
      throw new UnprocessableEntityException('Filial não encontrada.');
    }

    return filial;
  }

  private async validarFornecedor(
    fornecedorId: string,
    empresaId: string,
  ): Promise<void> {
    const fornecedor = await this.prisma.fornecedor.findFirst({
      where: { id: fornecedorId, empresaId },
      select: { ativo: true },
    });

    if (!fornecedor) {
      throw new NotFoundException('Fornecedor não encontrado.');
    }

    if (!fornecedor.ativo) {
      throw new UnprocessableEntityException('Fornecedor inativo.');
    }
  }

  private async validarItens(
    itens: CompraItemDto[],
    empresaId: string,
  ): Promise<void> {
    const ids = [...new Set(itens.map((item) => item.produtoId))];

    if (ids.length !== itens.length) {
      throw new BadRequestException(
        'O mesmo produto aparece mais de uma vez; some as quantidades.',
      );
    }

    const produtos = await this.prisma.produto.findMany({
      where: { id: { in: ids }, empresaId },
      select: { id: true, nome: true, tipo: true },
    });

    if (produtos.length !== ids.length) {
      throw new NotFoundException('Um ou mais produtos não foram encontrados.');
    }

    const servico = produtos.find((p) => p.tipo === TipoProduto.servico);
    if (servico) {
      throw new UnprocessableEntityException(
        `"${servico.nome}" é um serviço e não entra em compras de estoque.`,
      );
    }

    for (const item of itens) {
      if ((item.desconto ?? 0) > item.quantidade * item.valor_unitario) {
        throw new UnprocessableEntityException(
          'O desconto de um item não pode ser maior que o valor do item.',
        );
      }
    }
  }

  private dadosItem(item: CompraItemDto) {
    return {
      produtoId: item.produtoId,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
      desconto: item.desconto ?? 0,
    };
  }

  private calcularTotal(itens: CompraItemDto[]): number {
    const total = itens.reduce(
      (soma, item) =>
        soma + item.quantidade * item.valor_unitario - (item.desconto ?? 0),
      0,
    );
    return Math.round(total * 100) / 100;
  }

  private custoUnitario(item: {
    quantidade: number;
    valor_unitario: number;
    desconto: number | null;
  }): number {
    const total = item.quantidade * item.valor_unitario - (item.desconto ?? 0);
    return Math.round((total / item.quantidade) * 100) / 100;
  }

  private descricaoFinanceiro(compra: {
    fornecedor: { razao_social: string; nome_fantasia: string | null } | null;
  }): string {
    const fornecedor =
      compra.fornecedor?.nome_fantasia ?? compra.fornecedor?.razao_social;
    return fornecedor ? `Compra - ${fornecedor}` : 'Compra';
  }
}
