import { Injectable } from '@nestjs/common';
import { Prisma, TipoProduto } from '@prisma/client';
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
          empresaId: dto.empresaId,
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
      const produto = await this.prisma.produto.create({
        data: {
          empresaId: dto.empresaId,
          nome: dto.nome,
          sku: dto.sku,
          tipo: dto.tipo,
          categoria: dto.categoria,
          descricao: dto.descricao,
          preco_custo: dto.preco_custo,
          preco_venda: dto.preco_venda,
          ativo: dto.ativo ?? true,
        },
      });

      return {
        status: 201,
        message: 'Produto criado com sucesso.',
        data: produto,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return {
          status: 422,
          message: 'Produto já existe com estes dados.',
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
    ativo?: boolean,
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
      }),
      this.prisma.produto.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Produtos listados com sucesso.',
      data: produtos,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async findById(id: string): Promise<ResponseJson> {
    const produto = await this.prisma.produto.findUnique({
      where: { id },
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
        preco_venda: dto.preco_venda,
        ativo: dto.ativo,
      },
    });

    return {
      status: 200,
      message: 'Produto atualizado com sucesso.',
      data: produtoAtualizado,
    };
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
