import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateCompraItemDto,
  UpdateCompraItemDto,
} from './dto/compra-item.dto';
import { CompraItemResumo } from './interfaces/compra-item.interface';

class RegraNegocioError extends Error {}

@Injectable()
export class CompraItemService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCompraItemDto): Promise<ResponseJson> {
    const compra = await this.prisma.compra.findUnique({
      where: { id: dto.compraId },
      select: {
        id: true,
        empresaId: true,
        filialId: true,
      },
    });

    if (!compra) {
      return { status: 422, message: 'Compra não encontrada.' };
    }

    const produto = await this.prisma.produto.findUnique({
      where: { id: dto.produtoId },
      select: {
        id: true,
        empresaId: true,
      },
    });

    if (!produto || produto.empresaId !== compra.empresaId) {
      return {
        status: 422,
        message: 'Produto não encontrado para a empresa da compra.',
      };
    }

    const itemExistente = await this.prisma.compraItem.findFirst({
      where: {
        compraId: dto.compraId,
        produtoId: dto.produtoId,
      },
      select: { id: true },
    });

    if (itemExistente) {
      return {
        status: 400,
        message: 'Já existe item desta compra para o produto informado.',
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
        message: 'O subtotal do item não pode ser negativo.',
      };
    }

    try {
      const item = await this.prisma.$transaction(async (tx) => {
        const estoque = await this.obterEstoqueDaCompra(
          tx,
          compra.empresaId,
          compra.filialId,
        );

        const novoItem = await tx.compraItem.create({
          data: {
            compraId: dto.compraId,
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
          dto.quantidade,
        );

        await tx.movimentoEstoque.create({
          data: {
            empresaId: compra.empresaId,
            estoqueId: estoque.id,
            produtoId: dto.produtoId,
            tipo: 'entrada',
            quantidade: dto.quantidade,
            motivo: 'Entrada por item de compra.',
            referencia: this.referenciaMovimento(novoItem.id),
          },
        });

        await this.recalcularValorTotalCompra(tx, dto.compraId);

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
          message: 'Relacionamento inválido ao criar item de compra.',
        };
      }

      throw error;
    }
  }

  async findAllByCompra(
    compraId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<ResponseJson> {
    const compra = await this.prisma.compra.findUnique({
      where: { id: compraId },
      select: { id: true },
    });

    if (!compra) {
      return { status: 422, message: 'Compra não encontrada.' };
    }

    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, limit);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.CompraItemWhereInput = {
      compraId,
    };

    const [itens, total] = await this.prisma.$transaction([
      this.prisma.compraItem.findMany({
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
      this.prisma.compraItem.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Itens de compra listados com sucesso.',
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
    const item = await this.prisma.compraItem.findUnique({
      where: { id },
      include: {
        compra: {
          select: {
            id: true,
            empresaId: true,
            filialId: true,
            dataCompra: true,
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
      return { status: 422, message: 'Item de compra não encontrado.' };
    }

    return {
      status: 200,
      message: 'Item de compra encontrado.',
      data: {
        ...this.mapResumo(item),
        compra: item.compra,
        produto: item.produto,
      },
    };
  }

  async update(id: string, dto: UpdateCompraItemDto): Promise<ResponseJson> {
    const item = await this.prisma.compraItem.findUnique({
      where: { id },
      select: {
        id: true,
        compraId: true,
        produtoId: true,
        quantidade: true,
        valor_unitario: true,
        desconto: true,
        compra: {
          select: {
            empresaId: true,
            filialId: true,
          },
        },
      },
    });

    if (!item) {
      return { status: 422, message: 'Item de compra não encontrado.' };
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
        message: 'O subtotal do item não pode ser negativo.',
      };
    }

    const deltaQuantidade = quantidadeDestino - item.quantidade;

    try {
      await this.prisma.$transaction(async (tx) => {
        const estoque = await this.obterEstoqueDaCompra(
          tx,
          item.compra.empresaId,
          item.compra.filialId,
        );

        if (deltaQuantidade !== 0) {
          await this.aplicarQuantidadeNoEstoque(
            tx,
            estoque.id,
            item.produtoId,
            deltaQuantidade,
          );
        }

        await tx.compraItem.update({
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
            tipo: 'entrada',
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
              empresaId: item.compra.empresaId,
              estoqueId: estoque.id,
              produtoId: item.produtoId,
              tipo: 'entrada',
              quantidade: quantidadeDestino,
              motivo: 'Entrada por item de compra.',
              referencia: this.referenciaMovimento(id),
            },
          });
        }

        await this.recalcularValorTotalCompra(tx, item.compraId);
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
    const item = await this.prisma.compraItem.findUnique({
      where: { id },
      select: {
        id: true,
        compraId: true,
        produtoId: true,
        quantidade: true,
        compra: {
          select: {
            empresaId: true,
            filialId: true,
          },
        },
      },
    });

    if (!item) {
      return { status: 422, message: 'Item de compra não encontrado.' };
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        const estoque = await this.obterEstoqueDaCompra(
          tx,
          item.compra.empresaId,
          item.compra.filialId,
        );

        await this.aplicarQuantidadeNoEstoque(
          tx,
          estoque.id,
          item.produtoId,
          -item.quantidade,
        );

        await tx.movimentoEstoque.deleteMany({
          where: {
            referencia: this.referenciaMovimento(id),
            estoqueId: estoque.id,
            produtoId: item.produtoId,
          },
        });

        await tx.compraItem.delete({
          where: { id },
        });

        await this.recalcularValorTotalCompra(tx, item.compraId);
      });

      return {
        status: 200,
        message: 'Item de compra deletado com sucesso.',
      };
    } catch (error) {
      if (error instanceof RegraNegocioError) {
        return { status: 422, message: error.message };
      }

      throw error;
    }
  }

  private mapResumo(item: CompraItemResumo): CompraItemResumo {
    return {
      id: item.id,
      compraId: item.compraId,
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

  private async obterEstoqueDaCompra(
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
        'Estoque não encontrado para a filial da compra.',
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
        'Quantidade em estoque insuficiente para concluir a operação.',
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

  private async recalcularValorTotalCompra(
    tx: PrismaService | Prisma.TransactionClient,
    compraId: string,
  ): Promise<void> {
    const itens = await tx.compraItem.findMany({
      where: { compraId },
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

    await tx.compra.update({
      where: { id: compraId },
      data: { valor_total: valorTotal },
    });
  }

  private referenciaMovimento(compraItemId: string): string {
    return `COMPRA_ITEM:${compraItemId}`;
  }
}
