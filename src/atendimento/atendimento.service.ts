import { Injectable } from '@nestjs/common';
import { Prisma, StatusAtendimento } from '@prisma/client';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateAtendimentoDto,
  UpdateAtendimentoDto,
} from './dto/atendimento.dto';
import { AtendimentoResumo } from './interfaces/atendimento.interface';

@Injectable()
export class AtendimentoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAtendimentoDto): Promise<ResponseJson> {
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

    const validacaoPaciente = await this.validarPaciente(
      dto.pacienteId,
      dto.filialId,
    );
    if (!validacaoPaciente.valido) {
      return { status: 422, message: validacaoPaciente.mensagem };
    }

    if (dto.profissionalId) {
      const validacaoProfissional = await this.validarProfissional(
        dto.profissionalId,
        dto.empresaId,
        dto.filialId,
      );

      if (!validacaoProfissional.valido) {
        return {
          status: 422,
          message: validacaoProfissional.mensagem,
        };
      }
    }

    if (dto.agendaId) {
      const validacaoAgenda = await this.validarAgenda(
        dto.agendaId,
        dto.empresaId,
        dto.filialId,
        dto.pacienteId,
        dto.profissionalId,
      );

      if (!validacaoAgenda.valido) {
        return {
          status: 422,
          message: validacaoAgenda.mensagem,
        };
      }
    }

    if (dto.clienteId) {
      const validacaoCliente = await this.validarCliente(
        dto.clienteId,
        dto.filialId,
        dto.convenioId,
      );

      if (!validacaoCliente.valido) {
        return {
          status: 422,
          message: validacaoCliente.mensagem,
        };
      }
    }

    if (dto.convenioId) {
      const validacaoConvenio = await this.validarConvenio(
        dto.convenioId,
        dto.empresaId,
      );

      if (!validacaoConvenio.valido) {
        return {
          status: 422,
          message: validacaoConvenio.mensagem,
        };
      }
    }

    try {
      const atendimento = await this.prisma.atendimento.create({
        data: {
          empresaId: dto.empresaId,
          filialId: dto.filialId,
          agendaId: dto.agendaId,
          pacienteId: dto.pacienteId,
          profissionalId: dto.profissionalId,
          clienteId: dto.clienteId,
          convenioId: dto.convenioId,
          dataAtendimento: dto.dataAtendimento
            ? new Date(dto.dataAtendimento)
            : undefined,
          status: dto.status,
          queixa_principal: dto.queixa_principal,
          observacoes: dto.observacoes,
        },
      });

      return this.findById(atendimento.id);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return {
          status: 422,
          message: 'Já existe atendimento vinculado para esta agenda.',
        };
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        return {
          status: 422,
          message: 'Relacionamento inválido ao criar atendimento.',
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
    status?: StatusAtendimento,
    profissionalId?: string,
    pacienteId?: string,
    dataInicio?: string,
    dataFim?: string,
  ): Promise<AtendimentoResumo[]> {
    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, limit);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.AtendimentoWhereInput = {
      filialId,
      ...(status && { status }),
      ...(profissionalId && { profissionalId }),
      ...(pacienteId && { pacienteId }),
      ...(dataInicio || dataFim
        ? {
            dataAtendimento: {
              ...(dataInicio && { gte: new Date(dataInicio) }),
              ...(dataFim && { lte: new Date(dataFim) }),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              {
                paciente: {
                  nome: { contains: search, mode: 'insensitive' },
                },
              },
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
                observacoes: { contains: search, mode: 'insensitive' },
              },
              {
                queixa_principal: { contains: search, mode: 'insensitive' },
              },
            ],
          }
        : {}),
    };

    const atendimentos = await this.prisma.atendimento.findMany({
      skip,
      take: limitNumber,
      where,
      include: {
        agenda: {
          select: {
            id: true,
            dataHora: true,
            status: true,
          },
        },
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
        convenio: {
          select: {
            id: true,
            nome: true,
            registro: true,
          },
        },
      },
      orderBy: {
        dataAtendimento: 'desc',
      },
    });

    return atendimentos.map((atendimento) => this.mapResumo(atendimento));
  }

  async findById(id: string): Promise<ResponseJson> {
    const atendimento = await this.prisma.atendimento.findUnique({
      where: { id },
      include: {
        agenda: {
          select: {
            id: true,
            dataHora: true,
            status: true,
          },
        },
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
        convenio: {
          select: {
            id: true,
            nome: true,
            registro: true,
          },
        },
      },
    });

    if (!atendimento) {
      return { status: 422, message: 'Atendimento não encontrado.' };
    }

    return {
      status: 200,
      message: 'Atendimento encontrado.',
      data: this.mapResumo(atendimento),
    };
  }

  async update(id: string, dto: UpdateAtendimentoDto): Promise<ResponseJson> {
    const atendimento = await this.prisma.atendimento.findUnique({
      where: { id },
    });

    if (!atendimento) {
      return { status: 422, message: 'Atendimento não encontrado.' };
    }

    const empresaIdDestino = dto.empresaId ?? atendimento.empresaId;
    const filialIdDestino = dto.filialId ?? atendimento.filialId;
    const agendaIdDestino = dto.agendaId ?? atendimento.agendaId;
    const pacienteIdDestino = dto.pacienteId ?? atendimento.pacienteId;
    const profissionalIdDestino =
      dto.profissionalId ?? atendimento.profissionalId;
    const clienteIdDestino = dto.clienteId ?? atendimento.clienteId;
    const convenioIdDestino = dto.convenioId ?? atendimento.convenioId;

    const filial = await this.prisma.filial.findUnique({
      where: { id: filialIdDestino },
      select: { id: true, empresaId: true },
    });

    if (!filial || filial.empresaId !== empresaIdDestino) {
      return {
        status: 422,
        message: 'Filial não encontrada para a empresa informada.',
      };
    }

    const validacaoPaciente = await this.validarPaciente(
      pacienteIdDestino,
      filialIdDestino,
    );

    if (!validacaoPaciente.valido) {
      return {
        status: 422,
        message: validacaoPaciente.mensagem,
      };
    }

    if (profissionalIdDestino) {
      const validacaoProfissional = await this.validarProfissional(
        profissionalIdDestino,
        empresaIdDestino,
        filialIdDestino,
      );

      if (!validacaoProfissional.valido) {
        return {
          status: 422,
          message: validacaoProfissional.mensagem,
        };
      }
    }

    if (agendaIdDestino) {
      const validacaoAgenda = await this.validarAgenda(
        agendaIdDestino,
        empresaIdDestino,
        filialIdDestino,
        pacienteIdDestino,
        profissionalIdDestino,
        id,
      );

      if (!validacaoAgenda.valido) {
        return {
          status: 422,
          message: validacaoAgenda.mensagem,
        };
      }
    }

    if (clienteIdDestino) {
      const validacaoCliente = await this.validarCliente(
        clienteIdDestino,
        filialIdDestino,
        convenioIdDestino,
      );

      if (!validacaoCliente.valido) {
        return {
          status: 422,
          message: validacaoCliente.mensagem,
        };
      }
    }

    if (convenioIdDestino) {
      const validacaoConvenio = await this.validarConvenio(
        convenioIdDestino,
        empresaIdDestino,
      );

      if (!validacaoConvenio.valido) {
        return {
          status: 422,
          message: validacaoConvenio.mensagem,
        };
      }
    }

    try {
      await this.prisma.atendimento.update({
        where: { id },
        data: {
          empresaId: dto.empresaId,
          filialId: dto.filialId,
          agendaId: dto.agendaId,
          pacienteId: dto.pacienteId,
          profissionalId: dto.profissionalId,
          clienteId: dto.clienteId,
          convenioId: dto.convenioId,
          dataAtendimento: dto.dataAtendimento
            ? new Date(dto.dataAtendimento)
            : undefined,
          status: dto.status,
          queixa_principal: dto.queixa_principal,
          observacoes: dto.observacoes,
        },
      });

      return this.findById(id);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return {
          status: 422,
          message: 'Já existe atendimento vinculado para esta agenda.',
        };
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        return {
          status: 422,
          message: 'Relacionamento inválido ao atualizar atendimento.',
        };
      }

      throw error;
    }
  }

  async deleteById(id: string): Promise<ResponseJson> {
    const atendimento = await this.prisma.atendimento.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!atendimento) {
      return { status: 422, message: 'Atendimento não encontrado.' };
    }

    await this.prisma.atendimento.delete({
      where: { id },
    });

    return { status: 200, message: 'Atendimento deletado com sucesso.' };
  }

  private async validarPaciente(
    pacienteId: string,
    filialId: string,
  ): Promise<{ valido: boolean; mensagem: string }> {
    const paciente = await this.prisma.pessoa.findUnique({
      where: { id: pacienteId },
      select: { id: true, filialId: true },
    });

    if (!paciente) {
      return {
        valido: false,
        mensagem: 'Paciente não encontrado.',
      };
    }

    if (paciente.filialId !== filialId) {
      return {
        valido: false,
        mensagem: 'Paciente não pertence à filial informada.',
      };
    }

    return {
      valido: true,
      mensagem: 'Paciente válido.',
    };
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

  private async validarAgenda(
    agendaId: string,
    empresaId: string,
    filialId: string,
    pacienteId: string,
    profissionalId?: string | null,
    atendimentoAtualId?: string,
  ): Promise<{ valido: boolean; mensagem: string }> {
    const agenda = await this.prisma.agenda.findUnique({
      where: { id: agendaId },
      select: {
        id: true,
        empresaId: true,
        filialId: true,
        pessoaId: true,
        profissionalId: true,
        atendimento: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!agenda) {
      return {
        valido: false,
        mensagem: 'Agenda não encontrada.',
      };
    }

    if (agenda.empresaId !== empresaId || agenda.filialId !== filialId) {
      return {
        valido: false,
        mensagem: 'Agenda não pertence à empresa/filial informada.',
      };
    }

    if (agenda.atendimento && agenda.atendimento.id !== atendimentoAtualId) {
      return {
        valido: false,
        mensagem: 'Agenda já possui atendimento vinculado.',
      };
    }

    if (agenda.pessoaId && agenda.pessoaId !== pacienteId) {
      return {
        valido: false,
        mensagem: 'Paciente informado difere do paciente da agenda.',
      };
    }

    if (
      profissionalId &&
      agenda.profissionalId &&
      agenda.profissionalId !== profissionalId
    ) {
      return {
        valido: false,
        mensagem: 'Profissional informado difere do profissional da agenda.',
      };
    }

    return {
      valido: true,
      mensagem: 'Agenda válida.',
    };
  }

  private async validarCliente(
    clienteId: string,
    filialId: string,
    convenioId?: string | null,
  ): Promise<{ valido: boolean; mensagem: string }> {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        convenioId: true,
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
        mensagem: 'Cliente não encontrado.',
      };
    }

    if (cliente.pessoa.filialId !== filialId) {
      return {
        valido: false,
        mensagem: 'Cliente não pertence à filial informada.',
      };
    }

    if (convenioId && cliente.convenioId && cliente.convenioId !== convenioId) {
      return {
        valido: false,
        mensagem: 'Convênio informado difere do convênio do cliente.',
      };
    }

    return {
      valido: true,
      mensagem: 'Cliente válido.',
    };
  }

  private async validarConvenio(
    convenioId: string,
    empresaId: string,
  ): Promise<{ valido: boolean; mensagem: string }> {
    const convenio = await this.prisma.convenio.findUnique({
      where: { id: convenioId },
      select: {
        id: true,
        empresaId: true,
      },
    });

    if (!convenio) {
      return {
        valido: false,
        mensagem: 'Convênio não encontrado.',
      };
    }

    if (convenio.empresaId !== empresaId) {
      return {
        valido: false,
        mensagem: 'Convênio não pertence à empresa informada.',
      };
    }

    return {
      valido: true,
      mensagem: 'Convênio válido.',
    };
  }

  private mapResumo(
    atendimento: Prisma.AtendimentoGetPayload<{
      include: {
        agenda: {
          select: {
            id: true;
            dataHora: true;
            status: true;
          };
        };
        paciente: {
          select: {
            id: true;
            nome: true;
            email: true;
            cpf: true;
          };
        };
        profissional: {
          select: {
            id: true;
            email: true;
            username: true;
            pessoa: {
              select: {
                id: true;
                nome: true;
                optometrista: {
                  select: {
                    id: true;
                  };
                };
                oftalmologista: {
                  select: {
                    id: true;
                  };
                };
              };
            };
          };
        };
        cliente: {
          select: {
            id: true;
            numero_convenio: true;
            pessoa: {
              select: {
                id: true;
                nome: true;
                email: true;
                cpf: true;
              };
            };
          };
        };
        convenio: {
          select: {
            id: true;
            nome: true;
            registro: true;
          };
        };
      };
    }>,
  ): AtendimentoResumo {
    return {
      id: atendimento.id,
      empresaId: atendimento.empresaId,
      filialId: atendimento.filialId,
      agendaId: atendimento.agendaId,
      pacienteId: atendimento.pacienteId,
      profissionalId: atendimento.profissionalId,
      clienteId: atendimento.clienteId,
      convenioId: atendimento.convenioId,
      dataAtendimento: atendimento.dataAtendimento,
      status: atendimento.status,
      queixa_principal: atendimento.queixa_principal,
      observacoes: atendimento.observacoes,
      createdAt: atendimento.createdAt,
      updatedAt: atendimento.updatedAt,
      agenda: atendimento.agenda,
      paciente: atendimento.paciente,
      profissional: atendimento.profissional
        ? {
            id: atendimento.profissional.id,
            email: atendimento.profissional.email,
            username: atendimento.profissional.username,
            pessoa: atendimento.profissional.pessoa
              ? {
                  id: atendimento.profissional.pessoa.id,
                  nome: atendimento.profissional.pessoa.nome,
                  tipo: atendimento.profissional.pessoa.oftalmologista
                    ? 'oftalmologista'
                    : atendimento.profissional.pessoa.optometrista
                      ? 'optometrista'
                      : 'nao_definido',
                }
              : null,
          }
        : null,
      cliente: atendimento.cliente,
      convenio: atendimento.convenio,
    };
  }
}
