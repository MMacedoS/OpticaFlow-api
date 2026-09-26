import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  Prisma,
  Status,
  TipoMovimentoEstoque,
  TipoProduto,
} from '@prisma/client';
import { MovimentoEstoqueService } from 'src/app/movimento-estoque/movimento-estoque.service';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProdutoDto, UpdateProdutoDto } from './dto/produto.dto';
import { FiltroProduto } from './interfaces/produto.interface';

const PRODUTO_INCLUDE = {
  estoque_itens: {
    select: {
      id: true,
      quantidade: true,
      minimo: true,
      maximo: true,
      estoque: {
        select: { id: true, filialId: true, nome: true },
      },
    },
  },
} satisfies Prisma.ProdutoInclude;

@Injectable()
export class ProdutoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly movimentoEstoque: MovimentoEstoqueService,
  ) {}

  async create(
    dto: CreateProdutoDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const empresaId = await this.resolverEmpresa(dto.empresaId, escopo);
    await this.garantirSkuDisponivel(empresaId, dto.sku);

    const filialId = dto.filialId ?? escopo.filialId;
    const controlaEstoque = dto.tipo !== TipoProduto.servico && !!filialId;

    if (!controlaEstoque && (dto.quantidade_inicial ?? 0) > 0) {
      throw new UnprocessableEntityException(
        dto.tipo === TipoProduto.servico
          ? 'Serviços não têm saldo em estoque.'
          : 'Informe a filial para lançar o saldo inicial.',
      );
    }

    const produto = await this.prisma.$transaction(async (tx) => {
      const criado = await tx.produto.create({
        data: {
          empresaId,
          nome: dto.nome,
          sku: dto.sku,
          tipo: dto.tipo,
          categoria: dto.categoria,
          descricao: dto.descricao,
          preco_custo: dto.preco_custo,
          margem_lucro: dto.margem_lucro ?? 0,
          preco_venda: dto.preco_venda,
          ativo: dto.ativo,
        },
      });

      if (controlaEstoque) {
        await this.inicializarEstoque(tx, criado.id, empresaId, filialId, dto);
      }

      return tx.produto.findUniqueOrThrow({
        where: { id: criado.id },
        include: PRODUTO_INCLUDE,
      });
    });

    return {
      status: 201,
      message: 'Produto cadastrado com sucesso.',
      data: produto,
    };
  }

  async findAll(
    escopo: EscopoUsuario,
    filtro: FiltroProduto,
  ): Promise<ResponseJson> {
    const page = Math.max(1, filtro.page);
    const limit = Math.max(1, filtro.limit);
    const search = filtro.search.trim();

    const where: Prisma.ProdutoWhereInput = {
      ...this.filtroEmpresa(escopo),
      ...(filtro.tipo && { tipo: filtro.tipo }),
      ...(filtro.ativo && { ativo: filtro.ativo }),
      ...(search && {
        OR: [
          { nome: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { categoria: { contains: search, mode: 'insensitive' } },
          { descricao: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [produtos, total] = await this.prisma.$transaction([
      this.prisma.produto.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
        include: PRODUTO_INCLUDE,
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
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async findById(id: string, escopo: EscopoUsuario): Promise<ResponseJson> {
    const produto = await this.prisma.produto.findFirst({
      where: { id, ...this.filtroEmpresa(escopo) },
      include: PRODUTO_INCLUDE,
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado.');
    }

    return { status: 200, message: 'Produto encontrado.', data: produto };
  }

  async update(
    id: string,
    dto: UpdateProdutoDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const produto = await this.buscarNoEscopo(id, escopo);

    if (dto.sku && dto.sku !== produto.sku) {
      await this.garantirSkuDisponivel(produto.empresaId, dto.sku, id);
    }

    if (
      dto.tipo === TipoProduto.servico &&
      produto.tipo !== TipoProduto.servico
    ) {
      await this.garantirSemEstoque(id);
    }

    const atualizado = await this.prisma.produto.update({
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
      include: PRODUTO_INCLUDE,
    });

    return {
      status: 200,
      message: 'Produto atualizado com sucesso.',
      data: atualizado,
    };
  }

  async updateStatus(
    id: string,
    ativo: Status,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    await this.buscarNoEscopo(id, escopo);

    const atualizado = await this.prisma.produto.update({
      where: { id },
      data: { ativo },
    });

    return {
      status: 200,
      message: 'Status do produto atualizado com sucesso.',
      data: atualizado,
    };
  }

  async deleteById(id: string, escopo: EscopoUsuario): Promise<ResponseJson> {
    await this.buscarNoEscopo(id, escopo);

    const [movimentos, ordens, vendas, compras] =
      await this.prisma.$transaction([
        this.prisma.movimentoEstoque.count({ where: { produtoId: id } }),
        this.prisma.ordemServicoItem.count({ where: { produtoId: id } }),
        this.prisma.vendaItem.count({ where: { produtoId: id } }),
        this.prisma.compraItem.count({ where: { produtoId: id } }),
      ]);

    if (movimentos + ordens + vendas + compras > 0) {
      throw new ConflictException(
        'Produto com histórico de estoque, OS, vendas ou compras não pode ser excluído. Inative-o.',
      );
    }

    await this.prisma.produto.delete({ where: { id } });

    return { status: 200, message: 'Produto excluído com sucesso.' };
  }

  private filtroEmpresa(escopo: EscopoUsuario): { empresaId?: string } {
    return escopo.empresaId ? { empresaId: escopo.empresaId } : {};
  }

  private async buscarNoEscopo(id: string, escopo: EscopoUsuario) {
    const produto = await this.prisma.produto.findFirst({
      where: { id, ...this.filtroEmpresa(escopo) },
      select: { id: true, empresaId: true, sku: true, tipo: true },
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado.');
    }

    return produto;
  }

  private async resolverEmpresa(
    empresaIdInformada: string | undefined,
    escopo: EscopoUsuario,
  ): Promise<string> {
    if (escopo.empresaId) return escopo.empresaId;

    if (!empresaIdInformada) {
      throw new BadRequestException('Informe a empresa do produto.');
    }

    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaIdInformada },
      select: { id: true },
    });

    if (!empresa) {
      throw new UnprocessableEntityException('Empresa não encontrada.');
    }

    return empresa.id;
  }

  private async garantirSkuDisponivel(
    empresaId: string,
    sku: string,
    ignorarId?: string,
  ): Promise<void> {
    const existente = await this.prisma.produto.findFirst({
      where: { empresaId, sku, ...(ignorarId && { NOT: { id: ignorarId } }) },
      select: { id: true },
    });

    if (existente) {
      throw new ConflictException('Já existe um produto com este SKU.');
    }
  }

  private async garantirSemEstoque(produtoId: string): Promise<void> {
    const [comSaldo, movimentos] = await this.prisma.$transaction([
      this.prisma.estoqueItem.count({
        where: { produtoId, quantidade: { not: 0 } },
      }),
      this.prisma.movimentoEstoque.count({ where: { produtoId } }),
    ]);

    if (comSaldo > 0 || movimentos > 0) {
      throw new ConflictException(
        'Produto com estoque ou movimentações não pode virar serviço.',
      );
    }
  }

  private async inicializarEstoque(
    tx: Prisma.TransactionClient,
    produtoId: string,
    empresaId: string,
    filialId: string,
    dto: CreateProdutoDto,
  ): Promise<void> {
    const filial = await tx.filial.findFirst({
      where: { id: filialId, empresaId },
      select: { id: true },
    });

    if (!filial) {
      throw new UnprocessableEntityException('Filial não encontrada.');
    }

    const estoque = await this.movimentoEstoque.obterOuCriarEstoque(
      tx,
      empresaId,
      filialId,
    );

    await tx.estoqueItem.create({
      data: {
        estoqueId: estoque.id,
        produtoId,
        minimo: dto.estoque_minimo ?? null,
        maximo: dto.estoque_maximo ?? null,
      },
    });

    if ((dto.quantidade_inicial ?? 0) > 0) {
      await this.movimentoEstoque.registrar(tx, {
        empresaId,
        estoqueId: estoque.id,
        produtoId,
        tipo: TipoMovimentoEstoque.entrada,
        quantidade: dto.quantidade_inicial!,
        motivo: 'Saldo inicial',
      });
    }
  }
}
