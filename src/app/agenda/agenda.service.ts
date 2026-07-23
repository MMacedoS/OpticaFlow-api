import { Injectable } from '@nestjs/common';
import { Prisma, StatusAgenda, StatusAtendimento } from '@prisma/client';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAgendaDto, UpdateAgendaDto } from './dto/agenda.dto';
import { prepareNumeroOrdemServico } from 'src/utils/validator';

@Injectable()
export class AgendaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAgendaDto): Promise<ResponseJson> {
    const filial = await this.prisma.filial.findUnique({
      where: { id: dto.filialId },
      select: { id: true, empresaId: true },
    });

    if (!filial || !filial.empresaId) {
      return {
        status: 422,
        message: 'Filial não encontrada para a empresa informada.',
      };
    }

    if (dto.profissionalId) {
      const validacaoProfissional = await this.validarProfissional(
        dto.profissionalId,
        filial.empresaId,
        filial.id,
      );

      if (!validacaoProfissional.valido) {
        return {
          status: 422,
          message: validacaoProfissional.mensagem,
        };
      }
    }

    try {
      const resultadoTransacao = await this.prisma.$transaction(async (tx) => {
        const agenda = await tx.agenda.create({
          data: {
            empresaId: filial.empresaId,
            filialId: filial.id,
            pessoaId: dto.pessoaId ?? null,
            profissionalId: dto.profissionalId,
            dataHora: new Date(dto.dataHora),
            duracaoMin: dto.duracaoMin,
            status: dto.status,
            observacao: dto.observacao,
          },
        });

        if (dto.profissionalId && dto.pessoaId) {
          const atendimento = await tx.atendimento.create({
            data: {
              empresaId: filial.empresaId,
              filialId: filial.id,
              agendaId: agenda.id,
              pacienteId: dto.pessoaId,
              profissionalId: dto.profissionalId,
              convenioId: dto.convenioId,
              clienteId: dto.clienteId || null,
              dataAtendimento: new Date(dto.dataHora),
              status: StatusAtendimento.em_espera,
              queixa_principal: dto.queixa_principal,
            },
          });

          if (!dto.ordemServico) {
            return { agenda };
          }

          const ordemServico = await tx.ordemServico.create({
            data: {
              empresaId: filial.empresaId,
              filialId: filial.id,
              clienteId: dto.clienteId || null,
              atendimentoId: atendimento?.id || null,

              numero: prepareNumeroOrdemServico(),
              status: dto.ordemServico.status,
              valor_total: dto.ordemServico.valor_total ?? 0,
              descricao: dto.ordemServico.descricao,
            },
          });

          if (dto.ordemServico.itens && dto.ordemServico.itens.length > 0) {
            await tx.ordemServicoItem.createMany({
              data: dto.ordemServico.itens.map((item) => ({
                ordemServicoId: ordemServico.id,
                produtoId: item.produtoId || null,
                descricao_servico: item.descricao_servico || null,
                quantidade: item.quantidade,
                valor_unitario: item.valor_unitario,
                desconto: item.desconto || 0,
              })),
            });
          }

          const ordemServicoCompleta = await tx.ordemServico.findUnique({
            where: { id: ordemServico.id },
            include: { itens: true },
          });
        }

        return {
          agenda,
        };
      });

      return {
        status: 201,
        message: 'Agenda e Ordem de Serviço criadas com sucesso.',
        data: resultadoTransacao,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        return {
          status: 422,
          message: 'Relacionamento inválido ao criar registros no sistema.',
        };
      }

      throw error;
    }
  }

  async findAllByFilial(
    filialId: string,
    page: number = 1,
    limit: number = 10,
    search: string = '',
    status?: StatusAgenda,
    profissionalId?: string,
    dataInicio?: string,
    dataFim?: string,
  ): Promise<ResponseJson> {
    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, limit);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.AgendaWhereInput = {
      filialId,
      ...(status && { status }),
      ...(profissionalId && { profissionalId }),
      ...(dataInicio || dataFim
        ? {
            dataHora: {
              ...(dataInicio && { gte: new Date(dataInicio) }),
              ...(dataFim && { lte: new Date(dataFim) }),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              {
                pessoa: {
                  is: {
                    nome: { contains: search, mode: 'insensitive' },
                  },
                },
              },
              {
                profissional: {
                  is: {
                    pessoa: {
                      is: {
                        nome: { contains: search, mode: 'insensitive' },
                      },
                    },
                  },
                },
              },
              {
                observacao: { contains: search, mode: 'insensitive' },
              },
            ],
          }
        : {}),
    };

    const agendas = await this.prisma.agenda.findMany({
      skip,
      take: limitNumber,
      where,
      include: {
        pessoa: {
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
                optometrista: {
                  select: { id: true },
                },
                oftalmologista: {
                  select: { id: true },
                },
              },
            },
          },
        },
        atendimento: {
          select: {
            id: true,
            status: true,
            clienteId: true,
            cliente: {
              select: {
                id: true,
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
            ordens_servico: {
              skip: 0,
              take: 1,
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                status: true,
                valor_total: true,
                descricao: true,
                itens: {
                  select: {
                    id: true,
                    produtoId: true,
                    descricao_servico: true,
                    quantidade: true,
                    valor_unitario: true,
                    desconto: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        dataHora: 'asc',
      },
    });

    return {
      status: 200,
      message: 'Agendas encontradas.',
      data: {
        events: agendas.map((agenda) => {
          const os = agenda.atendimento?.ordens_servico?.[0] || null;
          return {
            id: agenda.id,
            empresaId: agenda.empresaId,
            filialId: agenda.filialId,
            pessoaId: agenda.pessoaId,
            profissionalId: agenda.profissionalId,
            dataHora: agenda.dataHora,
            duracaoMin: agenda.duracaoMin,
            status: agenda.status,
            observacao: agenda.observacao,
            createdAt: agenda.createdAt,
            clienteId: agenda.atendimento?.clienteId || null,
            updatedAt: agenda.updatedAt,
            paciente: agenda.pessoa
              ? {
                  id: agenda.pessoa.id,
                  nome: agenda.pessoa.nome,
                  email: agenda.pessoa.email,
                  cpf: agenda.pessoa.cpf,
                }
              : null,
            cliente: agenda.atendimento?.cliente
              ? {
                  id: agenda.atendimento.cliente.id,
                  pessoa: agenda.atendimento.cliente.pessoa
                    ? {
                        id: agenda.atendimento.cliente.pessoa.id,
                        nome: agenda.atendimento.cliente.pessoa.nome,
                        email: agenda.atendimento.cliente.pessoa.email,
                        cpf: agenda.atendimento.cliente.pessoa.cpf,
                      }
                    : null,
                }
              : null,
            profissional: agenda.profissional
              ? {
                  id: agenda.profissional.id,
                  email: agenda.profissional.email,
                  username: agenda.profissional.username,
                  pessoa: agenda.profissional.pessoa
                    ? {
                        id: agenda.profissional.pessoa.id,
                        nome: agenda.profissional.pessoa.nome,
                        tipo: agenda.profissional.pessoa.oftalmologista
                          ? 'oftalmologista'
                          : agenda.profissional.pessoa.optometrista
                            ? 'optometrista'
                            : 'nao_definido',
                      }
                    : null,
                }
              : null,
            ordemServico: os
              ? {
                  id: os.id,
                  status: os.status,
                  valor_total: os.valor_total,
                  descricao: os.descricao,
                  itens: os.itens.map((item) => ({
                    id: item.id,
                    produtoId: item.produtoId,
                    descricao_servico: item.descricao_servico,
                    quantidade: item.quantidade,
                    valor_unitario: item.valor_unitario,
                    desconto: item.desconto,
                  })),
                }
              : null,
          };
        }),
      },
    };
  }

  async findById(id: string): Promise<ResponseJson> {
    const agenda = await this.prisma.agenda.findUnique({
      where: { id },
      include: {
        pessoa: {
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
                optometrista: {
                  select: { id: true },
                },
                oftalmologista: {
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });

    if (!agenda) {
      return { status: 422, message: 'Agenda não encontrada.' };
    }

    return {
      status: 200,
      message: 'Agenda encontrada.',
      data: {
        id: agenda.id,
        empresaId: agenda.empresaId,
        filialId: agenda.filialId,
        pessoaId: agenda.pessoaId,
        profissionalId: agenda.profissionalId,
        dataHora: agenda.dataHora,
        duracaoMin: agenda.duracaoMin,
        status: agenda.status,
        observacao: agenda.observacao,
        createdAt: agenda.createdAt,
        updatedAt: agenda.updatedAt,
        paciente: agenda.pessoa,
        profissional: agenda.profissional
          ? {
              id: agenda.profissional.id,
              email: agenda.profissional.email,
              username: agenda.profissional.username,
              pessoa: agenda.profissional.pessoa
                ? {
                    id: agenda.profissional.pessoa.id,
                    nome: agenda.profissional.pessoa.nome,
                    tipo: agenda.profissional.pessoa.oftalmologista
                      ? 'oftalmologista'
                      : agenda.profissional.pessoa.optometrista
                        ? 'optometrista'
                        : 'nao_definido',
                  }
                : null,
            }
          : null,
      },
    };
  }

  async update(dto: UpdateAgendaDto): Promise<ResponseJson> {
    const agendaAtual = await this.prisma.agenda.findUnique({
      where: { id: dto.id },
      select: { filialId: true, empresaId: true },
    });

    if (!agendaAtual) {
      return { status: 422, message: 'Agenda não encontrada.' };
    }

    try {
      const resultadoTransacao = await this.prisma.$transaction(async (tx) => {
        const agenda = await tx.agenda.update({
          where: { id: dto.id },
          data: {
            pessoaId: dto.pessoaId,
            profissionalId: dto.profissionalId,
            dataHora: dto.dataHora ? new Date(dto.dataHora) : undefined,
            duracaoMin: dto.duracaoMin,
            status: dto.status,
            observacao: dto.observacao,
          },
        });

        const atendimentoLink = await tx.atendimento.findFirst({
          where: { agendaId: agenda.id },
          select: { id: true },
        });

        if (atendimentoLink) {
          await tx.atendimento.update({
            where: { id: atendimentoLink.id },
            data: {
              profissionalId: dto.profissionalId,
              dataAtendimento: dto.dataHora
                ? new Date(dto.dataHora)
                : undefined,
              queixa_principal: dto.queixa_principal,
            },
          });
        }

        if (!dto.ordemServico) {
          return { agenda, ordemServico: null };
        }

        const osExistente = atendimentoLink
          ? await tx.ordemServico.findFirst({
              where: { atendimentoId: atendimentoLink.id },
            })
          : null;

        if (osExistente) {
          await tx.ordemServico.update({
            where: { id: osExistente.id },
            data: {
              status: dto.ordemServico.status,
              valor_total: dto.ordemServico.valor_total,
              descricao: dto.ordemServico.descricao,
            },
          });

          return this.atualizarItensESeletarOS(
            tx,
            osExistente.id,
            dto.ordemServico.itens,
          );
        }

        // 4. Se a OS não existe, cria uma nova vinculada ao Atendimento correto
        const novaOS = await tx.ordemServico.create({
          data: {
            empresaId: agendaAtual.empresaId,
            filialId: agendaAtual.filialId,
            clienteId: dto.clienteId || null,
            atendimentoId: atendimentoLink?.id || null, // Vínculo correto pelo schema
            status: dto.ordemServico.status,
            valor_total: dto.ordemServico.valor_total ?? 0,
            descricao: dto.ordemServico.descricao,
          },
        });

        return this.atualizarItensESeletarOS(
          tx,
          novaOS.id,
          dto.ordemServico.itens,
        );
      });

      return {
        status: 200,
        message: 'Agenda e Ordem de Serviço atualizadas com sucesso.',
        data: resultadoTransacao,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        return {
          status: 422,
          message: 'Relacionamento inválido ao atualizar registros.',
        };
      }
      throw error;
    }
  }

  private async atualizarItensESeletarOS(tx: any, osId: string, itens?: any[]) {
    if (itens) {
      await tx.ordemServicoItem.deleteMany({
        where: { ordemServicoId: osId },
      });

      if (itens.length > 0) {
        await tx.ordemServicoItem.createMany({
          data: itens.map((item) => ({
            ordemServicoId: osId,
            produtoId: item.produtoId || null,
            descricao_servico: item.descricao_servico || null,
            quantidade: item.quantidade,
            valor_unitario: item.valor_unitario,
            desconto: item.desconto || 0,
          })),
        });
      }
    }

    return tx.ordemServico.findUnique({
      where: { id: osId },
      include: { itens: true },
    });
  }

  async deleteById(id: string): Promise<ResponseJson> {
    const agenda = await this.prisma.agenda.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!agenda) {
      return { status: 422, message: 'Agenda não encontrada.' };
    }

    await this.prisma.$transaction(async (tx) => {
      const atendimentoLink = await tx.atendimento.findFirst({
        where: { agendaId: agenda.id },
        select: { id: true },
      });

      if (atendimentoLink) {
        const osExistente = await tx.ordemServico.findFirst({
          where: { atendimentoId: atendimentoLink.id },
          select: { id: true },
        });

        if (osExistente) {
          await tx.ordemServicoItem.deleteMany({
            where: { ordemServicoId: osExistente.id },
          });
          await tx.ordemServico.delete({
            where: { id: osExistente.id },
          });
        }

        await tx.atendimento.delete({
          where: { id: atendimentoLink.id },
        });
      }

      await tx.agenda.delete({
        where: { id: agenda.id },
      });
    });

    return { status: 200, message: 'Agenda deletada com sucesso.' };
  }

  private async validarProfissional(
    profissionalId: string,
    empresaId: string,
    filialId: string,
  ): Promise<{ valido: boolean; mensagem: string }> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: profissionalId },
      select: {
        id: true,
        empresaId: true,
        pessoa: {
          select: {
            id: true,
            filialId: true,
            optometrista: {
              select: { id: true },
            },
            oftalmologista: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!usuario) {
      return {
        valido: false,
        mensagem: 'Usuário profissional não encontrado.',
      };
    }

    if (usuario.empresaId !== empresaId) {
      return {
        valido: false,
        mensagem: 'Usuário profissional não pertence à empresa informada.',
      };
    }

    if (!usuario.pessoa || usuario.pessoa.filialId !== filialId) {
      return {
        valido: false,
        mensagem: 'Usuário profissional não pertence à filial informada.',
      };
    }

    const isOftalmologista = Boolean(usuario.pessoa.oftalmologista);
    const isOptometrista = Boolean(usuario.pessoa.optometrista);

    if (!isOftalmologista && !isOptometrista) {
      return {
        valido: false,
        mensagem:
          'Profissional inválido. Informe um usuário vinculado a oftalmologista ou optometrista.',
      };
    }

    return {
      valido: true,
      mensagem: 'Profissional válido.',
    };
  }
}
