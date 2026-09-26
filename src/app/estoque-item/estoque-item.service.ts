import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma, TipoProduto } from '@prisma/client';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateEstoqueItemDto,
  UpdateEstoqueItemDto,
} from './dto/estoque-item.dto';
import { FiltroEstoqueItem } from './interfaces/estoque-item.interface';

const ITEM_INCLUDE = {
  produto: {
    select: {
      id: true,
      nome: true,
      sku: true,
      tipo: true,
      categoria: true,
      preco_venda: true,
      ativo: true,
    },
  },
  estoque: {
    select: {
      id: true,
      nome: true,
      filial: { select: { id: true, nome: true } },
    },
  },
} satisfies Prisma.EstoqueItemInclude;

@Injectable()
export class EstoqueItemService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateEstoqueItemDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const estoque = await this.buscarEstoque(dto.estoqueId, escopo);
    this.validarLimites(dto.minimo, dto.maximo);

    const produto = await this.prisma.produto.findFirst({
      where: { id: dto.produtoId, empresaId: estoque.empresaId },
      select: { tipo: true },
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado nesta empresa.');
    }

    if (produto.tipo === TipoProduto.servico) {
      throw new UnprocessableEntityException(
        'Serviços não têm controle de estoque.',
      );
    }

    const existente = await this.prisma.estoqueItem.findUnique({
      where: {
        estoqueId_produtoId: {
          estoqueId: estoque.id,
          produtoId: dto.produtoId,
        },
      },
      select: { id: true },
    });

    if (existente) {
      throw new ConflictException('Este produto já está neste estoque.');
    }

    const item = await this.prisma.estoqueItem.create({
      data: {
        estoqueId: estoque.id,
        produtoId: dto.produtoId,
        minimo: dto.minimo,
        maximo: dto.maximo,
      },
      include: ITEM_INCLUDE,
    });

    return {
      status: 201,
      message: 'Produto adicionado ao estoque.',
      data: item,
    };
  }

  async findAll(
    escopo: EscopoUsuario,
    filtro: FiltroEstoqueItem,
  ): Promise<ResponseJson> {
    const page = Math.max(1, filtro.page);
    const limit = Math.max(1, filtro.limit);
    const search = filtro.search.trim();

    const where: Prisma.EstoqueItemWhereInput = {
      estoque: {
        ...(escopo.empresaId && { empresaId: escopo.empresaId }),
        ...(escopo.filialId && { filialId: escopo.filialId }),
      },
      ...(filtro.estoqueId && { estoqueId: filtro.estoqueId }),
      ...(filtro.abaixoMinimo && {
        minimo: { not: null },
        quantidade: { lte: this.prisma.estoqueItem.fields.minimo },
      }),
      produto: {
        ...(filtro.tipo && { tipo: filtro.tipo }),
        ...(search && {
          OR: [
            { nome: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
            { categoria: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
    };

    const [itens, total] = await this.prisma.$transaction([
      this.prisma.estoqueItem.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where,
        include: ITEM_INCLUDE,
        orderBy: { produto: { nome: 'asc' } },
      }),
      this.prisma.estoqueItem.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Itens de estoque listados com sucesso.',
      data: {
        itens,
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
    const item = await this.prisma.estoqueItem.findFirst({
      where: { id, estoque: this.filtroEmpresa(escopo) },
      include: ITEM_INCLUDE,
    });

    if (!item) {
      throw new NotFoundException('Item de estoque não encontrado.');
    }

    return { status: 200, message: 'Item de estoque encontrado.', data: item };
  }

  async update(
    id: string,
    dto: UpdateEstoqueItemDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const atual = await this.buscarItem(id, escopo);
    this.validarLimites(
      dto.minimo === undefined ? atual.minimo : dto.minimo,
      dto.maximo === undefined ? atual.maximo : dto.maximo,
    );

    const item = await this.prisma.estoqueItem.update({
      where: { id },
      data: { minimo: dto.minimo, maximo: dto.maximo },
      include: ITEM_INCLUDE,
    });

    return {
      status: 200,
      message: 'Limites do item atualizados.',
      data: item,
    };
  }

  async deleteById(id: string, escopo: EscopoUsuario): Promise<ResponseJson> {
    const item = await this.buscarItem(id, escopo);

    if (item.quantidade !== 0) {
      throw new ConflictException(
        'Só é possível remover do estoque um produto com saldo zero.',
      );
    }

    await this.prisma.estoqueItem.delete({ where: { id } });

    return { status: 200, message: 'Produto removido do estoque.' };
  }

  private filtroEmpresa(escopo: EscopoUsuario): { empresaId?: string } {
    return escopo.empresaId ? { empresaId: escopo.empresaId } : {};
  }

  private async buscarEstoque(estoqueId: string, escopo: EscopoUsuario) {
    const estoque = await this.prisma.estoque.findFirst({
      where: { id: estoqueId, ...this.filtroEmpresa(escopo) },
      select: { id: true, empresaId: true },
    });

    if (!estoque) {
      throw new NotFoundException('Estoque não encontrado.');
    }

    return estoque;
  }

  private async buscarItem(id: string, escopo: EscopoUsuario) {
    const item = await this.prisma.estoqueItem.findFirst({
      where: { id, estoque: this.filtroEmpresa(escopo) },
      select: { id: true, quantidade: true, minimo: true, maximo: true },
    });

    if (!item) {
      throw new NotFoundException('Item de estoque não encontrado.');
    }

    return item;
  }

  private validarLimites(minimo?: number | null, maximo?: number | null) {
    if (minimo != null && maximo != null && minimo > maximo) {
      throw new UnprocessableEntityException(
        'O mínimo não pode ser maior que o máximo.',
      );
    }
  }
}
