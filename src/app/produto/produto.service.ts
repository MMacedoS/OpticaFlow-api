import { Injectable } from '@nestjs/common';
import { Prisma, Status, TipoProduto } from '@prisma/client';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProdutoDto, UpdateProdutoDto } from './dto/produto.dto';
import { ProdutoResumo } from './interfaces/produto.interface';

@Injectable()
export class ProdutoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProdutoDto): Promise<ResponseJson> {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: dto.empresaId },
      select: { id: true },
    });

    if (!empresa) {
      return { status: 422, message: 'Empresa não encontrada.' };
    }

    const produtoExistente = await this.prisma.produto.findUnique({
      where: {
        empresaId_sku: {
          empresaId: empresa.id,
          sku: dto.sku,
        },
      },
    });

    if (produtoExistente) {
      return {
        status: 400,
        message: 'Já existe um produto com este SKU para esta empresa.',
      };
    }

    try {
      const resultado = await this.prisma.$transaction(async (tx) => {
        const produto = await tx.produto.create({
          data: {
            empresaId: empresa.id,
            nome: dto.nome,
            sku: dto.sku,
            tipo: dto.tipo,
            categoria: dto.categoria,
            descricao: dto.descricao,
            preco_custo: dto.preco_custo,
            margem_lucro: dto.margem_lucro ?? 0,
            preco_venda: dto.preco_venda,
          },
        });

        if (dto.tipo !== 'servico') {
          if (!dto.filialId) {
            throw new Error(
              'O campo filialId é obrigatório para inicializar o estoque do produto.',
            );
          }

          let estoque = await tx.estoque.findFirst({
            where: {
              empresaId: dto.empresaId,
              filialId: dto.filialId,
            },
          });

          if (!estoque) {
            estoque = await tx.estoque.create({
              data: {
                empresaId: empresa.id,
                filialId: dto.filialId,
                nome: `Estoque Principal - Filial ID ${dto.filialId.substring(0, 5)}`,
              },
            });
          }

          await tx.estoqueItem.create({
            data: {
              estoqueId: estoque.id,
              produtoId: produto.id,
              quantidade: dto.quantidade_inicial ?? 0,
              minimo: dto.estoque_minimo ?? null,
              maximo: dto.estoque_maximo ?? null,
            },
          });
        }

        return produto;
      });

      return {
        status: 201,
        message: 'Item gravado com sucesso no catálogo.',
        data: resultado,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return {
          status: 422,
          message: 'Conflito de dados: Este SKU já está em uso nesta empresa.',
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
    tipo?: TipoProduto,
    ativo?: Status,
  ): Promise<ResponseJson> {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { id: true },
    });

    if (!empresa) {
      return { status: 422, message: 'Empresa não encontrada.' };
    }

    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, limit);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.ProdutoWhereInput = {
      empresaId,
      ...(tipo && { tipo }),
      ...(typeof ativo === 'boolean' && { ativo }),
      ...(search
        ? {
            OR: [
              { nome: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
              { categoria: { contains: search, mode: 'insensitive' } },
              { descricao: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [produtos, total] = await this.prisma.$transaction([
      this.prisma.produto.findMany({
        skip,
        take: limitNumber,
        where,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          estoque_itens: {
            select: {
              quantidade: true,
              minimo: true,
              maximo: true,
              estoque: {
                select: { filialId: true, nome: true },
              },
            },
          },
        },
      }),
      this.prisma.produto.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Produtos listados com sucesso.',
      data: {
        products: produtos,
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
    const produto = await this.prisma.produto.findUnique({
      where: { id },
      include: {
        estoque_itens: true,
      },
    });

    if (!produto) {
      return { status: 422, message: 'Produto não encontrado.' };
    }

    return {
      status: 200,
      message: 'Produto encontrado.',
      data: produto,
    };
  }

  async update(id: string, dto: UpdateProdutoDto): Promise<ResponseJson> {
    const produto = await this.prisma.produto.findUnique({
      where: { id },
      select: {
        id: true,
        empresaId: true,
        sku: true,
      },
    });

    if (!produto) {
      return { status: 422, message: 'Produto não encontrado.' };
    }

    if (dto.sku && dto.sku !== produto.sku) {
      const produtoComSku = await this.prisma.produto.findUnique({
        where: {
          empresaId_sku: {
            empresaId: produto.empresaId,
            sku: dto.sku,
          },
        },
        select: { id: true },
      });

      if (produtoComSku && produtoComSku.id !== produto.id) {
        return {
          status: 400,
          message: 'Já existe um produto com este SKU para esta empresa.',
        };
      }
    }

    const produtoAtualizado = await this.prisma.produto.update({
      where: { id },
      data: {
        nome: dto.nome,
        sku: dto.sku,
        tipo: dto.tipo,
        categoria: dto.categoria,
        descricao: dto.descricao,
        preco_custo: dto.preco_custo,
        margem_lucro: dto.margem_lucro,
        preco_venda: dto.preco_venda,
      },
    });

    return {
      status: 200,
      message: 'Produto atualizado com sucesso.',
      data: produtoAtualizado,
    };
  }

  async updateStatus(id: string, ativo: Status): Promise<ResponseJson> {
    try {
      const produtoAtualizado = await this.prisma.produto.update({
        where: { id },
        data: { ativo },
      });

      return {
        status: 200,
        message: 'Status do produto atualizado com sucesso.',
        data: produtoAtualizado,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return { status: 422, message: 'Produto não encontrado.' };
      }

      throw error;
    }
  }

  async deleteById(id: string): Promise<ResponseJson> {
    const produto = await this.prisma.produto.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!produto) {
      return { status: 422, message: 'Produto não encontrado.' };
    }

    await this.prisma.produto.delete({
      where: { id },
    });

    return {
      status: 200,
      message: 'Produto deletado com sucesso.',
    };
  }
}
