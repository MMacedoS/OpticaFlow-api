import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateVendaDto, UpdateVendaDto } from './dto/venda.dto';
import { VendaResumo } from './interfaces/venda.interface';

@Injectable()
export class VendaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVendaDto): Promise<ResponseJson> {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: dto.empresaId },
      select: { id: true },
    });

    if (!empresa) {
      return { status: 422, message: 'Empresa nao encontrada.' };
    }

    const filial = await this.prisma.filial.findUnique({
      where: { id: dto.filialId },
      select: { id: true, empresaId: true },
    });

    if (!filial || filial.empresaId !== dto.empresaId) {
      return {
        status: 422,
        message: 'Filial nao encontrada para a empresa informada.',
      };
    }

    if (dto.clienteId) {
      const validacaoCliente = await this.validarClienteDaFilial(
        dto.clienteId,
        dto.filialId,
      );

      if (!validacaoCliente.valido) {
        return { status: 422, message: validacaoCliente.mensagem };
      }
    }

    if (dto.atendimentoId) {
      const validacaoAtendimento = await this.validarAtendimentoDaVenda(
        dto.atendimentoId,
        dto.empresaId,
        dto.filialId,
        dto.clienteId,
      );

      if (!validacaoAtendimento.valido) {
        return { status: 422, message: validacaoAtendimento.mensagem };
      }
    }

    try {
      const venda = await this.prisma.venda.create({
        data: {
          empresaId: dto.empresaId,
          filialId: dto.filialId,
          clienteId: dto.clienteId,
          atendimentoId: dto.atendimentoId,
          dataVenda: dto.dataVenda ? new Date(dto.dataVenda) : undefined,
          status: dto.status,
          observacoes: dto.observacoes,
        },
      });

      return this.findById(venda.id);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        return {
          status: 422,
          message: 'Relacionamento invalido ao criar venda.',
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
    clienteId?: string,
    atendimentoId?: string,
    status?: string,
    dataInicio?: string,
    dataFim?: string,
  ): Promise<ResponseJson> {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { id: true },
    });

    if (!empresa) {
      return { status: 422, message: 'Empresa nao encontrada.' };
    }

    if (filialId) {
      const filial = await this.prisma.filial.findUnique({
        where: { id: filialId },
        select: { id: true, empresaId: true },
      });

      if (!filial || filial.empresaId !== empresaId) {
        return {
          status: 422,
          message: 'Filial nao encontrada para a empresa informada.',
        };
      }
    }

    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, limit);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.VendaWhereInput = {
      empresaId,
      ...(filialId && { filialId }),
      ...(clienteId && { clienteId }),
      ...(atendimentoId && { atendimentoId }),
      ...(status && { status }),
      ...(dataInicio || dataFim
        ? {
            dataVenda: {
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
                cliente: {
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

    const [vendas, total] = await this.prisma.$transaction([
      this.prisma.venda.findMany({
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
          cliente: {
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
          atendimento: {
            select: {
              id: true,
              dataAtendimento: true,
              status: true,
            },
          },
        },
        orderBy: { dataVenda: 'desc' },
      }),
      this.prisma.venda.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Vendas listadas com sucesso.',
      data: vendas.map((venda) => this.mapResumo(venda)),
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async findById(id: string): Promise<ResponseJson> {
    const venda = await this.prisma.venda.findUnique({
      where: { id },
      include: {
        filial: {
          select: {
            id: true,
            nome: true,
          },
        },
        cliente: {
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
        atendimento: {
          select: {
            id: true,
            dataAtendimento: true,
            status: true,
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

    if (!venda) {
      return { status: 422, message: 'Venda nao encontrada.' };
    }

    return {
      status: 200,
      message: 'Venda encontrada.',
      data: {
        ...this.mapResumo(venda),
        filial: venda.filial,
        cliente: venda.cliente,
        atendimento: venda.atendimento,
        itens: venda.itens,
      },
    };
  }

  async update(id: string, dto: UpdateVendaDto): Promise<ResponseJson> {
    const venda = await this.prisma.venda.findUnique({
      where: { id },
      select: {
        id: true,
        empresaId: true,
        filialId: true,
        clienteId: true,
      },
    });

    if (!venda) {
      return { status: 422, message: 'Venda nao encontrada.' };
    }

    const clienteDestino = dto.clienteId ?? venda.clienteId ?? undefined;

    if (dto.clienteId) {
      const validacaoCliente = await this.validarClienteDaFilial(
        dto.clienteId,
        venda.filialId,
      );

      if (!validacaoCliente.valido) {
        return { status: 422, message: validacaoCliente.mensagem };
      }
    }

    if (dto.atendimentoId) {
      const validacaoAtendimento = await this.validarAtendimentoDaVenda(
        dto.atendimentoId,
        venda.empresaId,
        venda.filialId,
        clienteDestino,
      );

      if (!validacaoAtendimento.valido) {
        return { status: 422, message: validacaoAtendimento.mensagem };
      }
    }

    await this.prisma.venda.update({
      where: { id },
      data: {
        clienteId: dto.clienteId,
        atendimentoId: dto.atendimentoId,
        dataVenda: dto.dataVenda ? new Date(dto.dataVenda) : undefined,
        status: dto.status,
        observacoes: dto.observacoes,
      },
    });

    return this.findById(id);
  }

  async deleteById(id: string): Promise<ResponseJson> {
    const venda = await this.prisma.venda.findUnique({
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

    if (!venda) {
      return { status: 422, message: 'Venda nao encontrada.' };
    }

    if (venda.itens.length > 0) {
      return {
        status: 400,
        message: 'Nao e possivel excluir venda com itens vinculados.',
      };
    }

    await this.prisma.venda.delete({
      where: { id },
    });

    return {
      status: 200,
      message: 'Venda deletada com sucesso.',
    };
  }

  private mapResumo(venda: VendaResumo): VendaResumo {
    return {
      id: venda.id,
      empresaId: venda.empresaId,
      filialId: venda.filialId,
      clienteId: venda.clienteId,
      atendimentoId: venda.atendimentoId,
      dataVenda: venda.dataVenda,
      status: venda.status,
      valor_total: venda.valor_total,
      observacoes: venda.observacoes,
      createdAt: venda.createdAt,
      updatedAt: venda.updatedAt,
    };
  }

  private async validarClienteDaFilial(
    clienteId: string,
    filialId: string,
  ): Promise<{ valido: boolean; mensagem: string }> {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        pessoa: {
          select: {
            filialId: true,
          },
        },
      },
    });

    if (!cliente) {
      return {
        valido: false,
        mensagem: 'Cliente nao encontrado.',
      };
    }

    if (cliente.pessoa.filialId !== filialId) {
      return {
        valido: false,
        mensagem: 'Cliente nao pertence a filial informada.',
      };
    }

    return {
      valido: true,
      mensagem: '',
    };
  }

  private async validarAtendimentoDaVenda(
    atendimentoId: string,
    empresaId: string,
    filialId: string,
    clienteId?: string,
  ): Promise<{ valido: boolean; mensagem: string }> {
    const atendimento = await this.prisma.atendimento.findUnique({
      where: { id: atendimentoId },
      select: {
        id: true,
        empresaId: true,
        filialId: true,
        clienteId: true,
      },
    });

    if (!atendimento) {
      return {
        valido: false,
        mensagem: 'Atendimento nao encontrado.',
      };
    }

    if (
      atendimento.empresaId !== empresaId ||
      atendimento.filialId !== filialId
    ) {
      return {
        valido: false,
        mensagem: 'Atendimento nao pertence a empresa/filial informada.',
      };
    }

    if (
      clienteId &&
      atendimento.clienteId &&
      atendimento.clienteId !== clienteId
    ) {
      return {
        valido: false,
        mensagem: 'Atendimento informado pertence a outro cliente.',
      };
    }

    return {
      valido: true,
      mensagem: '',
    };
  }
}
