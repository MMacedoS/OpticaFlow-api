import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCompraDto, UpdateCompraDto } from './dto/compra.dto';
import { CompraResumo } from './interfaces/compra.interface';

@Injectable()
export class CompraService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCompraDto): Promise<ResponseJson> {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: dto.empresaId },
      select: { id: true },
    });

    if (!empresa) {
      return { status: 422, message: 'Empresa não encontrada.' };
    }

    const filial = await this.prisma.filial.findUnique({
      where: { id: dto.filialId },
      select: { id: true, empresaId: true },
    });

    if (!filial || filial.empresaId !== dto.empresaId) {
      return {
        status: 422,
        message: 'Filial não encontrada para a empresa informada.',
      };
    }

    if (dto.fornecedorId) {
      const validacaoFornecedor = await this.validarFornecedorDaFilial(
        dto.fornecedorId,
        dto.filialId,
      );

      if (!validacaoFornecedor.valido) {
        return { status: 422, message: validacaoFornecedor.mensagem };
      }
    }

    try {
      const compra = await this.prisma.compra.create({
        data: {
          empresaId: dto.empresaId,
          filialId: dto.filialId,
          fornecedorId: dto.fornecedorId,
          dataCompra: dto.dataCompra ? new Date(dto.dataCompra) : undefined,
          status: dto.status,
          observacoes: dto.observacoes,
        },
      });

      return this.findById(compra.id);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        return {
          status: 422,
          message: 'Relacionamento inválido ao criar compra.',
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
    filialId?: string,
    fornecedorId?: string,
    status?: string,
    dataInicio?: string,
    dataFim?: string,
  ): Promise<ResponseJson> {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { id: true },
    });

    if (!empresa) {
      return { status: 422, message: 'Empresa não encontrada.' };
    }

    if (filialId) {
      const filial = await this.prisma.filial.findUnique({
        where: { id: filialId },
        select: { id: true, empresaId: true },
      });

      if (!filial || filial.empresaId !== empresaId) {
        return {
          status: 422,
          message: 'Filial não encontrada para a empresa informada.',
        };
      }
    }

    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, limit);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.CompraWhereInput = {
      empresaId,
      ...(filialId && { filialId }),
      ...(fornecedorId && { fornecedorId }),
      ...(status && { status }),
      ...(dataInicio || dataFim
        ? {
            dataCompra: {
              ...(dataInicio && { gte: new Date(dataInicio) }),
              ...(dataFim && { lte: new Date(dataFim) }),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { status: { contains: search, mode: 'insensitive' } },
              { observacoes: { contains: search, mode: 'insensitive' } },
              {
                fornecedor: {
                  is: {
                    pessoa: {
                      nome: { contains: search, mode: 'insensitive' },
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [compras, total] = await this.prisma.$transaction([
      this.prisma.compra.findMany({
        skip,
        take: limitNumber,
        where,
        include: {
          filial: {
            select: {
              id: true,
              nome: true,
            },
          },
          fornecedor: {
            select: {
              id: true,
              pessoa: {
                select: {
                  id: true,
                  nome: true,
                  cpf: true,
                },
              },
            },
          },
        },
        orderBy: { dataCompra: 'desc' },
      }),
      this.prisma.compra.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Compras listadas com sucesso.',
      data: {
        shopping: compras.map((compra) => this.mapResumo(compra)),
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
    const compra = await this.prisma.compra.findUnique({
      where: { id },
      include: {
        filial: {
          select: {
            id: true,
            nome: true,
          },
        },
        fornecedor: {
          select: {
            id: true,
            pessoa: {
              select: {
                id: true,
                nome: true,
                cpf: true,
              },
            },
          },
        },
        itens: {
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
        },
      },
    });

    if (!compra) {
      return { status: 422, message: 'Compra não encontrada.' };
    }

    return {
      status: 200,
      message: 'Compra encontrada.',
      data: {
        ...this.mapResumo(compra),
        filial: compra.filial,
        fornecedor: compra.fornecedor,
        itens: compra.itens,
      },
    };
  }

  async update(id: string, dto: UpdateCompraDto): Promise<ResponseJson> {
    const compra = await this.prisma.compra.findUnique({
      where: { id },
      select: {
        id: true,
        filialId: true,
      },
    });

    if (!compra) {
      return { status: 422, message: 'Compra não encontrada.' };
    }

    if (dto.fornecedorId) {
      const validacaoFornecedor = await this.validarFornecedorDaFilial(
        dto.fornecedorId,
        compra.filialId,
      );

      if (!validacaoFornecedor.valido) {
        return { status: 422, message: validacaoFornecedor.mensagem };
      }
    }

    await this.prisma.compra.update({
      where: { id },
      data: {
        fornecedorId: dto.fornecedorId,
        dataCompra: dto.dataCompra ? new Date(dto.dataCompra) : undefined,
        status: dto.status,
        observacoes: dto.observacoes,
      },
    });

    return this.findById(id);
  }

  async deleteById(id: string): Promise<ResponseJson> {
    const compra = await this.prisma.compra.findUnique({
      where: { id },
      select: {
        id: true,
        itens: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!compra) {
      return { status: 422, message: 'Compra não encontrada.' };
    }

    if (compra.itens.length > 0) {
      return {
        status: 400,
        message: 'Não é possível excluir compra com itens vinculados.',
      };
    }

    await this.prisma.compra.delete({
      where: { id },
    });

    return {
      status: 200,
      message: 'Compra deletada com sucesso.',
    };
  }

  private mapResumo(compra: CompraResumo): CompraResumo {
    return {
      id: compra.id,
      empresaId: compra.empresaId,
      filialId: compra.filialId,
      fornecedorId: compra.fornecedorId,
      dataCompra: compra.dataCompra,
      status: compra.status,
      valor_total: compra.valor_total,
      observacoes: compra.observacoes,
      createdAt: compra.createdAt,
      updatedAt: compra.updatedAt,
    };
  }

  private async validarFornecedorDaFilial(
    fornecedorId: string,
    filialId: string,
  ): Promise<{ valido: boolean; mensagem: string }> {
    const fornecedor = await this.prisma.fornecedor.findUnique({
      where: { id: fornecedorId },
      select: {
        id: true,
        pessoa: {
          select: {
            filialId: true,
          },
        },
      },
    });

    if (!fornecedor) {
      return {
        valido: false,
        mensagem: 'Fornecedor não encontrado.',
      };
    }

    if (fornecedor.pessoa.filialId !== filialId) {
      return {
        valido: false,
        mensagem: 'Fornecedor não pertence à filial informada.',
      };
    }

    return {
      valido: true,
      mensagem: '',
    };
  }
}
