import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateVendaItemDto, UpdateVendaItemDto } from './dto/venda-item.dto';
import { VendaItemResumo } from './interfaces/venda-item.interface';

class RegraNegocioError extends Error {}

@Injectable()
export class VendaItemService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVendaItemDto): Promise<ResponseJson> {
    const venda = await this.prisma.venda.findUnique({
      where: { id: dto.vendaId },
      select: {
        id: true,
        empresaId: true,
        filialId: true,
      },
    });

    if (!venda) {
      return { status: 422, message: 'Venda nao encontrada.' };
    }

    const produto = await this.prisma.produto.findUnique({
      where: { id: dto.produtoId },
      select: {
        id: true,
        empresaId: true,
      },
    });

    if (!produto || produto.empresaId !== venda.empresaId) {
      return {
        status: 422,
        message: 'Produto nao encontrado para a empresa da venda.',
      };
    }

    const itemExistente = await this.prisma.vendaItem.findFirst({
      where: {
        vendaId: dto.vendaId,
        produtoId: dto.produtoId,
      },
      select: { id: true },
    });

    if (itemExistente) {
      return {
        status: 400,
        message: 'Ja existe item desta venda para o produto informado.',
      };
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
        const estoque = await this.obterEstoqueDaVenda(
          tx,
          venda.empresaId,
          venda.filialId,
        );

        const novoItem = await tx.vendaItem.create({
          data: {
            vendaId: dto.vendaId,
            produtoId: dto.produtoId,
            quantidade: dto.quantidade,
            valor_unitario: dto.valor_unitario,
            desconto: dto.desconto,
          },
          select: { id: true },
        });

        await this.aplicarQuantidadeNoEstoque(
          tx,
          estoque.id,
          dto.produtoId,
          -dto.quantidade,
        );

        await tx.movimentoEstoque.create({
          data: {
            empresaId: venda.empresaId,
            estoqueId: estoque.id,
            produtoId: dto.produtoId,
            tipo: 'saida',
            quantidade: dto.quantidade,
            motivo: 'Saida por item de venda.',
            referencia: this.referenciaMovimento(novoItem.id),
          },
        });

        await this.recalcularValorTotalVenda(tx, dto.vendaId);

        return novoItem;
      });

      return this.findById(item.id);
    } catch (error) {
      if (error instanceof RegraNegocioError) {
        return { status: 422, message: error.message };
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        return {
          status: 422,
          message: 'Relacionamento invalido ao criar item de venda.',
        };
      }

      throw error;
    }
  }

  async findAllByVenda(
    vendaId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<ResponseJson> {
    const venda = await this.prisma.venda.findUnique({
      where: { id: vendaId },
      select: { id: true },
    });

    if (!venda) {
      return { status: 422, message: 'Venda nao encontrada.' };
    }

    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, limit);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.VendaItemWhereInput = {
      vendaId,
    };

    const [itens, total] = await this.prisma.$transaction([
      this.prisma.vendaItem.findMany({
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
      this.prisma.vendaItem.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Itens de venda listados com sucesso.',
      data: itens.map((item) => this.mapResumo(item)),
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async findById(id: string): Promise<ResponseJson> {
    const item = await this.prisma.vendaItem.findUnique({
      where: { id },
      include: {
        venda: {
          select: {
            id: true,
            empresaId: true,
            filialId: true,
            dataVenda: true,
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
      return { status: 422, message: 'Item de venda nao encontrado.' };
    }

    return {
      status: 200,
      message: 'Item de venda encontrado.',
      data: {
        ...this.mapResumo(item),
        venda: item.venda,
        produto: item.produto,
      },
    };
  }

  async update(id: string, dto: UpdateVendaItemDto): Promise<ResponseJson> {
    const item = await this.prisma.vendaItem.findUnique({
      where: { id },
      select: {
        id: true,
        vendaId: true,
        produtoId: true,
        quantidade: true,
        valor_unitario: true,
        desconto: true,
        venda: {
          select: {
            empresaId: true,
            filialId: true,
          },
        },
      },
    });

    if (!item) {
      return { status: 422, message: 'Item de venda nao encontrado.' };
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

    const deltaQuantidade = quantidadeDestino - item.quantidade;

    try {
      await this.prisma.$transaction(async (tx) => {
        const estoque = await this.obterEstoqueDaVenda(
          tx,
          item.venda.empresaId,
          item.venda.filialId,
        );

        if (deltaQuantidade !== 0) {
          await this.aplicarQuantidadeNoEstoque(
            tx,
            estoque.id,
            item.produtoId,
            -deltaQuantidade,
          );
        }

        await tx.vendaItem.update({
          where: { id },
          data: {
            quantidade: dto.quantidade,
            valor_unitario: dto.valor_unitario,
            desconto: dto.desconto,
          },
        });

        const movimento = await tx.movimentoEstoque.findFirst({
          where: {
            referencia: this.referenciaMovimento(id),
            tipo: 'saida',
            estoqueId: estoque.id,
            produtoId: item.produtoId,
          },
          select: { id: true },
        });

        if (movimento) {
          await tx.movimentoEstoque.update({
            where: { id: movimento.id },
            data: { quantidade: quantidadeDestino },
          });
        } else {
          await tx.movimentoEstoque.create({
            data: {
              empresaId: item.venda.empresaId,
              estoqueId: estoque.id,
              produtoId: item.produtoId,
              tipo: 'saida',
              quantidade: quantidadeDestino,
              motivo: 'Saida por item de venda.',
              referencia: this.referenciaMovimento(id),
            },
          });
        }

        await this.recalcularValorTotalVenda(tx, item.vendaId);
      });

      return this.findById(id);
    } catch (error) {
      if (error instanceof RegraNegocioError) {
        return { status: 422, message: error.message };
      }

      throw error;
    }
  }

  async deleteById(id: string): Promise<ResponseJson> {
    const item = await this.prisma.vendaItem.findUnique({
      where: { id },
      select: {
        id: true,
        vendaId: true,
        produtoId: true,
        quantidade: true,
        venda: {
          select: {
            empresaId: true,
            filialId: true,
          },
        },
      },
    });

    if (!item) {
      return { status: 422, message: 'Item de venda nao encontrado.' };
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        const estoque = await this.obterEstoqueDaVenda(
          tx,
          item.venda.empresaId,
          item.venda.filialId,
        );

        await this.aplicarQuantidadeNoEstoque(
          tx,
          estoque.id,
          item.produtoId,
          item.quantidade,
        );

        await tx.movimentoEstoque.deleteMany({
          where: {
            referencia: this.referenciaMovimento(id),
            estoqueId: estoque.id,
            produtoId: item.produtoId,
          },
        });

        await tx.vendaItem.delete({
          where: { id },
        });

        await this.recalcularValorTotalVenda(tx, item.vendaId);
      });

      return {
        status: 200,
        message: 'Item de venda deletado com sucesso.',
      };
    } catch (error) {
      if (error instanceof RegraNegocioError) {
        return { status: 422, message: error.message };
      }

      throw error;
    }
  }

  private mapResumo(item: VendaItemResumo): VendaItemResumo {
    return {
      id: item.id,
      vendaId: item.vendaId,
      produtoId: item.produtoId,
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

  private async obterEstoqueDaVenda(
    tx: PrismaService | Prisma.TransactionClient,
    empresaId: string,
    filialId: string,
  ) {
    const estoque = await tx.estoque.findUnique({
      where: {
        empresaId_filialId: {
          empresaId,
          filialId,
        },
      },
      select: { id: true },
    });

    if (!estoque) {
      throw new RegraNegocioError(
        'Estoque nao encontrado para a filial da venda.',
      );
    }

    return estoque;
  }

  private async aplicarQuantidadeNoEstoque(
    tx: PrismaService | Prisma.TransactionClient,
    estoqueId: string,
    produtoId: string,
    deltaQuantidade: number,
  ): Promise<void> {
    const itemEstoque = await tx.estoqueItem.findUnique({
      where: {
        estoqueId_produtoId: {
          estoqueId,
          produtoId,
        },
      },
      select: {
        id: true,
        quantidade: true,
      },
    });

    const quantidadeAtual = itemEstoque?.quantidade ?? 0;
    const quantidadeDestino = quantidadeAtual + deltaQuantidade;

    if (quantidadeDestino < 0) {
      throw new RegraNegocioError(
        'Quantidade em estoque insuficiente para concluir a operacao.',
      );
    }

    if (itemEstoque) {
      await tx.estoqueItem.update({
        where: { id: itemEstoque.id },
        data: { quantidade: quantidadeDestino },
      });
      return;
    }

    await tx.estoqueItem.create({
      data: {
        estoqueId,
        produtoId,
        quantidade: quantidadeDestino,
      },
    });
  }

  private async recalcularValorTotalVenda(
    tx: PrismaService | Prisma.TransactionClient,
    vendaId: string,
  ): Promise<void> {
    const itens = await tx.vendaItem.findMany({
      where: { vendaId },
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

    await tx.venda.update({
      where: { id: vendaId },
      data: { valor_total: valorTotal },
    });
  }

  private referenciaMovimento(vendaItemId: string): string {
    return `VENDA_ITEM:${vendaItemId}`;
  }
}
