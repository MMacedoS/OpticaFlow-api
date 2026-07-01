import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateOrdemServicoItemDto,
  UpdateOrdemServicoItemDto,
} from './dto/ordem-servico-item.dto';
import { OrdemServicoItemResumo } from './interfaces/ordem-servico-item.interface';

class RegraNegocioError extends Error {}

@Injectable()
export class OrdemServicoItemService {
  constructor(private readonly prisma: PrismaService) {}

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

        if (dto.produtoId) {
          const estoque = await this.obterEstoqueDaOrdemServico(
            tx,
            ordemServico.empresaId,
            ordemServico.filialId,
          );

          await this.aplicarQuantidadeNoEstoque(
            tx,
            estoque.id,
            dto.produtoId,
            -dto.quantidade,
          );

          await tx.movimentoEstoque.create({
            data: {
              empresaId: ordemServico.empresaId,
              estoqueId: estoque.id,
              produtoId: dto.produtoId,
              tipo: 'saida',
              quantidade: dto.quantidade,
              motivo: 'Saida por item de ordem de servico.',
              referencia: this.referenciaMovimento(novoItem.id),
            },
          });
        }

        await this.recalcularValorTotalOrdemServico(tx, dto.ordemServicoId);

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

    const deltaQuantidade = quantidadeDestino - item.quantidade;

    try {
      await this.prisma.$transaction(async (tx) => {
        if (item.produtoId) {
          const estoque = await this.obterEstoqueDaOrdemServico(
            tx,
            item.ordem_servico.empresaId,
            item.ordem_servico.filialId,
          );

          if (deltaQuantidade !== 0) {
            await this.aplicarQuantidadeNoEstoque(
              tx,
              estoque.id,
              item.produtoId,
              -deltaQuantidade,
            );
          }

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
                empresaId: item.ordem_servico.empresaId,
                estoqueId: estoque.id,
                produtoId: item.produtoId,
                tipo: 'saida',
                quantidade: quantidadeDestino,
                motivo: 'Saida por item de ordem de servico.',
                referencia: this.referenciaMovimento(id),
              },
            });
          }
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
    } catch (error) {
      if (error instanceof RegraNegocioError) {
        return { status: 422, message: error.message };
      }

      throw error;
    }
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

    try {
      await this.prisma.$transaction(async (tx) => {
        if (item.produtoId) {
          const estoque = await this.obterEstoqueDaOrdemServico(
            tx,
            item.ordem_servico.empresaId,
            item.ordem_servico.filialId,
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
    } catch (error) {
      if (error instanceof RegraNegocioError) {
        return { status: 422, message: error.message };
      }

      throw error;
    }
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

  private async obterEstoqueDaOrdemServico(
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
        'Estoque nao encontrado para a filial da ordem de servico.',
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
