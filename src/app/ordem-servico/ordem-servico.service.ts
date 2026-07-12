import { Injectable } from '@nestjs/common';
import { Prisma, StatusOrdemServico } from '@prisma/client';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateOrdemServicoDto,
  UpdateOrdemServicoDto,
} from './dto/ordem-servico.dto';
import { OrdemServicoResumo } from './interfaces/ordem-servico.interface';

@Injectable()
export class OrdemServicoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrdemServicoDto): Promise<ResponseJson> {
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

    if (dto.laboratorioId) {
      const validacaoLaboratorio = await this.validarLaboratorioDaEmpresa(
        dto.laboratorioId,
        dto.empresaId,
      );

      if (!validacaoLaboratorio.valido) {
        return { status: 422, message: validacaoLaboratorio.mensagem };
      }
    }

    if (dto.atendimentoId) {
      const validacaoAtendimento = await this.validarAtendimentoDaOrdemServico(
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
      const ordemServico = await this.prisma.ordemServico.create({
        data: {
          empresaId: dto.empresaId,
          filialId: dto.filialId,
          atendimentoId: dto.atendimentoId,
          clienteId: dto.clienteId,
          laboratorioId: dto.laboratorioId,
          numero: dto.numero,
          status: dto.status,
          descricao: dto.descricao,
          previsao_entrega: dto.previsao_entrega
            ? new Date(dto.previsao_entrega)
            : undefined,
          data_entrega: dto.data_entrega
            ? new Date(dto.data_entrega)
            : undefined,
        },
      });

      return this.findById(ordemServico.id);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        return {
          status: 422,
          message: 'Relacionamento invalido ao criar ordem de servico.',
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
    laboratorioId?: string,
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

    const statusFiltro = status
      ? this.normalizarStatusOrdemServico(status)
      : undefined;

    if (status && !statusFiltro) {
      return {
        status: 422,
        message: 'Status de ordem de servico invalido.',
      };
    }

    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, limit);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.OrdemServicoWhereInput = {
      empresaId,
      ...(filialId && { filialId }),
      ...(clienteId && { clienteId }),
      ...(atendimentoId && { atendimentoId }),
      ...(laboratorioId && { laboratorioId }),
      ...(statusFiltro && { status: statusFiltro }),
      ...(dataInicio || dataFim
        ? {
            createdAt: {
              ...(dataInicio && { gte: new Date(dataInicio) }),
              ...(dataFim && { lte: new Date(dataFim) }),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { numero: { contains: search, mode: 'insensitive' } },
              { descricao: { contains: search, mode: 'insensitive' } },
              {
                cliente: {
                  is: {
                    pessoa: {
                      nome: { contains: search, mode: 'insensitive' },
                    },
                  },
                },
              },
              {
                laboratorio: {
                  is: {
                    nome: { contains: search, mode: 'insensitive' },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [ordens, total] = await this.prisma.$transaction([
      this.prisma.ordemServico.findMany({
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
          laboratorio: {
            select: {
              id: true,
              nome: true,
              cnpj: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ordemServico.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Ordens de servico listadas com sucesso.',
      data: {
        orders: ordens.map((ordem) => this.mapResumo(ordem)),
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
    const ordemServico = await this.prisma.ordemServico.findUnique({
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
        laboratorio: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
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

    if (!ordemServico) {
      return { status: 422, message: 'Ordem de servico nao encontrada.' };
    }

    return {
      status: 200,
      message: 'Ordem de servico encontrada.',
      data: {
        ...this.mapResumo(ordemServico),
        filial: ordemServico.filial,
        cliente: ordemServico.cliente,
        atendimento: ordemServico.atendimento,
        laboratorio: ordemServico.laboratorio,
        itens: ordemServico.itens,
      },
    };
  }

  async update(id: string, dto: UpdateOrdemServicoDto): Promise<ResponseJson> {
    const ordemServico = await this.prisma.ordemServico.findUnique({
      where: { id },
      select: {
        id: true,
        empresaId: true,
        filialId: true,
        clienteId: true,
      },
    });

    if (!ordemServico) {
      return { status: 422, message: 'Ordem de servico nao encontrada.' };
    }

    const clienteDestino = dto.clienteId ?? ordemServico.clienteId ?? undefined;

    if (dto.clienteId) {
      const validacaoCliente = await this.validarClienteDaFilial(
        dto.clienteId,
        ordemServico.filialId,
      );

      if (!validacaoCliente.valido) {
        return { status: 422, message: validacaoCliente.mensagem };
      }
    }

    if (dto.laboratorioId) {
      const validacaoLaboratorio = await this.validarLaboratorioDaEmpresa(
        dto.laboratorioId,
        ordemServico.empresaId,
      );

      if (!validacaoLaboratorio.valido) {
        return { status: 422, message: validacaoLaboratorio.mensagem };
      }
    }

    if (dto.atendimentoId) {
      const validacaoAtendimento = await this.validarAtendimentoDaOrdemServico(
        dto.atendimentoId,
        ordemServico.empresaId,
        ordemServico.filialId,
        clienteDestino,
      );

      if (!validacaoAtendimento.valido) {
        return { status: 422, message: validacaoAtendimento.mensagem };
      }
    }

    await this.prisma.ordemServico.update({
      where: { id },
      data: {
        atendimentoId: dto.atendimentoId,
        clienteId: dto.clienteId,
        laboratorioId: dto.laboratorioId,
        numero: dto.numero,
        status: dto.status,
        descricao: dto.descricao,
        previsao_entrega: dto.previsao_entrega
          ? new Date(dto.previsao_entrega)
          : undefined,
        data_entrega: dto.data_entrega ? new Date(dto.data_entrega) : undefined,
      },
    });

    return this.findById(id);
  }

  async deleteById(id: string): Promise<ResponseJson> {
    const ordemServico = await this.prisma.ordemServico.findUnique({
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

    if (!ordemServico) {
      return { status: 422, message: 'Ordem de servico nao encontrada.' };
    }

    if (ordemServico.itens.length > 0) {
      return {
        status: 400,
        message:
          'Nao e possivel excluir ordem de servico com itens vinculados.',
      };
    }

    await this.prisma.ordemServico.delete({
      where: { id },
    });

    return {
      status: 200,
      message: 'Ordem de servico deletada com sucesso.',
    };
  }

  private mapResumo(ordemServico: OrdemServicoResumo): OrdemServicoResumo {
    return {
      id: ordemServico.id,
      empresaId: ordemServico.empresaId,
      filialId: ordemServico.filialId,
      atendimentoId: ordemServico.atendimentoId,
      clienteId: ordemServico.clienteId,
      laboratorioId: ordemServico.laboratorioId,
      numero: ordemServico.numero,
      status: ordemServico.status,
      descricao: ordemServico.descricao,
      previsao_entrega: ordemServico.previsao_entrega,
      data_entrega: ordemServico.data_entrega,
      valor_total: ordemServico.valor_total,
      createdAt: ordemServico.createdAt,
      updatedAt: ordemServico.updatedAt,
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

  private async validarLaboratorioDaEmpresa(
    laboratorioId: string,
    empresaId: string,
  ): Promise<{ valido: boolean; mensagem: string }> {
    const laboratorio = await this.prisma.laboratorio.findUnique({
      where: { id: laboratorioId },
      select: {
        id: true,
        empresaId: true,
      },
    });

    if (!laboratorio) {
      return {
        valido: false,
        mensagem: 'Laboratorio nao encontrado.',
      };
    }

    if (laboratorio.empresaId !== empresaId) {
      return {
        valido: false,
        mensagem: 'Laboratorio nao pertence a empresa informada.',
      };
    }

    return {
      valido: true,
      mensagem: '',
    };
  }

  private async validarAtendimentoDaOrdemServico(
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

  private normalizarStatusOrdemServico(
    status?: string,
  ): StatusOrdemServico | undefined {
    if (!status) {
      return undefined;
    }

    if ((Object.values(StatusOrdemServico) as string[]).includes(status)) {
      return status as StatusOrdemServico;
    }

    return undefined;
  }
}
