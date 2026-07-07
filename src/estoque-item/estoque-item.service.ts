import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateEstoqueItemDto,
  UpdateEstoqueItemDto,
} from './dto/estoque-item.dto';

@Injectable()
export class EstoqueItemService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEstoqueItemDto): Promise<ResponseJson> {
    const estoque = await this.prisma.estoque.findUnique({
      where: { id: dto.estoqueId },
      select: { id: true, empresaId: true },
    });

    if (!estoque) {
      return { status: 422, message: 'Estoque não encontrado.' };
    }

    const produto = await this.prisma.produto.findUnique({
      where: { id: dto.produtoId },
      select: { id: true, empresaId: true },
    });

    if (!produto || produto.empresaId !== estoque.empresaId) {
      return {
        status: 422,
        message: 'Produto não encontrado para a empresa do estoque.',
      };
    }

    const itemExistente = await this.prisma.estoqueItem.findUnique({
      where: {
        estoqueId_produtoId: {
          estoqueId: dto.estoqueId,
          produtoId: dto.produtoId,
        },
      },
      select: { id: true },
    });

    if (itemExistente) {
      return {
        status: 400,
        message: 'Já existe item para este produto no estoque informado.',
      };
    }

    if (
      dto.minimo !== undefined &&
      dto.maximo !== undefined &&
      dto.minimo > dto.maximo
    ) {
      return {
        status: 422,
        message: 'O mínimo não pode ser maior que o máximo.',
      };
    }

    try {
      const item = await this.prisma.estoqueItem.create({
        data: {
          estoqueId: dto.estoqueId,
          produtoId: dto.produtoId,
          quantidade: dto.quantidade ?? 0,
          minimo: dto.minimo,
          maximo: dto.maximo,
        },
      });

      return {
        status: 201,
        message: 'Item de estoque criado com sucesso.',
        data: item,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return {
          status: 422,
          message: 'Item de estoque já existe com estes dados.',
        };
      }

      throw error;
    }
  }

  async findAllByEstoque(
    estoqueId: string,
    page: number = 1,
    limit: number = 10,
    search: string = '',
  ): Promise<ResponseJson> {
    const estoque = await this.prisma.estoque.findUnique({
      where: { id: estoqueId },
      select: { id: true },
    });

    if (!estoque) {
      return { status: 422, message: 'Estoque não encontrado.' };
    }

    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, limit);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.EstoqueItemWhereInput = {
      estoqueId,
      ...(search
        ? {
            OR: [
              {
                produto: {
                  nome: { contains: search, mode: 'insensitive' },
                },
              },
              {
                produto: {
                  sku: { contains: search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };

    const [itens, total] = await this.prisma.$transaction([
      this.prisma.estoqueItem.findMany({
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
              preco_venda: true,
              ativo: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      }),
      this.prisma.estoqueItem.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Itens de estoque listados com sucesso.',
      data: {
        itens: itens,
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
    const item = await this.prisma.estoqueItem.findUnique({
      where: { id },
      include: {
        estoque: {
          select: {
            id: true,
            empresaId: true,
            filialId: true,
            nome: true,
          },
        },
        produto: {
          select: {
            id: true,
            nome: true,
            sku: true,
            tipo: true,
            preco_venda: true,
            ativo: true,
          },
        },
      },
    });

    if (!item) {
      return { status: 422, message: 'Item de estoque não encontrado.' };
    }

    return {
      status: 200,
      message: 'Item de estoque encontrado.',
      data: item,
    };
  }

  async update(id: string, dto: UpdateEstoqueItemDto): Promise<ResponseJson> {
    const item = await this.prisma.estoqueItem.findUnique({
      where: { id },
      select: {
        id: true,
        minimo: true,
        maximo: true,
      },
    });

    if (!item) {
      return { status: 422, message: 'Item de estoque não encontrado.' };
    }

    const minimoDestino = dto.minimo ?? item.minimo;
    const maximoDestino = dto.maximo ?? item.maximo;

    if (
      minimoDestino !== null &&
      maximoDestino !== null &&
      minimoDestino !== undefined &&
      maximoDestino !== undefined &&
      minimoDestino > maximoDestino
    ) {
      return {
        status: 422,
        message: 'O mínimo não pode ser maior que o máximo.',
      };
    }

    const itemAtualizado = await this.prisma.estoqueItem.update({
      where: { id },
      data: {
        quantidade: dto.quantidade,
        minimo: dto.minimo,
        maximo: dto.maximo,
      },
    });

    return {
      status: 200,
      message: 'Item de estoque atualizado com sucesso.',
      data: itemAtualizado,
    };
  }

  async deleteById(id: string): Promise<ResponseJson> {
    const item = await this.prisma.estoqueItem.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!item) {
      return { status: 422, message: 'Item de estoque não encontrado.' };
    }

    await this.prisma.estoqueItem.delete({
      where: { id },
    });

    return {
      status: 200,
      message: 'Item de estoque deletado com sucesso.',
    };
  }
}
