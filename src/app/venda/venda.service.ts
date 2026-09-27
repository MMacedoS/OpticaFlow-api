import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  Prisma,
  StatusOrdemServico,
  StatusVenda,
  TipoFinanceiro,
  TipoMovimentoEstoque,
  TipoProduto,
} from '@prisma/client';
import { MovimentoEstoqueService } from 'src/app/movimento-estoque/movimento-estoque.service';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { STATUS_FINANCEIRO } from 'src/common/financeiro/status-financeiro';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateVendaDto,
  FinalizarVendaDto,
  UpdateVendaDto,
  VendaItemDto,
} from './dto/venda.dto';
import { FiltroVenda } from './interfaces/venda.interface';

const VENDA_INCLUDE = {
  filial: { select: { id: true, nome: true } },
  cliente: {
    select: {
      id: true,
      pessoa: { select: { id: true, nome: true, cpf: true } },
    },
  },
  ordem_servico: { select: { id: true, numero: true, status: true } },
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
} satisfies Prisma.VendaInclude;

type ItemVenda = {
  produtoId: string | null;
  descricao_servico: string | null;
  quantidade: number;
  valor_unitario: number;
  desconto: number | null;
};

@Injectable()
export class VendaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly movimentoEstoque: MovimentoEstoqueService,
  ) {}

  async create(
    dto: CreateVendaDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const filial = await this.resolverFilial(
      escopo.filialId ?? dto.filialId,
      escopo,
    );

    if (dto.clienteId) {
      await this.validarCliente(dto.clienteId, filial.empresaId);
    }

    await this.validarItens(dto.itens, filial.empresaId);

    const venda = await this.prisma.venda.create({
      data: {
        empresaId: filial.empresaId,
        filialId: filial.id,
        clienteId: dto.clienteId,
        dataVenda: dto.dataVenda ? new Date(dto.dataVenda) : undefined,
        observacoes: dto.observacoes,
        valor_total: this.calcularTotal(dto.itens),
        itens: { create: dto.itens.map((item) => this.dadosItem(item)) },
      },
      include: VENDA_INCLUDE,
    });

    return { status: 201, message: 'Venda aberta com sucesso.', data: venda };
  }

  async createFromOrdemServico(
    ordemServicoId: string,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const ordem = await this.prisma.ordemServico.findFirst({
      where: { id: ordemServicoId, ...this.filtroEmpresa(escopo) },
      include: {
        itens: true,
        vendas: {
          where: { status: { not: StatusVenda.cancelada } },
          select: { id: true },
        },
      },
    });

    if (!ordem) {
      throw new NotFoundException('Ordem de serviço não encontrada.');
    }

    if (ordem.status === StatusOrdemServico.cancelada) {
      throw new UnprocessableEntityException(
        'Não é possível vender uma ordem de serviço cancelada.',
      );
    }

    if (ordem.vendas.length > 0) {
      throw new ConflictException('Esta ordem de serviço já possui venda.');
    }

    if (ordem.itens.length === 0) {
      throw new UnprocessableEntityException(
        'A ordem de serviço não tem itens para vender.',
      );
    }

    const itens: ItemVenda[] = ordem.itens.map((item) => ({
      produtoId: item.produtoId,
      descricao_servico: item.descricao_servico,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
      desconto: item.desconto,
    }));

    const venda = await this.prisma.venda.create({
      data: {
        empresaId: ordem.empresaId,
        filialId: ordem.filialId,
        clienteId: ordem.clienteId,
        atendimentoId: ordem.atendimentoId,
        ordemServicoId: ordem.id,
        observacoes: ordem.numero ? `OS ${ordem.numero}` : undefined,
        valor_total: this.calcularTotal(itens),
        itens: { create: itens },
      },
      include: VENDA_INCLUDE,
    });

    return {
      status: 201,
      message: 'Venda aberta a partir da ordem de serviço.',
      data: venda,
    };
  }

  async findAll(
    escopo: EscopoUsuario,
    filtro: FiltroVenda,
  ): Promise<ResponseJson> {
    const page = Math.max(1, filtro.page);
    const limit = Math.max(1, filtro.limit);
    const search = filtro.search.trim();

    const where: Prisma.VendaWhereInput = {
      ...this.filtroEmpresa(escopo),
      ...(escopo.filialId && { filialId: escopo.filialId }),
      ...(filtro.status && { status: filtro.status }),
      ...(filtro.clienteId && { clienteId: filtro.clienteId }),
      ...((filtro.dataInicio || filtro.dataFim) && {
        dataVenda: {
          ...(filtro.dataInicio && { gte: new Date(filtro.dataInicio) }),
          ...(filtro.dataFim && { lte: new Date(filtro.dataFim) }),
        },
      }),
      ...(search && {
        OR: [
          { observacoes: { contains: search, mode: 'insensitive' } },
          {
            cliente: {
              is: {
                pessoa: { nome: { contains: search, mode: 'insensitive' } },
              },
            },
          },
        ],
      }),
    };

    const [vendas, total] = await this.prisma.$transaction([
      this.prisma.venda.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where,
        include: VENDA_INCLUDE,
        orderBy: { dataVenda: 'desc' },
      }),
      this.prisma.venda.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Vendas listadas com sucesso.',
      data: {
        vendas,
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
    const venda = await this.prisma.venda.findFirst({
      where: { id, ...this.filtroEmpresa(escopo) },
      include: VENDA_INCLUDE,
    });

    if (!venda) {
      throw new NotFoundException('Venda não encontrada.');
    }

    return { status: 200, message: 'Venda encontrada.', data: venda };
  }

  async update(
    id: string,
    dto: UpdateVendaDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const venda = await this.buscarNoEscopo(id, escopo);
    this.exigirStatus(venda.status, StatusVenda.aberta, 'editadas');

    if (dto.clienteId) {
      await this.validarCliente(dto.clienteId, venda.empresaId);
    }

    if (dto.itens) {
      await this.validarItens(dto.itens, venda.empresaId);
    }

    const atualizada = await this.prisma.$transaction(async (tx) => {
      if (dto.itens) {
        await tx.vendaItem.deleteMany({ where: { vendaId: id } });
        await tx.vendaItem.createMany({
          data: dto.itens.map((item) => ({
            ...this.dadosItem(item),
            vendaId: id,
          })),
        });
      }

      return tx.venda.update({
        where: { id },
        data: {
          clienteId: dto.clienteId,
          dataVenda: dto.dataVenda ? new Date(dto.dataVenda) : undefined,
          observacoes: dto.observacoes,
          ...(dto.itens && { valor_total: this.calcularTotal(dto.itens) }),
        },
        include: VENDA_INCLUDE,
      });
    });

    return {
      status: 200,
      message: 'Venda atualizada com sucesso.',
      data: atualizada,
    };
  }

  async finalizar(
    id: string,
    dto: FinalizarVendaDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const venda = await this.buscarNoEscopo(id, escopo);
    this.exigirStatus(venda.status, StatusVenda.aberta, 'finalizadas');

    await this.prisma.$transaction(async (tx) => {
      await this.mudarStatus(tx, id, StatusVenda.aberta, {
        status: StatusVenda.finalizada,
        finalizadaEm: new Date(),
      });

      await this.movimentarEstoque(
        tx,
        venda,
        TipoMovimentoEstoque.saida,
        'Venda',
      );

      const agora = new Date();
      await tx.financeiroLancamento.create({
        data: {
          empresaId: venda.empresaId,
          filialId: venda.filialId,
          vendaId: id,
          atendimentoId: venda.atendimentoId,
          ordemServicoId: venda.ordemServicoId,
          tipo: TipoFinanceiro.receita,
          categoria: 'Vendas',
          descricao: this.descricaoFinanceiro(venda),
          valor: venda.valor_total,
          vencimento: dto.pago
            ? agora
            : dto.vencimento
              ? new Date(dto.vencimento)
              : venda.dataVenda,
          pagoEm: dto.pago ? agora : null,
          status: dto.pago
            ? STATUS_FINANCEIRO.pago
            : STATUS_FINANCEIRO.pendente,
        },
      });

      if (venda.ordemServicoId) {
        await tx.ordemServico.updateMany({
          where: {
            id: venda.ordemServicoId,
            status: { not: StatusOrdemServico.cancelada },
          },
          data: { status: StatusOrdemServico.faturada },
        });
      }
    });

    const resposta = await this.findById(id, escopo);
    return {
      ...resposta,
      message: 'Venda finalizada: estoque e financeiro atualizados.',
    };
  }

  async cancelar(id: string, escopo: EscopoUsuario): Promise<ResponseJson> {
    const venda = await this.buscarNoEscopo(id, escopo);

    if (venda.status === StatusVenda.cancelada) {
      throw new ConflictException('Esta venda já está cancelada.');
    }

    if (venda.status === StatusVenda.aberta) {
      await this.prisma.$transaction((tx) =>
        this.mudarStatus(tx, id, StatusVenda.aberta, {
          status: StatusVenda.cancelada,
        }),
      );
    } else {
      await this.estornar(venda);
    }

    const resposta = await this.findById(id, escopo);
    return {
      ...resposta,
      message:
        venda.status === StatusVenda.finalizada
          ? 'Venda cancelada: estoque estornado e receita cancelada.'
          : 'Venda cancelada.',
    };
  }

  async deleteById(id: string, escopo: EscopoUsuario): Promise<ResponseJson> {
    const venda = await this.buscarNoEscopo(id, escopo);
    this.exigirStatus(venda.status, StatusVenda.aberta, 'excluídas');

    await this.prisma.venda.delete({ where: { id } });

    return { status: 200, message: 'Venda excluída com sucesso.' };
  }

  private async estornar(
    venda: Awaited<ReturnType<VendaService['buscarNoEscopo']>>,
  ): Promise<void> {
    const pagos = await this.prisma.financeiroLancamento.count({
      where: { vendaId: venda.id, status: STATUS_FINANCEIRO.pago },
    });

    if (pagos > 0) {
      throw new ConflictException(
        'A receita desta venda já foi recebida; estorne o recebimento no financeiro antes de cancelar.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await this.mudarStatus(tx, venda.id, StatusVenda.finalizada, {
        status: StatusVenda.cancelada,
      });

      await this.movimentarEstoque(
        tx,
        venda,
        TipoMovimentoEstoque.entrada,
        'Estorno de venda cancelada',
      );

      await tx.financeiroLancamento.updateMany({
        where: {
          vendaId: venda.id,
          status: { not: STATUS_FINANCEIRO.cancelado },
        },
        data: { status: STATUS_FINANCEIRO.cancelado },
      });

      if (venda.ordemServicoId) {
        await tx.ordemServico.updateMany({
          where: {
            id: venda.ordemServicoId,
            status: StatusOrdemServico.faturada,
          },
          data: { status: StatusOrdemServico.finalizada },
        });
      }
    });
  }

  /** Movimenta o estoque dos itens com produto que nao e servico. */
  private async movimentarEstoque(
    tx: Prisma.TransactionClient,
    venda: Awaited<ReturnType<VendaService['buscarNoEscopo']>>,
    tipo: TipoMovimentoEstoque,
    motivo: string,
  ): Promise<void> {
    const itensDeEstoque = venda.itens.filter(
      (item) => item.produtoId && item.produto?.tipo !== TipoProduto.servico,
    );

    if (itensDeEstoque.length === 0) return;

    const estoque = await this.movimentoEstoque.obterOuCriarEstoque(
      tx,
      venda.empresaId,
      venda.filialId,
    );

    for (const item of itensDeEstoque) {
      await this.movimentoEstoque.registrar(tx, {
        empresaId: venda.empresaId,
        estoqueId: estoque.id,
        produtoId: item.produtoId!,
        tipo,
        quantidade: item.quantidade,
        motivo,
        referencia: `Venda ${venda.id}`,
      });
    }
  }

  private async mudarStatus(
    tx: Prisma.TransactionClient,
    id: string,
    statusAtual: StatusVenda,
    data: Prisma.VendaUpdateManyMutationInput,
  ): Promise<void> {
    const { count } = await tx.venda.updateMany({
      where: { id, status: statusAtual },
      data,
    });

    if (count === 0) {
      throw new ConflictException(
        'A venda foi alterada por outra operação. Atualize a página.',
      );
    }
  }

  private exigirStatus(
    atual: StatusVenda,
    esperado: StatusVenda,
    acao: string,
  ) {
    if (atual !== esperado) {
      throw new ConflictException(
        `Só vendas ${esperado}s podem ser ${acao}. Status atual: ${atual}.`,
      );
    }
  }

  private filtroEmpresa(escopo: EscopoUsuario): { empresaId?: string } {
    return escopo.empresaId ? { empresaId: escopo.empresaId } : {};
  }

  private async buscarNoEscopo(id: string, escopo: EscopoUsuario) {
    const venda = await this.prisma.venda.findFirst({
      where: { id, ...this.filtroEmpresa(escopo) },
      include: {
        itens: { include: { produto: { select: { tipo: true } } } },
        cliente: { select: { pessoa: { select: { nome: true } } } },
      },
    });

    if (!venda) {
      throw new NotFoundException('Venda não encontrada.');
    }

    return venda;
  }

  private async resolverFilial(
    filialId: string | undefined,
    escopo: EscopoUsuario,
  ): Promise<{ id: string; empresaId: string }> {
    if (!filialId) {
      throw new BadRequestException('Informe a filial da venda.');
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

  private async validarCliente(clienteId: string, empresaId: string) {
    const cliente = await this.prisma.cliente.findFirst({
      where: { id: clienteId, pessoa: { filial: { empresaId } } },
      select: { id: true },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado.');
    }
  }

  private async validarItens(itens: VendaItemDto[], empresaId: string) {
    if (
      itens.some((item) => !item.produtoId && !item.descricao_servico?.trim())
    ) {
      throw new BadRequestException(
        'Cada item deve ter um produto ou a descrição do serviço.',
      );
    }

    const ids = itens.flatMap((item) =>
      item.produtoId ? [item.produtoId] : [],
    );

    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException(
        'O mesmo produto aparece mais de uma vez; some as quantidades.',
      );
    }

    if (ids.length > 0) {
      const produtos = await this.prisma.produto.findMany({
        where: { id: { in: ids }, empresaId },
        select: { id: true, nome: true, ativo: true },
      });

      if (produtos.length !== ids.length) {
        throw new NotFoundException(
          'Um ou mais produtos não foram encontrados.',
        );
      }

      const inativo = produtos.find((produto) => produto.ativo === 'inativo');
      if (inativo) {
        throw new UnprocessableEntityException(
          `"${inativo.nome}" está inativo.`,
        );
      }
    }

    for (const item of itens) {
      if ((item.desconto ?? 0) > item.quantidade * item.valor_unitario) {
        throw new UnprocessableEntityException(
          'O desconto de um item não pode ser maior que o valor do item.',
        );
      }
    }
  }

  private dadosItem(item: VendaItemDto): ItemVenda {
    return {
      produtoId: item.produtoId || null,
      descricao_servico: item.descricao_servico?.trim() || null,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
      desconto: item.desconto ?? 0,
    };
  }

  private calcularTotal(
    itens: {
      quantidade: number;
      valor_unitario: number;
      desconto?: number | null;
    }[],
  ): number {
    const total = itens.reduce(
      (soma, item) =>
        soma + item.quantidade * item.valor_unitario - (item.desconto ?? 0),
      0,
    );
    return Math.round(total * 100) / 100;
  }

  private descricaoFinanceiro(venda: {
    cliente: { pessoa: { nome: string } } | null;
  }): string {
    return venda.cliente
      ? `Venda - ${venda.cliente.pessoa.nome}`
      : 'Venda balcão';
  }
}
