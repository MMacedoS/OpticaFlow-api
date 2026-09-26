import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEstoqueDto, UpdateEstoqueDto } from './dto/estoque.dto';

const ESTOQUE_INCLUDE = {
  filial: { select: { id: true, nome: true } },
  _count: { select: { itens: true } },
} satisfies Prisma.EstoqueInclude;

@Injectable()
export class EstoqueService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateEstoqueDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const filialId = escopo.filialId ?? dto.filialId;

    if (!filialId) {
      throw new BadRequestException('Informe a filial do estoque.');
    }

    const filial = await this.prisma.filial.findFirst({
      where: { id: filialId, ...this.filtroEmpresa(escopo) },
      select: { id: true, empresaId: true, estoques: { select: { id: true } } },
    });

    if (!filial) {
      throw new UnprocessableEntityException('Filial não encontrada.');
    }

    if (filial.estoques.length > 0) {
      throw new ConflictException('Esta filial já possui estoque.');
    }

    const estoque = await this.prisma.estoque.create({
      data: {
        empresaId: filial.empresaId,
        filialId: filial.id,
        nome: dto.nome,
      },
      include: ESTOQUE_INCLUDE,
    });

    return {
      status: 201,
      message: 'Estoque criado com sucesso.',
      data: { ...estoque, abaixoMinimo: 0 },
    };
  }

  async findAll(escopo: EscopoUsuario): Promise<ResponseJson> {
    const estoques = await this.prisma.estoque.findMany({
      where: {
        ...this.filtroEmpresa(escopo),
        ...(escopo.filialId && { filialId: escopo.filialId }),
      },
      include: ESTOQUE_INCLUDE,
      orderBy: { filial: { nome: 'asc' } },
    });

    const abaixo = await this.contarAbaixoDoMinimo(estoques.map((e) => e.id));

    return {
      status: 200,
      message: 'Estoques listados com sucesso.',
      data: estoques.map((estoque) => ({
        ...estoque,
        abaixoMinimo: abaixo.get(estoque.id) ?? 0,
      })),
    };
  }

  async findById(id: string, escopo: EscopoUsuario): Promise<ResponseJson> {
    const estoque = await this.buscarNoEscopo(id, escopo);
    const abaixo = await this.contarAbaixoDoMinimo([id]);

    return {
      status: 200,
      message: 'Estoque encontrado.',
      data: { ...estoque, abaixoMinimo: abaixo.get(id) ?? 0 },
    };
  }

  async update(
    id: string,
    dto: UpdateEstoqueDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    await this.buscarNoEscopo(id, escopo);

    const estoque = await this.prisma.estoque.update({
      where: { id },
      data: { nome: dto.nome },
      include: ESTOQUE_INCLUDE,
    });

    return { status: 200, message: 'Estoque atualizado.', data: estoque };
  }

  async deleteById(id: string, escopo: EscopoUsuario): Promise<ResponseJson> {
    await this.buscarNoEscopo(id, escopo);

    const [comSaldo, movimentos] = await this.prisma.$transaction([
      this.prisma.estoqueItem.count({
        where: { estoqueId: id, quantidade: { not: 0 } },
      }),
      this.prisma.movimentoEstoque.count({ where: { estoqueId: id } }),
    ]);

    if (comSaldo > 0 || movimentos > 0) {
      throw new ConflictException(
        'Não é possível excluir um estoque com saldo ou movimentações.',
      );
    }

    await this.prisma.estoque.delete({ where: { id } });

    return { status: 200, message: 'Estoque excluído.' };
  }

  private filtroEmpresa(escopo: EscopoUsuario): { empresaId?: string } {
    return escopo.empresaId ? { empresaId: escopo.empresaId } : {};
  }

  private async buscarNoEscopo(id: string, escopo: EscopoUsuario) {
    const estoque = await this.prisma.estoque.findFirst({
      where: { id, ...this.filtroEmpresa(escopo) },
      include: ESTOQUE_INCLUDE,
    });

    if (!estoque) {
      throw new NotFoundException('Estoque não encontrado.');
    }

    return estoque;
  }

  private async contarAbaixoDoMinimo(
    estoqueIds: string[],
  ): Promise<Map<string, number>> {
    if (estoqueIds.length === 0) return new Map();

    const grupos = await this.prisma.estoqueItem.groupBy({
      by: ['estoqueId'],
      where: {
        estoqueId: { in: estoqueIds },
        minimo: { not: null },
        quantidade: { lte: this.prisma.estoqueItem.fields.minimo },
      },
      _count: { _all: true },
    });

    return new Map(grupos.map((g) => [g.estoqueId, g._count._all]));
  }
}
