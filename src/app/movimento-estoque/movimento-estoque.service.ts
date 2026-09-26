import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma, TipoMovimentoEstoque, TipoProduto } from '@prisma/client';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMovimentoEstoqueDto } from './dto/movimento-estoque.dto';
import {
  FiltroMovimentoEstoque,
  RegistroMovimento,
  ResultadoMovimento,
} from './interfaces/movimento-estoque.interface';

const MOVIMENTO_INCLUDE = {
  produto: { select: { id: true, nome: true, sku: true, tipo: true } },
  estoque: {
    select: {
      id: true,
      nome: true,
      filial: { select: { id: true, nome: true } },
    },
  },
} satisfies Prisma.MovimentoEstoqueInclude;

@Injectable()
export class MovimentoEstoqueService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateMovimentoEstoqueDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const estoque = await this.prisma.estoque.findFirst({
      where: { id: dto.estoqueId, ...this.filtroEmpresa(escopo) },
      select: { id: true, empresaId: true },
    });

    if (!estoque) {
      throw new NotFoundException('Estoque não encontrado.');
    }

    const { movimento, saldo } = await this.prisma.$transaction((tx) =>
      this.registrar(tx, {
        empresaId: estoque.empresaId,
        estoqueId: estoque.id,
        produtoId: dto.produtoId,
        tipo: dto.tipo,
        quantidade: dto.quantidade,
        motivo: dto.motivo,
        referencia: dto.referencia,
      }),
    );

    return {
      status: 201,
      message: 'Movimentação registrada com sucesso.',
      data: { ...movimento, saldo },
    };
  }

  /**
   * Registra uma movimentacao e atualiza o saldo dentro da transacao
   * informada. Usado tambem por compras, vendas e ordens de servico.
   */
  async registrar(
    tx: Prisma.TransactionClient,
    dados: RegistroMovimento,
  ): Promise<ResultadoMovimento> {
    await this.validarProduto(tx, dados.produtoId, dados.empresaId);
    this.validarQuantidade(dados.tipo, dados.quantidade);

    const chave = {
      estoqueId_produtoId: {
        estoqueId: dados.estoqueId,
        produtoId: dados.produtoId,
      },
    };

    const item = await tx.estoqueItem.upsert({
      where: chave,
      create: { estoqueId: dados.estoqueId, produtoId: dados.produtoId },
      update: {},
      select: { id: true, quantidade: true },
    });

    const { saldo, quantidadeMovimentada } = await this.aplicarNoSaldo(
      tx,
      item,
      dados.tipo,
      dados.quantidade,
    );

    const movimento = await tx.movimentoEstoque.create({
      data: {
        empresaId: dados.empresaId,
        estoqueId: dados.estoqueId,
        produtoId: dados.produtoId,
        tipo: dados.tipo,
        quantidade: quantidadeMovimentada,
        motivo: dados.motivo,
        referencia: dados.referencia,
      },
    });

    return { movimento, saldo };
  }

  /** Estoque da filial, criado na primeira vez que for necessario. */
  async obterOuCriarEstoque(
    tx: Prisma.TransactionClient,
    empresaId: string,
    filialId: string,
  ): Promise<{ id: string }> {
    return tx.estoque.upsert({
      where: { empresaId_filialId: { empresaId, filialId } },
      create: { empresaId, filialId, nome: 'Estoque principal' },
      update: {},
      select: { id: true },
    });
  }

  async findAll(
    escopo: EscopoUsuario,
    filtro: FiltroMovimentoEstoque,
  ): Promise<ResponseJson> {
    const page = Math.max(1, filtro.page);
    const limit = Math.max(1, filtro.limit);

    const where: Prisma.MovimentoEstoqueWhereInput = {
      ...this.filtroEmpresa(escopo),
      ...(escopo.filialId && { estoque: { filialId: escopo.filialId } }),
      ...(filtro.estoqueId && { estoqueId: filtro.estoqueId }),
      ...(filtro.produtoId && { produtoId: filtro.produtoId }),
      ...(filtro.tipo && { tipo: filtro.tipo }),
      ...((filtro.dataInicio || filtro.dataFim) && {
        createdAt: {
          ...(filtro.dataInicio && { gte: new Date(filtro.dataInicio) }),
          ...(filtro.dataFim && { lte: new Date(filtro.dataFim) }),
        },
      }),
    };

    const [movimentos, total] = await this.prisma.$transaction([
      this.prisma.movimentoEstoque.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where,
        include: MOVIMENTO_INCLUDE,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.movimentoEstoque.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Movimentações listadas com sucesso.',
      data: {
        movimentos,
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
    const movimento = await this.prisma.movimentoEstoque.findFirst({
      where: { id, ...this.filtroEmpresa(escopo) },
      include: MOVIMENTO_INCLUDE,
    });

    if (!movimento) {
      throw new NotFoundException('Movimentação não encontrada.');
    }

    return {
      status: 200,
      message: 'Movimentação encontrada.',
      data: movimento,
    };
  }

  private filtroEmpresa(escopo: EscopoUsuario): { empresaId?: string } {
    return escopo.empresaId ? { empresaId: escopo.empresaId } : {};
  }

  private async validarProduto(
    tx: Prisma.TransactionClient,
    produtoId: string,
    empresaId: string,
  ): Promise<void> {
    const produto = await tx.produto.findUnique({
      where: { id: produtoId },
      select: { empresaId: true, tipo: true },
    });

    if (!produto || produto.empresaId !== empresaId) {
      throw new NotFoundException('Produto não encontrado nesta empresa.');
    }

    if (produto.tipo === TipoProduto.servico) {
      throw new UnprocessableEntityException(
        'Serviços não têm controle de estoque.',
      );
    }
  }

  private validarQuantidade(tipo: TipoMovimentoEstoque, quantidade: number) {
    if (tipo !== TipoMovimentoEstoque.ajuste && quantidade <= 0) {
      throw new UnprocessableEntityException(
        'A quantidade de entrada ou saída deve ser maior que zero.',
      );
    }
  }

  /** Aplica a movimentacao no saldo; retorna o novo saldo e o delta. */
  private async aplicarNoSaldo(
    tx: Prisma.TransactionClient,
    item: { id: string; quantidade: number },
    tipo: TipoMovimentoEstoque,
    quantidade: number,
  ): Promise<{ saldo: number; quantidadeMovimentada: number }> {
    if (tipo === TipoMovimentoEstoque.entrada) {
      const atualizado = await tx.estoqueItem.update({
        where: { id: item.id },
        data: { quantidade: { increment: quantidade } },
      });
      return {
        saldo: atualizado.quantidade,
        quantidadeMovimentada: quantidade,
      };
    }

    if (tipo === TipoMovimentoEstoque.saida) {
      // Decremento condicional: evita saldo negativo mesmo com concorrencia.
      const { count } = await tx.estoqueItem.updateMany({
        where: { id: item.id, quantidade: { gte: quantidade } },
        data: { quantidade: { decrement: quantidade } },
      });

      if (count === 0) {
        throw new ConflictException(
          `Saldo insuficiente: disponível ${item.quantidade}, solicitado ${quantidade}.`,
        );
      }

      return {
        saldo: item.quantidade - quantidade,
        quantidadeMovimentada: quantidade,
      };
    }

    const diferenca = quantidade - item.quantidade;

    if (diferenca === 0) {
      throw new UnprocessableEntityException(
        'A quantidade contada é igual ao saldo atual; nada a ajustar.',
      );
    }

    await tx.estoqueItem.update({
      where: { id: item.id },
      data: { quantidade },
    });

    return { saldo: quantidade, quantidadeMovimentada: diferenca };
  }
}
