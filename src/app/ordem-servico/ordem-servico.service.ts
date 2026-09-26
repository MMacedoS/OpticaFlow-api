import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma, StatusOrdemServico } from '@prisma/client';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateOrdemServicoDto,
  UpdateOrdemServicoDto,
} from './dto/ordem-servico.dto';
import {
  EscopoOrdemServico,
  OrdemServicoItemResumo,
  OrdemServicoResumo,
} from './interfaces/ordem-servico.interface';

@Injectable()
export class OrdemServicoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateOrdemServicoDto,
    escopo: EscopoOrdemServico,
  ): Promise<ResponseJson> {
    const filialId = dto.filialId ?? escopo.filialId;
    const { empresaId } = escopo;

    if (!filialId) {
      throw new BadRequestException('Informe a filial da ordem de servico.');
    }

    const filial = await this.prisma.filial.findUnique({
      where: { id: filialId },
      select: { id: true, empresaId: true },
    });

    if (!filial || filial.empresaId !== empresaId) {
      throw new UnprocessableEntityException(
        'Filial nao encontrada para a empresa informada.',
      );
    }

    if (dto.clienteId) {
      await this.validarClienteDaFilial(dto.clienteId, filialId);
    }

    if (dto.laboratorioId) {
      await this.validarLaboratorioDaEmpresa(dto.laboratorioId, empresaId);
    }

    if (dto.atendimentoId) {
      await this.validarAtendimentoDaOrdemServico(
        dto.atendimentoId,
        empresaId,
        filialId,
        dto.clienteId,
      );
    }

    for (const item of dto.itens ?? []) {
      if (!item.produtoId && !item.descricao_servico) {
        throw new BadRequestException(
          'Cada item deve conter produtoId ou descricao_servico.',
        );
      }

      if (item.produtoId) {
        const produto = await this.prisma.produto.findUnique({
          where: { id: item.produtoId },
          select: { id: true, empresaId: true },
        });

        if (!produto || produto.empresaId !== empresaId) {
          throw new UnprocessableEntityException(
            `Produto ${item.produtoId} nao encontrado para a empresa informada.`,
          );
        }
      }
    }

    try {
      const ordemServico = await this.prisma.$transaction(async (tx) => {
        const ordem = await tx.ordemServico.create({
          data: {
            empresaId,
            filialId,
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
          select: { id: true },
        });

        if (dto.itens && dto.itens.length > 0) {
          await tx.ordemServicoItem.createMany({
            data: dto.itens.map((item) => ({
              ordemServicoId: ordem.id,
              produtoId: item.produtoId,
              descricao_servico: item.descricao_servico,
              quantidade: item.quantidade,
              valor_unitario: item.valor_unitario,
              desconto: item.desconto,
            })),
          });

          const valorTotal = dto.itens.reduce((acc, item) => {
            const subtotal =
              item.quantidade * item.valor_unitario - (item.desconto ?? 0);
            return acc + Math.max(0, subtotal);
          }, 0);

          await tx.ordemServico.update({
            where: { id: ordem.id },
            data: { valor_total: valorTotal },
          });
        }

        return ordem;
      });

      return this.findById(ordemServico.id, empresaId);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new UnprocessableEntityException(
          'Relacionamento invalido ao criar ordem de servico.',
        );
      }

      throw error;
    }
  }

  async findAll(
    { empresaId, filialId }: EscopoOrdemServico,
    page: number = 1,
    limit: number = 10,
    search: string = '',
    clienteId?: string,
    atendimentoId?: string,
    laboratorioId?: string,
    status?: string,
    dataInicio?: string,
    dataFim?: string,
  ): Promise<ResponseJson> {
    const statusFiltro = status
      ? this.normalizarStatusOrdemServico(status)
      : undefined;

    if (status && !statusFiltro) {
      throw new BadRequestException('Status de ordem de servico invalido.');
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
              {
                atendimento: {
                  is: {
                    paciente: {
                      nome: { contains: search, mode: 'insensitive' },
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const ordemInclude = {
      filial: { select: { id: true, nome: true } },
      empresa: { select: { id: true, nome: true } },
      cliente: {
        select: {
          id: true,
          numero_convenio: true,
          pessoa: {
            select: {
              id: true,
              nome: true,
              email: true,
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
          queixa_principal: true,
          paciente: {
            select: {
              id: true,
              nome: true,
              email: true,
              cpf: true,
            },
          },
          profissional: {
            select: {
              id: true,
              email: true,
              username: true,
              pessoa: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
          convenio: {
            select: {
              id: true,
              nome: true,
              registro: true,
            },
          },
        },
      },
      laboratorio: { select: { id: true, nome: true, cnpj: true } },
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
        orderBy: { id: 'asc' as const },
      },
    };

    const [ordens, total] = await this.prisma.$transaction([
      this.prisma.ordemServico.findMany({
        skip,
        take: limitNumber,
        where,
        include: ordemInclude,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ordemServico.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Ordens de servico listadas com sucesso.',
      data: {
        orders: ordens.map((ordem) => this.mapResumo(ordem as any)),
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber),
        },
      },
    };
  }

  async findById(id: string, empresaId: string): Promise<ResponseJson> {
    const ordemServico = await this.prisma.ordemServico.findFirst({
      where: { id, empresaId },
      include: {
        filial: { select: { id: true, nome: true } },
        empresa: { select: { id: true, nome: true } },
        cliente: {
          select: {
            id: true,
            numero_convenio: true,
            pessoa: {
              select: {
                id: true,
                nome: true,
                email: true,
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
            queixa_principal: true,
            paciente: {
              select: {
                id: true,
                nome: true,
                email: true,
                cpf: true,
              },
            },
            profissional: {
              select: {
                id: true,
                email: true,
                username: true,
                pessoa: {
                  select: {
                    id: true,
                    nome: true,
                  },
                },
              },
            },
            convenio: {
              select: {
                id: true,
                nome: true,
                registro: true,
              },
            },
          },
        },
        laboratorio: { select: { id: true, nome: true, cnpj: true } },
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
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!ordemServico) {
      throw new NotFoundException('Ordem de servico nao encontrada.');
    }

    return {
      status: 200,
      message: 'Ordem de servico encontrada.',
      data: this.mapResumo(ordemServico as any),
    };
  }

  async update(
    id: string,
    dto: UpdateOrdemServicoDto,
    empresaId: string,
  ): Promise<ResponseJson> {
    const ordemServico = await this.prisma.ordemServico.findFirst({
      where: { id, empresaId },
      select: {
        id: true,
        empresaId: true,
        filialId: true,
        clienteId: true,
      },
    });

    if (!ordemServico) {
      throw new NotFoundException('Ordem de servico nao encontrada.');
    }

    const clienteDestino = dto.clienteId ?? ordemServico.clienteId ?? undefined;

    if (dto.clienteId) {
      await this.validarClienteDaFilial(dto.clienteId, ordemServico.filialId);
    }

    if (dto.laboratorioId) {
      await this.validarLaboratorioDaEmpresa(
        dto.laboratorioId,
        ordemServico.empresaId,
      );
    }

    if (dto.atendimentoId) {
      await this.validarAtendimentoDaOrdemServico(
        dto.atendimentoId,
        ordemServico.empresaId,
        ordemServico.filialId,
        clienteDestino,
      );
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

    return this.findById(id, empresaId);
  }

  async deleteById(id: string, empresaId: string): Promise<ResponseJson> {
    const ordemServico = await this.prisma.ordemServico.findFirst({
      where: { id, empresaId },
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
      throw new NotFoundException('Ordem de servico nao encontrada.');
    }

    if (ordemServico.itens.length > 0) {
      throw new ConflictException(
        'Nao e possivel excluir ordem de servico com itens vinculados.',
      );
    }

    await this.prisma.ordemServico.delete({
      where: { id },
    });

    return {
      status: 200,
      message: 'Ordem de servico deletada com sucesso.',
    };
  }

  private mapResumo(ordemServico: any): OrdemServicoResumo {
    const mapItem = (item: any): OrdemServicoItemResumo => ({
      id: item.id,
      ordemServicoId: item.ordemServicoId,
      produtoId: item.produtoId ?? null,
      descricao_servico: item.descricao_servico ?? null,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
      desconto: item.desconto ?? null,
      subtotal: Math.max(
        0,
        item.quantidade * item.valor_unitario - (item.desconto ?? 0),
      ),
      produto: item.produto ?? null,
    });

    return {
      id: ordemServico.id,
      empresaId: ordemServico.empresaId,
      filialId: ordemServico.filialId,
      atendimentoId: ordemServico.atendimentoId ?? null,
      clienteId: ordemServico.clienteId ?? null,
      laboratorioId: ordemServico.laboratorioId ?? null,
      numero: ordemServico.numero ?? null,
      status: ordemServico.status,
      descricao: ordemServico.descricao ?? null,
      previsao_entrega: ordemServico.previsao_entrega ?? null,
      data_entrega:
        ordemServico.data_entrega ??
        ordemServico.atendimento?.dataAtendimento ??
        null,
      valor_total: ordemServico.valor_total,
      createdAt: ordemServico.createdAt,
      updatedAt: ordemServico.updatedAt,
      filial: ordemServico.filial ?? null,
      empresa: {
        id: ordemServico.empresaId,
        nome: ordemServico.empresa?.nome ?? '',
      },
      cliente: ordemServico.cliente ?? null,
      atendimento: ordemServico.atendimento ?? null,
      laboratorio: ordemServico.laboratorio ?? null,
      itens: Array.isArray(ordemServico.itens)
        ? ordemServico.itens.map(mapItem)
        : [],
    };
  }

  private async validarClienteDaFilial(
    clienteId: string,
    filialId: string,
  ): Promise<void> {
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
      throw new NotFoundException('Cliente nao encontrado.');
    }

    if (cliente.pessoa.filialId !== filialId) {
      throw new UnprocessableEntityException(
        'Cliente nao pertence a filial informada.',
      );
    }
  }

  private async validarLaboratorioDaEmpresa(
    laboratorioId: string,
    empresaId: string,
  ): Promise<void> {
    const laboratorio = await this.prisma.laboratorio.findUnique({
      where: { id: laboratorioId },
      select: {
        id: true,
        empresaId: true,
      },
    });

    if (!laboratorio) {
      throw new NotFoundException('Laboratorio nao encontrado.');
    }

    if (laboratorio.empresaId !== empresaId) {
      throw new UnprocessableEntityException(
        'Laboratorio nao pertence a empresa informada.',
      );
    }
  }

  private async validarAtendimentoDaOrdemServico(
    atendimentoId: string,
    empresaId: string,
    filialId: string,
    clienteId?: string,
  ): Promise<void> {
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
      throw new NotFoundException('Atendimento nao encontrado.');
    }

    if (
      atendimento.empresaId !== empresaId ||
      atendimento.filialId !== filialId
    ) {
      throw new UnprocessableEntityException(
        'Atendimento nao pertence a empresa/filial informada.',
      );
    }

    if (
      clienteId &&
      atendimento.clienteId &&
      atendimento.clienteId !== clienteId
    ) {
      throw new UnprocessableEntityException(
        'Atendimento informado pertence a outro cliente.',
      );
    }
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
