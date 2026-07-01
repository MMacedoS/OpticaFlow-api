import { Injectable } from '@nestjs/common';
import { Prisma, StatusAgenda } from '@prisma/client';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAgendaDto, UpdateAgendaDto } from './dto/agenda.dto';
import { AgendaResumo } from './interfaces/agenda.interface';

@Injectable()
export class AgendaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAgendaDto): Promise<ResponseJson> {
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

    if (dto.pessoaId) {
      const pessoa = await this.prisma.pessoa.findUnique({
        where: { id: dto.pessoaId },
        select: { id: true, filialId: true },
      });

      if (!pessoa || pessoa.filialId !== dto.filialId) {
        return {
          status: 422,
          message: 'Paciente não encontrado para a filial informada.',
        };
      }
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

    try {
      const agenda = await this.prisma.agenda.create({
        data: {
          empresaId: dto.empresaId,
          filialId: dto.filialId,
          pessoaId: dto.pessoaId,
          profissionalId: dto.profissionalId,
          dataHora: new Date(dto.dataHora),
          duracaoMin: dto.duracaoMin,
          status: dto.status,
          observacao: dto.observacao,
        },
      });

      return {
        status: 201,
        message: 'Agenda criada com sucesso.',
        data: agenda,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        return {
          status: 422,
          message: 'Relacionamento inválido ao criar agenda.',
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
  ): Promise<AgendaResumo[]> {
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
      },
      orderBy: {
        dataHora: 'asc',
      },
    });

    return agendas.map((agenda) => ({
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
      paciente: agenda.pessoa
        ? {
            id: agenda.pessoa.id,
            nome: agenda.pessoa.nome,
            email: agenda.pessoa.email,
            cpf: agenda.pessoa.cpf,
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
    }));
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

  async update(id: string, dto: UpdateAgendaDto): Promise<ResponseJson> {
    const agenda = await this.prisma.agenda.findUnique({
      where: { id },
    });

    if (!agenda) {
      return { status: 422, message: 'Agenda não encontrada.' };
    }

    const empresaIdDestino = dto.empresaId ?? agenda.empresaId;
    const filialIdDestino = dto.filialId ?? agenda.filialId;
    const pessoaIdDestino = dto.pessoaId ?? agenda.pessoaId;
    const profissionalIdDestino = dto.profissionalId ?? agenda.profissionalId;

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

    if (pessoaIdDestino) {
      const pessoa = await this.prisma.pessoa.findUnique({
        where: { id: pessoaIdDestino },
        select: { id: true, filialId: true },
      });

      if (!pessoa || pessoa.filialId !== filialIdDestino) {
        return {
          status: 422,
          message: 'Paciente não encontrado para a filial informada.',
        };
      }
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

    try {
      await this.prisma.agenda.update({
        where: { id },
        data: {
          empresaId: dto.empresaId,
          filialId: dto.filialId,
          pessoaId: dto.pessoaId,
          profissionalId: dto.profissionalId,
          dataHora: dto.dataHora ? new Date(dto.dataHora) : undefined,
          duracaoMin: dto.duracaoMin,
          status: dto.status,
          observacao: dto.observacao,
        },
      });

      return this.findById(id);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        return {
          status: 422,
          message: 'Relacionamento inválido ao atualizar agenda.',
        };
      }

      throw error;
    }
  }

  async deleteById(id: string): Promise<ResponseJson> {
    const agenda = await this.prisma.agenda.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!agenda) {
      return { status: 422, message: 'Agenda não encontrada.' };
    }

    await this.prisma.agenda.delete({
      where: { id },
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
