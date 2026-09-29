import { Injectable } from '@nestjs/common';
import { Prisma, TipoMovimentoEstoque } from '@prisma/client';
import { MovimentoEstoqueService } from 'src/app/movimento-estoque/movimento-estoque.service';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateOrdemServicoItemDto,
  UpdateOrdemServicoItemDto,
} from './dto/ordem-servico-item.dto';
import { OrdemServicoItemResumo } from './interfaces/ordem-servico-item.interface';

@Injectable()
export class OrdemServicoItemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly movimentoEstoque: MovimentoEstoqueService,
  ) {}

  async create(dto: CreateOrdemServicoItemDto): Promise<ResponseJson> {
    const ordemServico = await this.prisma.ordemServico.findUnique({
      where: { id: dto.ordemServicoId },
      select: {
        id: true,
        empresaId: true,
        filialId: true,
      },
    });

    if (!ordemServico) {
      return { status: 422, message: 'Ordem de servico nao encontrada.' };
    }

    if (!dto.produtoId && !dto.descricao_servico) {
      return {
        status: 422,
        message: 'Informe produtoId ou descricao_servico para o item.',
      };
    }

    if (dto.produtoId) {
      const produto = await this.prisma.produto.findUnique({
        where: { id: dto.produtoId },
        select: {
          id: true,
          empresaId: true,
        },
      });

      if (!produto || produto.empresaId !== ordemServico.empresaId) {
        return {
          status: 422,
          message: 'Produto nao encontrado para a empresa da ordem de servico.',
        };
      }

      const itemExistente = await this.prisma.ordemServicoItem.findFirst({
        where: {
          ordemServicoId: dto.ordemServicoId,
          produtoId: dto.produtoId,
        },
        select: { id: true },
      });

      if (itemExistente) {
        return {
          status: 400,
          message:
            'Ja existe item desta ordem de servico para o produto informado.',
        };
      }
    }

    const subtotal = this.calcularSubtotal(
      dto.quantidade,
      dto.valor_unitario,
      dto.desconto,
    );

    if (subtotal < 0) {
      return {
        status: 422,
        message: 'O subtotal do item nao pode ser negativo.',
      };
    }

    try {
      const item = await this.prisma.$transaction(async (tx) => {
        const novoItem = await tx.ordemServicoItem.create({
          data: {
            ordemServicoId: dto.ordemServicoId,
            produtoId: dto.produtoId,
            descricao_servico: dto.descricao_servico,
            quantidade: dto.quantidade,
            valor_unitario: dto.valor_unitario,
            desconto: dto.desconto,
          },
          select: { id: true },
        });

        await this.recalcularValorTotalOrdemServico(tx, dto.ordemServicoId);

        return novoItem;
      });

      return this.findById(item.id);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        return {
          status: 422,
          message: 'Relacionamento invalido ao criar item de ordem de servico.',
        };
      }

      throw error;
    }
  }

  async findAllByOrdemServico(
    ordemServicoId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<ResponseJson> {
    const ordemServico = await this.prisma.ordemServico.findUnique({
      where: { id: ordemServicoId },
      select: { id: true },
    });

    if (!ordemServico) {
      return { status: 422, message: 'Ordem de servico nao encontrada.' };
    }

    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, limit);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.OrdemServicoItemWhereInput = {
      ordemServicoId,
    };

    const [itens, total] = await this.prisma.$transaction([
      this.prisma.ordemServicoItem.findMany({
        skip,
        take: limitNumber,
        where,
        include: {
          produto: {
            select: {
              id: true,
              nome: true,
              sku: true,
              tipo: true,
            },
          },
        },
        orderBy: {
          id: 'asc',
        },
      }),
      this.prisma.ordemServicoItem.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Itens de ordem de servico listados com sucesso.',
      data: {
        itens: itens.map((item) => this.mapResumo(item)),
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
    const item = await this.prisma.ordemServicoItem.findUnique({
      where: { id },
      include: {
        ordem_servico: {
          select: {
            id: true,
            empresaId: true,
            filialId: true,
            numero: true,
            status: true,
            valor_total: true,
          },
        },
        produto: {
          select: {
            id: true,
            nome: true,
            sku: true,
            tipo: true,
          },
        },
      },
    });

    if (!item) {
      return {
        status: 422,
        message: 'Item de ordem de servico nao encontrado.',
      };
    }

    return {
      status: 200,
      message: 'Item de ordem de servico encontrado.',
      data: {
        ...this.mapResumo(item),
        ordemServico: item.ordem_servico,
        produto: item.produto,
      },
    };
  }

  async update(
    id: string,
    dto: UpdateOrdemServicoItemDto,
  ): Promise<ResponseJson> {
    const item = await this.prisma.ordemServicoItem.findUnique({
      where: { id },
      select: {
        id: true,
        ordemServicoId: true,
        produtoId: true,
        quantidade: true,
        valor_unitario: true,
        desconto: true,
        ordem_servico: {
          select: {
            empresaId: true,
            filialId: true,
          },
        },
      },
    });

    if (!item) {
      return {
        status: 422,
        message: 'Item de ordem de servico nao encontrado.',
      };
    }

    const quantidadeDestino = dto.quantidade ?? item.quantidade;
    const valorUnitarioDestino = dto.valor_unitario ?? item.valor_unitario;
    const descontoDestino = dto.desconto ?? item.desconto ?? 0;

    const subtotalDestino = this.calcularSubtotal(
      quantidadeDestino,
      valorUnitarioDestino,
      descontoDestino,
    );

    if (subtotalDestino < 0) {
      return {
        status: 422,
        message: 'O subtotal do item nao pode ser negativo.',
      };
    }

    await this.prisma.$transaction(async (tx) => {
      if (item.produtoId) {
        await this.estornarBaixaAntiga(
          tx,
          item.id,
          item.produtoId,
          item.ordem_servico,
        );
      }

      await tx.ordemServicoItem.update({
        where: { id },
        data: {
          descricao_servico: dto.descricao_servico,
          quantidade: dto.quantidade,
          valor_unitario: dto.valor_unitario,
          desconto: dto.desconto,
        },
      });

      await this.recalcularValorTotalOrdemServico(tx, item.ordemServicoId);
    });

    return this.findById(id);
  }

  async deleteById(id: string): Promise<ResponseJson> {
    const item = await this.prisma.ordemServicoItem.findUnique({
      where: { id },
      select: {
        id: true,
        ordemServicoId: true,
        produtoId: true,
        quantidade: true,
        ordem_servico: {
          select: {
            empresaId: true,
            filialId: true,
          },
        },
      },
    });

    if (!item) {
      return {
        status: 422,
        message: 'Item de ordem de servico nao encontrado.',
      };
    }

    await this.prisma.$transaction(async (tx) => {
      if (item.produtoId) {
        await this.estornarBaixaAntiga(
          tx,
          item.id,
          item.produtoId,
          item.ordem_servico,
        );
      }

      await tx.ordemServicoItem.delete({
        where: { id },
      });

      await this.recalcularValorTotalOrdemServico(tx, item.ordemServicoId);
    });

    return {
      status: 200,
      message: 'Item de ordem de servico deletado com sucesso.',
    };
  }

  private mapResumo(item: OrdemServicoItemResumo): OrdemServicoItemResumo {
    return {
      id: item.id,
      ordemServicoId: item.ordemServicoId,
      produtoId: item.produtoId,
      descricao_servico: item.descricao_servico,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
      desconto: item.desconto,
    };
  }

  private calcularSubtotal(
    quantidade: number,
    valorUnitario: number,
    desconto?: number | null,
  ): number {
    return quantidade * valorUnitario - (desconto ?? 0);
  }

  /**
   * Os itens da OS nao movimentam mais o estoque: a baixa acontece ao
   * finalizar a venda. Itens criados antes disso deram saida no estoque;
   * ao editar ou remover um deles, a saida antiga e estornada uma unica vez.
   */
  private async estornarBaixaAntiga(
    tx: Prisma.TransactionClient,
    ordemServicoItemId: string,
    produtoId: string,
    ordemServico: { empresaId: string; filialId: string },
  ): Promise<void> {
    const referencia = this.referenciaMovimento(ordemServicoItemId);
    const referenciaEstorno = `ESTORNO:${referencia}`;

    const [baixa, estorno] = await Promise.all([
      tx.movimentoEstoque.findFirst({
        where: { referencia, tipo: TipoMovimentoEstoque.saida, produtoId },
        select: { estoqueId: true, quantidade: true },
      }),
      tx.movimentoEstoque.findFirst({
        where: { referencia: referenciaEstorno, produtoId },
        select: { id: true },
      }),
    ]);

    if (!baixa || estorno) {
      return;
    }

    await this.movimentoEstoque.registrar(tx, {
      empresaId: ordemServico.empresaId,
      estoqueId: baixa.estoqueId,
      produtoId,
      tipo: TipoMovimentoEstoque.entrada,
      quantidade: baixa.quantidade,
      motivo:
        'Estorno de baixa feita pela ordem de servico (a baixa passou a ser feita na venda).',
      referencia: referenciaEstorno,
    });
  }

  private async recalcularValorTotalOrdemServico(
    tx: PrismaService | Prisma.TransactionClient,
    ordemServicoId: string,
  ): Promise<void> {
    const itens = await tx.ordemServicoItem.findMany({
      where: { ordemServicoId },
      select: {
        quantidade: true,
        valor_unitario: true,
        desconto: true,
      },
    });

    const valorTotal = itens.reduce((acc, item) => {
      return (
        acc +
        this.calcularSubtotal(
          item.quantidade,
          item.valor_unitario,
          item.desconto,
        )
      );
    }, 0);

    await tx.ordemServico.update({
      where: { id: ordemServicoId },
      data: { valor_total: valorTotal },
    });
  }

  private referenciaMovimento(ordemServicoItemId: string): string {
    return `ORDEM_SERVICO_ITEM:${ordemServicoItemId}`;
  }
}
