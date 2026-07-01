import { Injectable } from '@nestjs/common';
import { Prisma, TipoMovimentoEstoque } from '@prisma/client';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateMovimentoEstoqueDto,
  UpdateMovimentoEstoqueDto,
} from './dto/movimento-estoque.dto';

@Injectable()
export class MovimentoEstoqueService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMovimentoEstoqueDto): Promise<ResponseJson> {
    if (!this.quantidadeValidaPorTipo(dto.tipo, dto.quantidade)) {
      return {
        status: 422,
        message: this.mensagemQuantidadeInvalida(dto.tipo),
      };
    }

    const validacao = await this.validarRelacionamentos(
      dto.empresaId,
      dto.estoqueId,
      dto.produtoId,
    );

    if (!validacao.valido) {
      return {
        status: 422,
        message: validacao.mensagem ?? 'Dados de relacionamento inválidos.',
      };
    }

    const item = await this.obterOuCriarItemEstoque(
      this.prisma,
      dto.estoqueId,
      dto.produtoId,
    );

    const saldoDestino = this.calcularSaldoDestino(
      item.quantidade,
      dto.tipo,
      dto.quantidade,
    );

    if (saldoDestino < 0) {
      return {
        status: 422,
        message: 'Saldo insuficiente para saída deste item.',
      };
    }

    const movimento = await this.prisma.$transaction(async (tx) => {
      await tx.estoqueItem.update({
        where: { id: item.id },
        data: { quantidade: saldoDestino },
      });

      return tx.movimentoEstoque.create({
        data: {
          empresaId: dto.empresaId,
          estoqueId: dto.estoqueId,
          produtoId: dto.produtoId,
          tipo: dto.tipo,
          quantidade: dto.quantidade,
          motivo: dto.motivo,
          referencia: dto.referencia,
        },
      });
    });

    return {
      status: 201,
      message: 'Movimento de estoque criado com sucesso.',
      data: movimento,
    };
  }

  async findAllByEmpresa(
    empresaId: string,
    page: number = 1,
    limit: number = 10,
    tipo?: TipoMovimentoEstoque,
    estoqueId?: string,
    produtoId?: string,
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

    const where: Prisma.MovimentoEstoqueWhereInput = {
      empresaId,
      ...(tipo && { tipo }),
      ...(estoqueId && { estoqueId }),
      ...(produtoId && { produtoId }),
    };

    const [movimentos, total] = await this.prisma.$transaction([
      this.prisma.movimentoEstoque.findMany({
        skip,
        take: limitNumber,
        where,
        include: {
          estoque: {
            select: {
              id: true,
              nome: true,
              filialId: true,
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
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.movimentoEstoque.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Movimentos de estoque listados com sucesso.',
      data: movimentos,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async findById(id: string): Promise<ResponseJson> {
    const movimento = await this.prisma.movimentoEstoque.findUnique({
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
          },
        },
      },
    });

    if (!movimento) {
      return { status: 422, message: 'Movimento de estoque não encontrado.' };
    }

    return {
      status: 200,
      message: 'Movimento de estoque encontrado.',
      data: movimento,
    };
  }

  async update(
    id: string,
    dto: UpdateMovimentoEstoqueDto,
  ): Promise<ResponseJson> {
    const movimentoAtual = await this.prisma.movimentoEstoque.findUnique({
      where: { id },
      select: {
        id: true,
        empresaId: true,
        estoqueId: true,
        produtoId: true,
        tipo: true,
        quantidade: true,
      },
    });

    if (!movimentoAtual) {
      return { status: 422, message: 'Movimento de estoque não encontrado.' };
    }

    const tipoDestino = dto.tipo ?? movimentoAtual.tipo;
    const quantidadeDestino = dto.quantidade ?? movimentoAtual.quantidade;

    if (!this.quantidadeValidaPorTipo(tipoDestino, quantidadeDestino)) {
      return {
        status: 422,
        message: this.mensagemQuantidadeInvalida(tipoDestino),
      };
    }

    const item = await this.prisma.estoqueItem.findUnique({
      where: {
        estoqueId_produtoId: {
          estoqueId: movimentoAtual.estoqueId,
          produtoId: movimentoAtual.produtoId,
        },
      },
      select: { id: true, quantidade: true },
    });

    if (!item) {
      return {
        status: 422,
        message: 'Item de estoque não encontrado para o movimento informado.',
      };
    }

    const saldoSemMovimentoAtual = this.reverterDoSaldoAtual(
      item.quantidade,
      movimentoAtual.tipo,
      movimentoAtual.quantidade,
    );

    if (saldoSemMovimentoAtual < 0) {
      return {
        status: 422,
        message:
          'Não foi possível atualizar o movimento porque o saldo atual está inconsistente.',
      };
    }

    const saldoDestino = this.calcularSaldoDestino(
      saldoSemMovimentoAtual,
      tipoDestino,
      quantidadeDestino,
    );

    if (saldoDestino < 0) {
      return {
        status: 422,
        message: 'Saldo insuficiente para aplicar a atualização do movimento.',
      };
    }

    const movimentoAtualizado = await this.prisma.$transaction(async (tx) => {
      await tx.estoqueItem.update({
        where: { id: item.id },
        data: {
          quantidade: saldoDestino,
        },
      });

      return tx.movimentoEstoque.update({
        where: { id },
        data: {
          tipo: dto.tipo,
          quantidade: dto.quantidade,
          motivo: dto.motivo,
          referencia: dto.referencia,
        },
      });
    });

    return {
      status: 200,
      message: 'Movimento de estoque atualizado com sucesso.',
      data: movimentoAtualizado,
    };
  }

  async deleteById(id: string): Promise<ResponseJson> {
    const movimento = await this.prisma.movimentoEstoque.findUnique({
      where: { id },
      select: {
        id: true,
        estoqueId: true,
        produtoId: true,
        tipo: true,
        quantidade: true,
      },
    });

    if (!movimento) {
      return { status: 422, message: 'Movimento de estoque não encontrado.' };
    }

    const item = await this.prisma.estoqueItem.findUnique({
      where: {
        estoqueId_produtoId: {
          estoqueId: movimento.estoqueId,
          produtoId: movimento.produtoId,
        },
      },
      select: { id: true, quantidade: true },
    });

    if (!item) {
      return {
        status: 422,
        message: 'Item de estoque não encontrado para estorno do movimento.',
      };
    }

    const saldoEstornado = this.reverterDoSaldoAtual(
      item.quantidade,
      movimento.tipo,
      movimento.quantidade,
    );

    if (saldoEstornado < 0) {
      return {
        status: 422,
        message:
          'Não foi possível excluir o movimento porque o saldo atual está inconsistente.',
      };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.estoqueItem.update({
        where: { id: item.id },
        data: { quantidade: saldoEstornado },
      });

      await tx.movimentoEstoque.delete({
        where: { id },
      });
    });

    return {
      status: 200,
      message: 'Movimento de estoque deletado com sucesso.',
    };
  }

  private async validarRelacionamentos(
    empresaId: string,
    estoqueId: string,
    produtoId: string,
  ): Promise<{ valido: boolean; mensagem?: string }> {
    const estoque = await this.prisma.estoque.findUnique({
      where: { id: estoqueId },
      select: { id: true, empresaId: true },
    });

    if (!estoque || estoque.empresaId !== empresaId) {
      return {
        valido: false,
        mensagem: 'Estoque não encontrado para a empresa informada.',
      };
    }

    const produto = await this.prisma.produto.findUnique({
      where: { id: produtoId },
      select: { id: true, empresaId: true },
    });

    if (!produto || produto.empresaId !== empresaId) {
      return {
        valido: false,
        mensagem: 'Produto não encontrado para a empresa informada.',
      };
    }

    return { valido: true };
  }

  private async obterOuCriarItemEstoque(
    tx: PrismaService | Prisma.TransactionClient,
    estoqueId: string,
    produtoId: string,
  ) {
    const item = await tx.estoqueItem.findUnique({
      where: {
        estoqueId_produtoId: {
          estoqueId,
          produtoId,
        },
      },
      select: { id: true, quantidade: true },
    });

    if (item) {
      return item;
    }

    return tx.estoqueItem.create({
      data: {
        estoqueId,
        produtoId,
        quantidade: 0,
      },
      select: { id: true, quantidade: true },
    });
  }

  private quantidadeValidaPorTipo(
    tipo: TipoMovimentoEstoque,
    quantidade: number,
  ): boolean {
    if (tipo === TipoMovimentoEstoque.ajuste) {
      return quantidade !== 0;
    }

    return quantidade > 0;
  }

  private mensagemQuantidadeInvalida(tipo: TipoMovimentoEstoque): string {
    if (tipo === TipoMovimentoEstoque.ajuste) {
      return 'Para ajuste, a quantidade deve ser diferente de zero.';
    }

    return 'Para entrada e saída, a quantidade deve ser maior que zero.';
  }

  private calcularSaldoDestino(
    saldoAtual: number,
    tipo: TipoMovimentoEstoque,
    quantidade: number,
  ): number {
    if (tipo === TipoMovimentoEstoque.entrada) {
      return saldoAtual + quantidade;
    }

    if (tipo === TipoMovimentoEstoque.saida) {
      return saldoAtual - quantidade;
    }

    return saldoAtual + quantidade;
  }

  private reverterDoSaldoAtual(
    saldoAtual: number,
    tipo: TipoMovimentoEstoque,
    quantidade: number,
  ): number {
    if (tipo === TipoMovimentoEstoque.entrada) {
      return saldoAtual - quantidade;
    }

    if (tipo === TipoMovimentoEstoque.saida) {
      return saldoAtual + quantidade;
    }

    return saldoAtual - quantidade;
  }
}
