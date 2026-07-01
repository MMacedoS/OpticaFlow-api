import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, TipoReceita } from '@prisma/client';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateReceitaDto,
  CreateReceitaLenteContatoDto,
  CreateReceitaMedicamentoDto,
  CreateReceitaOculosDto,
  UpdateReceitaDto,
  UpdateReceitaLenteContatoDto,
  UpdateReceitaMedicamentoDto,
  UpdateReceitaOculosDto,
} from './dto/receita.dto';
import {
  ReceitaContextoResumo,
  ReceitaLenteContatoListaItem,
  ReceitaLenteContatoResumo,
  ReceitaMedicamentoListaItem,
  ReceitaMedicamentoResumo,
  ReceitaOculosListaItem,
  ReceitaOculosResumo,
  ReceitaResumo,
} from './interfaces/receita.interface';

const receitaListSelect = {
  id: true,
  filialId: true,
  profissionalId: true,
  tipo: true,
  createdAt: true,
  atendimento: {
    select: {
      id: true,
      dataAtendimento: true,
      status: true,
    },
  },
  prontuario: {
    select: {
      id: true,
      createdAt: true,
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
} satisfies Prisma.ReceitaSelect;

const receitaInclude = {
  atendimento: {
    select: {
      id: true,
      dataAtendimento: true,
      status: true,
    },
  },
  prontuario: {
    select: {
      id: true,
      createdAt: true,
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
  oculos: true,
  lente_contato: true,
  medicamento: true,
} satisfies Prisma.ReceitaInclude;

const receitaOculosListInclude = {
  receita: {
    select: receitaListSelect,
  },
} satisfies Prisma.ReceitaOculosInclude;

const receitaLenteContatoListInclude = {
  receita: {
    select: receitaListSelect,
  },
} satisfies Prisma.ReceitaLenteContatoInclude;

const receitaMedicamentoListInclude = {
  receita: {
    select: receitaListSelect,
  },
} satisfies Prisma.ReceitaMedicamentoInclude;

type ReceitaCompleta = Prisma.ReceitaGetPayload<{
  include: typeof receitaInclude;
}>;

type ReceitaListaContexto = Prisma.ReceitaGetPayload<{
  select: typeof receitaListSelect;
}>;

type ReceitaOculosCompleta = Prisma.ReceitaOculosGetPayload<{
  include: typeof receitaOculosListInclude;
}>;

type ReceitaLenteContatoCompleta = Prisma.ReceitaLenteContatoGetPayload<{
  include: typeof receitaLenteContatoListInclude;
}>;

type ReceitaMedicamentoCompleta = Prisma.ReceitaMedicamentoGetPayload<{
  include: typeof receitaMedicamentoListInclude;
}>;

@Injectable()
export class ReceitaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReceitaDto): Promise<ResponseJson> {
    const validacaoFilial = await this.validarFilialEmpresa(
      dto.filialId,
      dto.empresaId,
    );

    if (!validacaoFilial.valido) {
      return { status: 422, message: validacaoFilial.mensagem };
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
        return { status: 422, message: validacaoProfissional.mensagem };
      }
    }

    if (dto.atendimentoId) {
      const validacaoAtendimento = await this.validarAtendimento(
        dto.atendimentoId,
        dto.empresaId,
        dto.filialId,
        dto.pacienteId,
        dto.profissionalId,
      );

      if (!validacaoAtendimento.valido) {
        return { status: 422, message: validacaoAtendimento.mensagem };
      }
    }

    if (dto.prontuarioId) {
      const validacaoProntuario = await this.validarProntuario(
        dto.prontuarioId,
        dto.empresaId,
        dto.filialId,
        dto.pacienteId,
        dto.profissionalId,
      );

      if (!validacaoProntuario.valido) {
        return { status: 422, message: validacaoProntuario.mensagem };
      }
    }

    const validacaoDetalhe = this.validarDetalhesPorTipo(dto.tipo, dto, true);
    if (!validacaoDetalhe.valido) {
      return { status: 422, message: validacaoDetalhe.mensagem };
    }

    try {
      const receita = await this.prisma.$transaction(async (tx) => {
        const receitaCriada = await tx.receita.create({
          data: {
            empresaId: dto.empresaId,
            filialId: dto.filialId,
            atendimentoId: dto.atendimentoId,
            prontuarioId: dto.prontuarioId,
            pacienteId: dto.pacienteId,
            profissionalId: dto.profissionalId,
            tipo: dto.tipo,
            observacoes: dto.observacoes,
          },
        });

        await this.criarDetalhePorTipo(tx, receitaCriada.id, dto.tipo, dto);

        return receitaCriada;
      });

      return this.findById(receita.id);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        return {
          status: 422,
          message: 'Relacionamento inválido ao criar receita.',
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
    pacienteId?: string,
    profissionalId?: string,
    atendimentoId?: string,
    prontuarioId?: string,
    tipo?: TipoReceita,
    dataInicio?: string,
    dataFim?: string,
  ): Promise<ReceitaResumo[]> {
    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, limit);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.ReceitaWhereInput = {
      filialId,
      ...(pacienteId && { pacienteId }),
      ...(profissionalId && { profissionalId }),
      ...(atendimentoId && { atendimentoId }),
      ...(prontuarioId && { prontuarioId }),
      ...(tipo && { tipo }),
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
              {
                observacoes: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                paciente: {
                  nome: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                oculos: {
                  is: {
                    observacoes: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                },
              },
              {
                lente_contato: {
                  is: {
                    OR: [
                      {
                        marca: {
                          contains: search,
                          mode: 'insensitive',
                        },
                      },
                      {
                        material: {
                          contains: search,
                          mode: 'insensitive',
                        },
                      },
                    ],
                  },
                },
              },
              {
                medicamento: {
                  is: {
                    medicamento: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const receitas = await this.prisma.receita.findMany({
      skip,
      take: limitNumber,
      where,
      include: receitaInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return receitas.map((receita) => this.mapResumo(receita));
  }

  async findAllByProfissional(
    profissionalId: string,
    page: number = 1,
    limit: number = 10,
    search: string = '',
    filialId?: string,
    pacienteId?: string,
    atendimentoId?: string,
    prontuarioId?: string,
    tipo?: TipoReceita,
    dataInicio?: string,
    dataFim?: string,
  ): Promise<ReceitaResumo[]> {
    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, limit);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.ReceitaWhereInput = {
      profissionalId,
      ...(filialId && { filialId }),
      ...(pacienteId && { pacienteId }),
      ...(atendimentoId && { atendimentoId }),
      ...(prontuarioId && { prontuarioId }),
      ...(tipo && { tipo }),
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
              {
                observacoes: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                paciente: {
                  nome: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                oculos: {
                  is: {
                    observacoes: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                },
              },
              {
                lente_contato: {
                  is: {
                    OR: [
                      {
                        marca: {
                          contains: search,
                          mode: 'insensitive',
                        },
                      },
                      {
                        material: {
                          contains: search,
                          mode: 'insensitive',
                        },
                      },
                    ],
                  },
                },
              },
              {
                medicamento: {
                  is: {
                    medicamento: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const receitas = await this.prisma.receita.findMany({
      skip,
      take: limitNumber,
      where,
      include: receitaInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return receitas.map((receita) => this.mapResumo(receita));
  }

  async findById(id: string): Promise<ResponseJson> {
    const receita = await this.buscarReceitaCompleta(id);

    if (!receita) {
      return { status: 422, message: 'Receita não encontrada.' };
    }

    return {
      status: 200,
      message: 'Receita encontrada.',
      data: this.mapResumo(receita),
    };
  }

  async update(id: string, dto: UpdateReceitaDto): Promise<ResponseJson> {
    const receita = await this.prisma.receita.findUnique({
      where: { id },
      select: {
        id: true,
        empresaId: true,
        filialId: true,
        atendimentoId: true,
        prontuarioId: true,
        pacienteId: true,
        profissionalId: true,
        tipo: true,
      },
    });

    if (!receita) {
      return { status: 422, message: 'Receita não encontrada.' };
    }

    const empresaIdDestino = dto.empresaId ?? receita.empresaId;
    const filialIdDestino = dto.filialId ?? receita.filialId;
    const atendimentoIdDestino = dto.atendimentoId ?? receita.atendimentoId;
    const prontuarioIdDestino = dto.prontuarioId ?? receita.prontuarioId;
    const pacienteIdDestino = dto.pacienteId ?? receita.pacienteId;
    const profissionalIdDestino =
      dto.profissionalId === undefined
        ? receita.profissionalId
        : dto.profissionalId;
    const tipoDestino = dto.tipo ?? receita.tipo;

    const validacaoFilial = await this.validarFilialEmpresa(
      filialIdDestino,
      empresaIdDestino,
    );

    if (!validacaoFilial.valido) {
      return { status: 422, message: validacaoFilial.mensagem };
    }

    const validacaoPaciente = await this.validarPaciente(
      pacienteIdDestino,
      filialIdDestino,
    );

    if (!validacaoPaciente.valido) {
      return { status: 422, message: validacaoPaciente.mensagem };
    }

    if (profissionalIdDestino) {
      const validacaoProfissional = await this.validarProfissional(
        profissionalIdDestino,
        empresaIdDestino,
        filialIdDestino,
      );

      if (!validacaoProfissional.valido) {
        return { status: 422, message: validacaoProfissional.mensagem };
      }
    }

    if (atendimentoIdDestino) {
      const validacaoAtendimento = await this.validarAtendimento(
        atendimentoIdDestino,
        empresaIdDestino,
        filialIdDestino,
        pacienteIdDestino,
        profissionalIdDestino,
      );

      if (!validacaoAtendimento.valido) {
        return { status: 422, message: validacaoAtendimento.mensagem };
      }
    }

    if (prontuarioIdDestino) {
      const validacaoProntuario = await this.validarProntuario(
        prontuarioIdDestino,
        empresaIdDestino,
        filialIdDestino,
        pacienteIdDestino,
        profissionalIdDestino,
      );

      if (!validacaoProntuario.valido) {
        return { status: 422, message: validacaoProntuario.mensagem };
      }
    }

    const validacaoDetalhe = this.validarDetalhesPorTipo(
      tipoDestino,
      dto,
      false,
    );
    if (!validacaoDetalhe.valido) {
      return { status: 422, message: validacaoDetalhe.mensagem };
    }

    if (dto.tipo && dto.tipo !== receita.tipo) {
      const possuiDetalheNovoTipo = this.obterDetalhePorTipo(dto, dto.tipo);
      if (!possuiDetalheNovoTipo) {
        return {
          status: 422,
          message:
            'Para alterar o tipo da receita, informe também os dados do detalhe do novo tipo.',
        };
      }
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.receita.update({
          where: { id },
          data: {
            empresaId: dto.empresaId,
            filialId: dto.filialId,
            atendimentoId: dto.atendimentoId,
            prontuarioId: dto.prontuarioId,
            pacienteId: dto.pacienteId,
            profissionalId: dto.profissionalId,
            tipo: dto.tipo,
            observacoes: dto.observacoes,
          },
        });

        if (dto.tipo && dto.tipo !== receita.tipo) {
          await tx.receitaOculos.deleteMany({ where: { receitaId: id } });
          await tx.receitaLenteContato.deleteMany({ where: { receitaId: id } });
          await tx.receitaMedicamento.deleteMany({ where: { receitaId: id } });

          await this.criarDetalhePorTipo(tx, id, dto.tipo, dto);
          return;
        }

        await this.atualizarDetalhePorTipo(tx, id, tipoDestino, dto);
      });

      return this.findById(id);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        return {
          status: 422,
          message: 'Relacionamento inválido ao atualizar receita.',
        };
      }

      throw error;
    }
  }

  async deleteById(id: string): Promise<ResponseJson> {
    const receita = await this.prisma.receita.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!receita) {
      return { status: 422, message: 'Receita não encontrada.' };
    }

    await this.prisma.receita.delete({ where: { id } });

    return { status: 200, message: 'Receita deletada com sucesso.' };
  }

  async createOculos(
    receitaId: string,
    dto: CreateReceitaOculosDto,
  ): Promise<ResponseJson> {
    const receita = await this.validarReceitaExistente(receitaId);

    if (!receita) {
      return { status: 422, message: 'Receita não encontrada.' };
    }

    if (receita.tipo !== TipoReceita.oculos) {
      return {
        status: 422,
        message: 'A receita informada não é do tipo óculos.',
      };
    }

    const existente = await this.prisma.receitaOculos.findUnique({
      where: { receitaId },
      select: { id: true },
    });

    if (existente) {
      return {
        status: 422,
        message: 'Detalhe de óculos já cadastrado para a receita informada.',
      };
    }

    const oculos = await this.prisma.receitaOculos.create({
      data: {
        receitaId,
        od_esferico: dto.od_esferico,
        od_cilindrico: dto.od_cilindrico,
        od_eixo: dto.od_eixo,
        oe_esferico: dto.oe_esferico,
        oe_cilindrico: dto.oe_cilindrico,
        oe_eixo: dto.oe_eixo,
        dp: dto.dp,
        adicao: dto.adicao,
        observacoes: dto.observacoes,
      },
    });

    return {
      status: 201,
      message: 'Detalhe de óculos criado com sucesso.',
      data: this.mapOculos(oculos),
    };
  }

  async findOculosByReceitaId(receitaId: string): Promise<ResponseJson> {
    const receita = await this.validarReceitaExistente(receitaId);

    if (!receita) {
      return { status: 422, message: 'Receita não encontrada.' };
    }

    if (receita.tipo !== TipoReceita.oculos) {
      return {
        status: 422,
        message: 'A receita informada não é do tipo óculos.',
      };
    }

    const oculos = await this.prisma.receitaOculos.findUnique({
      where: { receitaId },
    });

    if (!oculos) {
      return { status: 422, message: 'Detalhe de óculos não encontrado.' };
    }

    return {
      status: 200,
      message: 'Detalhe de óculos encontrado.',
      data: this.mapOculos(oculos),
    };
  }

  async updateOculos(
    receitaId: string,
    dto: UpdateReceitaOculosDto,
  ): Promise<ResponseJson> {
    const receita = await this.validarReceitaExistente(receitaId);

    if (!receita) {
      return { status: 422, message: 'Receita não encontrada.' };
    }

    if (receita.tipo !== TipoReceita.oculos) {
      return {
        status: 422,
        message: 'A receita informada não é do tipo óculos.',
      };
    }

    const oculos = await this.prisma.receitaOculos.findUnique({
      where: { receitaId },
      select: { id: true },
    });

    if (!oculos) {
      return { status: 422, message: 'Detalhe de óculos não encontrado.' };
    }

    const atualizado = await this.prisma.receitaOculos.update({
      where: { receitaId },
      data: {
        od_esferico: dto.od_esferico,
        od_cilindrico: dto.od_cilindrico,
        od_eixo: dto.od_eixo,
        oe_esferico: dto.oe_esferico,
        oe_cilindrico: dto.oe_cilindrico,
        oe_eixo: dto.oe_eixo,
        dp: dto.dp,
        adicao: dto.adicao,
        observacoes: dto.observacoes,
      },
    });

    return {
      status: 200,
      message: 'Detalhe de óculos atualizado com sucesso.',
      data: this.mapOculos(atualizado),
    };
  }

  async deleteOculosByReceitaId(receitaId: string): Promise<ResponseJson> {
    const receita = await this.validarReceitaExistente(receitaId);

    if (!receita) {
      return { status: 422, message: 'Receita não encontrada.' };
    }

    if (receita.tipo !== TipoReceita.oculos) {
      return {
        status: 422,
        message: 'A receita informada não é do tipo óculos.',
      };
    }

    const oculos = await this.prisma.receitaOculos.findUnique({
      where: { receitaId },
      select: { id: true },
    });

    if (!oculos) {
      return { status: 422, message: 'Detalhe de óculos não encontrado.' };
    }

    await this.prisma.receitaOculos.delete({ where: { receitaId } });

    return {
      status: 200,
      message: 'Detalhe de óculos deletado com sucesso.',
    };
  }

  async createLenteContato(
    receitaId: string,
    dto: CreateReceitaLenteContatoDto,
  ): Promise<ResponseJson> {
    const receita = await this.validarReceitaExistente(receitaId);

    if (!receita) {
      return { status: 422, message: 'Receita não encontrada.' };
    }

    if (receita.tipo !== TipoReceita.lente_contato) {
      return {
        status: 422,
        message: 'A receita informada não é do tipo lente de contato.',
      };
    }

    const existente = await this.prisma.receitaLenteContato.findUnique({
      where: { receitaId },
      select: { id: true },
    });

    if (existente) {
      return {
        status: 422,
        message:
          'Detalhe de lente de contato já cadastrado para a receita informada.',
      };
    }

    const lenteContato = await this.prisma.receitaLenteContato.create({
      data: {
        receitaId,
        od_curva_base: dto.od_curva_base,
        od_diametro: dto.od_diametro,
        od_grau: dto.od_grau,
        oe_curva_base: dto.oe_curva_base,
        oe_diametro: dto.oe_diametro,
        oe_grau: dto.oe_grau,
        material: dto.material,
        marca: dto.marca,
        observacoes: dto.observacoes,
      },
    });

    return {
      status: 201,
      message: 'Detalhe de lente de contato criado com sucesso.',
      data: this.mapLenteContato(lenteContato),
    };
  }

  async findLenteContatoByReceitaId(receitaId: string): Promise<ResponseJson> {
    const receita = await this.validarReceitaExistente(receitaId);

    if (!receita) {
      return { status: 422, message: 'Receita não encontrada.' };
    }

    if (receita.tipo !== TipoReceita.lente_contato) {
      return {
        status: 422,
        message: 'A receita informada não é do tipo lente de contato.',
      };
    }

    const lenteContato = await this.prisma.receitaLenteContato.findUnique({
      where: { receitaId },
    });

    if (!lenteContato) {
      return {
        status: 422,
        message: 'Detalhe de lente de contato não encontrado.',
      };
    }

    return {
      status: 200,
      message: 'Detalhe de lente de contato encontrado.',
      data: this.mapLenteContato(lenteContato),
    };
  }

  async updateLenteContato(
    receitaId: string,
    dto: UpdateReceitaLenteContatoDto,
  ): Promise<ResponseJson> {
    const receita = await this.validarReceitaExistente(receitaId);

    if (!receita) {
      return { status: 422, message: 'Receita não encontrada.' };
    }

    if (receita.tipo !== TipoReceita.lente_contato) {
      return {
        status: 422,
        message: 'A receita informada não é do tipo lente de contato.',
      };
    }

    const lenteContato = await this.prisma.receitaLenteContato.findUnique({
      where: { receitaId },
      select: { id: true },
    });

    if (!lenteContato) {
      return {
        status: 422,
        message: 'Detalhe de lente de contato não encontrado.',
      };
    }

    const atualizado = await this.prisma.receitaLenteContato.update({
      where: { receitaId },
      data: {
        od_curva_base: dto.od_curva_base,
        od_diametro: dto.od_diametro,
        od_grau: dto.od_grau,
        oe_curva_base: dto.oe_curva_base,
        oe_diametro: dto.oe_diametro,
        oe_grau: dto.oe_grau,
        material: dto.material,
        marca: dto.marca,
        observacoes: dto.observacoes,
      },
    });

    return {
      status: 200,
      message: 'Detalhe de lente de contato atualizado com sucesso.',
      data: this.mapLenteContato(atualizado),
    };
  }

  async deleteLenteContatoByReceitaId(
    receitaId: string,
  ): Promise<ResponseJson> {
    const receita = await this.validarReceitaExistente(receitaId);

    if (!receita) {
      return { status: 422, message: 'Receita não encontrada.' };
    }

    if (receita.tipo !== TipoReceita.lente_contato) {
      return {
        status: 422,
        message: 'A receita informada não é do tipo lente de contato.',
      };
    }

    const lenteContato = await this.prisma.receitaLenteContato.findUnique({
      where: { receitaId },
      select: { id: true },
    });

    if (!lenteContato) {
      return {
        status: 422,
        message: 'Detalhe de lente de contato não encontrado.',
      };
    }

    await this.prisma.receitaLenteContato.delete({ where: { receitaId } });

    return {
      status: 200,
      message: 'Detalhe de lente de contato deletado com sucesso.',
    };
  }

  async createMedicamento(
    receitaId: string,
    dto: CreateReceitaMedicamentoDto,
  ): Promise<ResponseJson> {
    const receita = await this.validarReceitaExistente(receitaId);

    if (!receita) {
      return { status: 422, message: 'Receita não encontrada.' };
    }

    if (receita.tipo !== TipoReceita.medicamento) {
      return {
        status: 422,
        message: 'A receita informada não é do tipo medicamento.',
      };
    }

    const existente = await this.prisma.receitaMedicamento.findUnique({
      where: { receitaId },
      select: { id: true },
    });

    if (existente) {
      return {
        status: 422,
        message:
          'Detalhe de medicamento já cadastrado para a receita informada.',
      };
    }

    const medicamento = await this.prisma.receitaMedicamento.create({
      data: {
        receitaId,
        medicamento: dto.medicamento,
        dosagem: dto.dosagem,
        posologia: dto.posologia,
        duracao: dto.duracao,
        observacoes: dto.observacoes,
      },
    });

    return {
      status: 201,
      message: 'Detalhe de medicamento criado com sucesso.',
      data: this.mapMedicamento(medicamento),
    };
  }

  async findMedicamentoByReceitaId(receitaId: string): Promise<ResponseJson> {
    const receita = await this.validarReceitaExistente(receitaId);

    if (!receita) {
      return { status: 422, message: 'Receita não encontrada.' };
    }

    if (receita.tipo !== TipoReceita.medicamento) {
      return {
        status: 422,
        message: 'A receita informada não é do tipo medicamento.',
      };
    }

    const medicamento = await this.prisma.receitaMedicamento.findUnique({
      where: { receitaId },
    });

    if (!medicamento) {
      return {
        status: 422,
        message: 'Detalhe de medicamento não encontrado.',
      };
    }

    return {
      status: 200,
      message: 'Detalhe de medicamento encontrado.',
      data: this.mapMedicamento(medicamento),
    };
  }

  async updateMedicamento(
    receitaId: string,
    dto: UpdateReceitaMedicamentoDto,
  ): Promise<ResponseJson> {
    const receita = await this.validarReceitaExistente(receitaId);

    if (!receita) {
      return { status: 422, message: 'Receita não encontrada.' };
    }

    if (receita.tipo !== TipoReceita.medicamento) {
      return {
        status: 422,
        message: 'A receita informada não é do tipo medicamento.',
      };
    }

    const medicamento = await this.prisma.receitaMedicamento.findUnique({
      where: { receitaId },
      select: { id: true },
    });

    if (!medicamento) {
      return {
        status: 422,
        message: 'Detalhe de medicamento não encontrado.',
      };
    }

    const atualizado = await this.prisma.receitaMedicamento.update({
      where: { receitaId },
      data: {
        medicamento: dto.medicamento,
        dosagem: dto.dosagem,
        posologia: dto.posologia,
        duracao: dto.duracao,
        observacoes: dto.observacoes,
      },
    });

    return {
      status: 200,
      message: 'Detalhe de medicamento atualizado com sucesso.',
      data: this.mapMedicamento(atualizado),
    };
  }

  async deleteMedicamentoByReceitaId(receitaId: string): Promise<ResponseJson> {
    const receita = await this.validarReceitaExistente(receitaId);

    if (!receita) {
      return { status: 422, message: 'Receita não encontrada.' };
    }

    if (receita.tipo !== TipoReceita.medicamento) {
      return {
        status: 422,
        message: 'A receita informada não é do tipo medicamento.',
      };
    }

    const medicamento = await this.prisma.receitaMedicamento.findUnique({
      where: { receitaId },
      select: { id: true },
    });

    if (!medicamento) {
      return {
        status: 422,
        message: 'Detalhe de medicamento não encontrado.',
      };
    }

    await this.prisma.receitaMedicamento.delete({ where: { receitaId } });

    return {
      status: 200,
      message: 'Detalhe de medicamento deletado com sucesso.',
    };
  }

  async findAllOculos(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    filialId?: string,
    profissionalId?: string,
    dataInicio?: string,
    dataFim?: string,
  ): Promise<ResponseJson> {
    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, limit);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.ReceitaOculosWhereInput = {
      receita: {
        ...(filialId && { filialId }),
        ...(profissionalId && { profissionalId }),
        ...(dataInicio || dataFim
          ? {
              createdAt: {
                ...(dataInicio && { gte: new Date(dataInicio) }),
                ...(dataFim && { lte: new Date(dataFim) }),
              },
            }
          : {}),
      },
      ...(search
        ? {
            OR: [
              {
                observacoes: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                od_esferico: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                oe_esferico: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                receita: {
                  paciente: {
                    nome: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [registros, total] = await this.prisma.$transaction([
      this.prisma.receitaOculos.findMany({
        skip,
        take: limitNumber,
        where,
        include: receitaOculosListInclude,
        orderBy: {
          receita: {
            createdAt: 'desc',
          },
        },
      }),
      this.prisma.receitaOculos.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Receitas de óculos listadas com sucesso.',
      data: registros.map((registro) => this.mapOculosLista(registro)),
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async findAllLentesContato(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    filialId?: string,
    profissionalId?: string,
    dataInicio?: string,
    dataFim?: string,
  ): Promise<ResponseJson> {
    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, limit);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.ReceitaLenteContatoWhereInput = {
      receita: {
        ...(filialId && { filialId }),
        ...(profissionalId && { profissionalId }),
        ...(dataInicio || dataFim
          ? {
              createdAt: {
                ...(dataInicio && { gte: new Date(dataInicio) }),
                ...(dataFim && { lte: new Date(dataFim) }),
              },
            }
          : {}),
      },
      ...(search
        ? {
            OR: [
              {
                marca: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                material: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                observacoes: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                receita: {
                  paciente: {
                    nome: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [registros, total] = await this.prisma.$transaction([
      this.prisma.receitaLenteContato.findMany({
        skip,
        take: limitNumber,
        where,
        include: receitaLenteContatoListInclude,
        orderBy: {
          receita: {
            createdAt: 'desc',
          },
        },
      }),
      this.prisma.receitaLenteContato.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Receitas de lente de contato listadas com sucesso.',
      data: registros.map((registro) => this.mapLenteContatoLista(registro)),
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async findAllMedicamentos(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    filialId?: string,
    profissionalId?: string,
    dataInicio?: string,
    dataFim?: string,
  ): Promise<ResponseJson> {
    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, limit);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.ReceitaMedicamentoWhereInput = {
      receita: {
        ...(filialId && { filialId }),
        ...(profissionalId && { profissionalId }),
        ...(dataInicio || dataFim
          ? {
              createdAt: {
                ...(dataInicio && { gte: new Date(dataInicio) }),
                ...(dataFim && { lte: new Date(dataFim) }),
              },
            }
          : {}),
      },
      ...(search
        ? {
            OR: [
              {
                medicamento: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                posologia: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                observacoes: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                receita: {
                  paciente: {
                    nome: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [registros, total] = await this.prisma.$transaction([
      this.prisma.receitaMedicamento.findMany({
        skip,
        take: limitNumber,
        where,
        include: receitaMedicamentoListInclude,
        orderBy: {
          receita: {
            createdAt: 'desc',
          },
        },
      }),
      this.prisma.receitaMedicamento.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Receitas de medicamento listadas com sucesso.',
      data: registros.map((registro) => this.mapMedicamentoLista(registro)),
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  private async criarDetalhePorTipo(
    tx: Prisma.TransactionClient,
    receitaId: string,
    tipo: TipoReceita,
    dto: Pick<
      CreateReceitaDto | UpdateReceitaDto,
      'oculos' | 'lente_contato' | 'medicamento'
    >,
  ): Promise<void> {
    if (tipo === TipoReceita.oculos && dto.oculos) {
      await tx.receitaOculos.create({
        data: {
          receitaId,
          od_esferico: dto.oculos.od_esferico,
          od_cilindrico: dto.oculos.od_cilindrico,
          od_eixo: dto.oculos.od_eixo,
          oe_esferico: dto.oculos.oe_esferico,
          oe_cilindrico: dto.oculos.oe_cilindrico,
          oe_eixo: dto.oculos.oe_eixo,
          dp: dto.oculos.dp,
          adicao: dto.oculos.adicao,
          observacoes: dto.oculos.observacoes,
        },
      });
    }

    if (tipo === TipoReceita.lente_contato && dto.lente_contato) {
      await tx.receitaLenteContato.create({
        data: {
          receitaId,
          od_curva_base: dto.lente_contato.od_curva_base,
          od_diametro: dto.lente_contato.od_diametro,
          od_grau: dto.lente_contato.od_grau,
          oe_curva_base: dto.lente_contato.oe_curva_base,
          oe_diametro: dto.lente_contato.oe_diametro,
          oe_grau: dto.lente_contato.oe_grau,
          material: dto.lente_contato.material,
          marca: dto.lente_contato.marca,
          observacoes: dto.lente_contato.observacoes,
        },
      });
    }

    if (tipo === TipoReceita.medicamento && dto.medicamento) {
      if (!dto.medicamento.medicamento) {
        throw new BadRequestException(
          'Campo medicamento é obrigatório para receitas do tipo medicamento.',
        );
      }

      await tx.receitaMedicamento.create({
        data: {
          receitaId,
          medicamento: dto.medicamento.medicamento,
          dosagem: dto.medicamento.dosagem,
          posologia: dto.medicamento.posologia,
          duracao: dto.medicamento.duracao,
          observacoes: dto.medicamento.observacoes,
        },
      });
    }
  }

  private async atualizarDetalhePorTipo(
    tx: Prisma.TransactionClient,
    receitaId: string,
    tipo: TipoReceita,
    dto: Pick<UpdateReceitaDto, 'oculos' | 'lente_contato' | 'medicamento'>,
  ): Promise<void> {
    if (tipo === TipoReceita.oculos && dto.oculos) {
      await tx.receitaOculos.upsert({
        where: { receitaId },
        create: {
          receitaId,
          od_esferico: dto.oculos.od_esferico,
          od_cilindrico: dto.oculos.od_cilindrico,
          od_eixo: dto.oculos.od_eixo,
          oe_esferico: dto.oculos.oe_esferico,
          oe_cilindrico: dto.oculos.oe_cilindrico,
          oe_eixo: dto.oculos.oe_eixo,
          dp: dto.oculos.dp,
          adicao: dto.oculos.adicao,
          observacoes: dto.oculos.observacoes,
        },
        update: {
          od_esferico: dto.oculos.od_esferico,
          od_cilindrico: dto.oculos.od_cilindrico,
          od_eixo: dto.oculos.od_eixo,
          oe_esferico: dto.oculos.oe_esferico,
          oe_cilindrico: dto.oculos.oe_cilindrico,
          oe_eixo: dto.oculos.oe_eixo,
          dp: dto.oculos.dp,
          adicao: dto.oculos.adicao,
          observacoes: dto.oculos.observacoes,
        },
      });
    }

    if (tipo === TipoReceita.lente_contato && dto.lente_contato) {
      await tx.receitaLenteContato.upsert({
        where: { receitaId },
        create: {
          receitaId,
          od_curva_base: dto.lente_contato.od_curva_base,
          od_diametro: dto.lente_contato.od_diametro,
          od_grau: dto.lente_contato.od_grau,
          oe_curva_base: dto.lente_contato.oe_curva_base,
          oe_diametro: dto.lente_contato.oe_diametro,
          oe_grau: dto.lente_contato.oe_grau,
          material: dto.lente_contato.material,
          marca: dto.lente_contato.marca,
          observacoes: dto.lente_contato.observacoes,
        },
        update: {
          od_curva_base: dto.lente_contato.od_curva_base,
          od_diametro: dto.lente_contato.od_diametro,
          od_grau: dto.lente_contato.od_grau,
          oe_curva_base: dto.lente_contato.oe_curva_base,
          oe_diametro: dto.lente_contato.oe_diametro,
          oe_grau: dto.lente_contato.oe_grau,
          material: dto.lente_contato.material,
          marca: dto.lente_contato.marca,
          observacoes: dto.lente_contato.observacoes,
        },
      });
    }

    if (tipo === TipoReceita.medicamento && dto.medicamento) {
      const detalheMedicamentoExistente =
        await tx.receitaMedicamento.findUnique({
          where: { receitaId },
          select: { id: true },
        });

      if (!detalheMedicamentoExistente && !dto.medicamento.medicamento) {
        throw new BadRequestException(
          'Campo medicamento é obrigatório para receitas do tipo medicamento.',
        );
      }

      await tx.receitaMedicamento.upsert({
        where: { receitaId },
        create: {
          receitaId,
          medicamento: dto.medicamento.medicamento ?? '',
          dosagem: dto.medicamento.dosagem,
          posologia: dto.medicamento.posologia,
          duracao: dto.medicamento.duracao,
          observacoes: dto.medicamento.observacoes,
        },
        update: {
          medicamento: dto.medicamento.medicamento,
          dosagem: dto.medicamento.dosagem,
          posologia: dto.medicamento.posologia,
          duracao: dto.medicamento.duracao,
          observacoes: dto.medicamento.observacoes,
        },
      });
    }
  }

  private validarDetalhesPorTipo(
    tipo: TipoReceita,
    dto: Pick<
      CreateReceitaDto | UpdateReceitaDto,
      'oculos' | 'lente_contato' | 'medicamento'
    >,
    exigirDetalhe: boolean,
  ): { valido: boolean; mensagem: string } {
    const detalhesInformados = [
      dto.oculos ? TipoReceita.oculos : null,
      dto.lente_contato ? TipoReceita.lente_contato : null,
      dto.medicamento ? TipoReceita.medicamento : null,
    ].filter((item): item is TipoReceita => item !== null);

    if (detalhesInformados.length > 1) {
      return {
        valido: false,
        mensagem: 'Informe apenas um tipo de detalhe por receita.',
      };
    }

    if (detalhesInformados.length === 1 && detalhesInformados[0] !== tipo) {
      return {
        valido: false,
        mensagem:
          'O detalhe informado não corresponde ao tipo da receita selecionado.',
      };
    }

    if (exigirDetalhe && detalhesInformados.length === 0) {
      return {
        valido: false,
        mensagem:
          'Informe os dados do detalhe correspondente ao tipo da receita.',
      };
    }

    return { valido: true, mensagem: 'ok' };
  }

  private obterDetalhePorTipo(
    dto: Pick<UpdateReceitaDto, 'oculos' | 'lente_contato' | 'medicamento'>,
    tipo: TipoReceita,
  ): object | undefined {
    if (tipo === TipoReceita.oculos) {
      return dto.oculos;
    }

    if (tipo === TipoReceita.lente_contato) {
      return dto.lente_contato;
    }

    return dto.medicamento;
  }

  private async buscarReceitaCompleta(
    id: string,
  ): Promise<ReceitaCompleta | null> {
    return this.prisma.receita.findUnique({
      where: { id },
      include: receitaInclude,
    });
  }

  private async validarReceitaExistente(
    receitaId: string,
  ): Promise<{ id: string; tipo: TipoReceita } | null> {
    return this.prisma.receita.findUnique({
      where: { id: receitaId },
      select: {
        id: true,
        tipo: true,
      },
    });
  }

  private async validarFilialEmpresa(
    filialId: string,
    empresaId: string,
  ): Promise<{ valido: boolean; mensagem: string }> {
    const filial = await this.prisma.filial.findUnique({
      where: { id: filialId },
      select: { id: true, empresaId: true },
    });

    if (!filial || filial.empresaId !== empresaId) {
      return {
        valido: false,
        mensagem: 'Filial não encontrada para a empresa informada.',
      };
    }

    return { valido: true, mensagem: 'ok' };
  }

  private async validarPaciente(
    pacienteId: string,
    filialId: string,
  ): Promise<{ valido: boolean; mensagem: string }> {
    const paciente = await this.prisma.pessoa.findUnique({
      where: { id: pacienteId },
      select: {
        id: true,
        filialId: true,
      },
    });

    if (!paciente) {
      return { valido: false, mensagem: 'Paciente não encontrado.' };
    }

    if (paciente.filialId !== filialId) {
      return {
        valido: false,
        mensagem: 'Paciente não pertence à filial informada.',
      };
    }

    return { valido: true, mensagem: 'ok' };
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
            filialId: true,
            optometrista: { select: { id: true } },
            oftalmologista: { select: { id: true } },
          },
        },
      },
    });

    if (!usuario) {
      return { valido: false, mensagem: 'Profissional não encontrado.' };
    }

    if (usuario.empresaId !== empresaId) {
      return {
        valido: false,
        mensagem: 'Profissional não pertence à empresa informada.',
      };
    }

    if (!usuario.pessoa || usuario.pessoa.filialId !== filialId) {
      return {
        valido: false,
        mensagem: 'Profissional não pertence à filial informada.',
      };
    }

    const ehProfissionalValido =
      Boolean(usuario.pessoa.optometrista) ||
      Boolean(usuario.pessoa.oftalmologista);

    if (!ehProfissionalValido) {
      return {
        valido: false,
        mensagem: 'Usuário informado não é um profissional habilitado.',
      };
    }

    return { valido: true, mensagem: 'ok' };
  }

  private async validarAtendimento(
    atendimentoId: string,
    empresaId: string,
    filialId: string,
    pacienteId: string,
    profissionalId?: string | null,
  ): Promise<{ valido: boolean; mensagem: string }> {
    const atendimento = await this.prisma.atendimento.findUnique({
      where: { id: atendimentoId },
      select: {
        id: true,
        empresaId: true,
        filialId: true,
        pacienteId: true,
        profissionalId: true,
      },
    });

    if (!atendimento) {
      return { valido: false, mensagem: 'Atendimento não encontrado.' };
    }

    if (
      atendimento.empresaId !== empresaId ||
      atendimento.filialId !== filialId
    ) {
      return {
        valido: false,
        mensagem: 'Atendimento não pertence à empresa/filial informada.',
      };
    }

    if (atendimento.pacienteId !== pacienteId) {
      return {
        valido: false,
        mensagem: 'Paciente informado não corresponde ao atendimento.',
      };
    }

    if (
      profissionalId &&
      atendimento.profissionalId &&
      atendimento.profissionalId !== profissionalId
    ) {
      return {
        valido: false,
        mensagem: 'Profissional informado não corresponde ao atendimento.',
      };
    }

    return { valido: true, mensagem: 'ok' };
  }

  private async validarProntuario(
    prontuarioId: string,
    empresaId: string,
    filialId: string,
    pacienteId: string,
    profissionalId?: string | null,
  ): Promise<{ valido: boolean; mensagem: string }> {
    const prontuario = await this.prisma.prontuario.findUnique({
      where: { id: prontuarioId },
      select: {
        id: true,
        empresaId: true,
        filialId: true,
        pacienteId: true,
        profissionalId: true,
      },
    });

    if (!prontuario) {
      return { valido: false, mensagem: 'Prontuário não encontrado.' };
    }

    if (
      prontuario.empresaId !== empresaId ||
      prontuario.filialId !== filialId
    ) {
      return {
        valido: false,
        mensagem: 'Prontuário não pertence à empresa/filial informada.',
      };
    }

    if (prontuario.pacienteId !== pacienteId) {
      return {
        valido: false,
        mensagem: 'Paciente informado não corresponde ao prontuário.',
      };
    }

    if (
      profissionalId &&
      prontuario.profissionalId &&
      prontuario.profissionalId !== profissionalId
    ) {
      return {
        valido: false,
        mensagem: 'Profissional informado não corresponde ao prontuário.',
      };
    }

    return { valido: true, mensagem: 'ok' };
  }

  private mapTipoProfissional(
    pessoa?: {
      optometrista?: { id: string } | null;
      oftalmologista?: { id: string } | null;
    } | null,
  ): 'oftalmologista' | 'optometrista' | 'nao_definido' {
    if (!pessoa) {
      return 'nao_definido';
    }

    if (pessoa.oftalmologista) {
      return 'oftalmologista';
    }

    if (pessoa.optometrista) {
      return 'optometrista';
    }

    return 'nao_definido';
  }

  private mapContexto(receita: ReceitaListaContexto): ReceitaContextoResumo {
    return {
      id: receita.id,
      filialId: receita.filialId,
      profissionalId: receita.profissionalId,
      tipo: receita.tipo,
      createdAt: receita.createdAt,
      paciente: receita.paciente,
      profissional: receita.profissional
        ? {
            id: receita.profissional.id,
            email: receita.profissional.email,
            username: receita.profissional.username,
            pessoa: receita.profissional.pessoa
              ? {
                  id: receita.profissional.pessoa.id,
                  nome: receita.profissional.pessoa.nome,
                  tipo: this.mapTipoProfissional(receita.profissional.pessoa),
                }
              : null,
          }
        : null,
      atendimento: receita.atendimento,
      prontuario: receita.prontuario,
    };
  }

  private mapOculos(
    oculos: Prisma.ReceitaOculosGetPayload<{}>,
  ): ReceitaOculosResumo {
    return {
      id: oculos.id,
      receitaId: oculos.receitaId,
      od_esferico: oculos.od_esferico,
      od_cilindrico: oculos.od_cilindrico,
      od_eixo: oculos.od_eixo,
      oe_esferico: oculos.oe_esferico,
      oe_cilindrico: oculos.oe_cilindrico,
      oe_eixo: oculos.oe_eixo,
      dp: oculos.dp,
      adicao: oculos.adicao,
      observacoes: oculos.observacoes,
    };
  }

  private mapLenteContato(
    lenteContato: Prisma.ReceitaLenteContatoGetPayload<{}>,
  ): ReceitaLenteContatoResumo {
    return {
      id: lenteContato.id,
      receitaId: lenteContato.receitaId,
      od_curva_base: lenteContato.od_curva_base,
      od_diametro: lenteContato.od_diametro,
      od_grau: lenteContato.od_grau,
      oe_curva_base: lenteContato.oe_curva_base,
      oe_diametro: lenteContato.oe_diametro,
      oe_grau: lenteContato.oe_grau,
      material: lenteContato.material,
      marca: lenteContato.marca,
      observacoes: lenteContato.observacoes,
    };
  }

  private mapMedicamento(
    medicamento: Prisma.ReceitaMedicamentoGetPayload<{}>,
  ): ReceitaMedicamentoResumo {
    return {
      id: medicamento.id,
      receitaId: medicamento.receitaId,
      medicamento: medicamento.medicamento,
      dosagem: medicamento.dosagem,
      posologia: medicamento.posologia,
      duracao: medicamento.duracao,
      observacoes: medicamento.observacoes,
    };
  }

  private mapResumo(receita: ReceitaCompleta): ReceitaResumo {
    return {
      id: receita.id,
      empresaId: receita.empresaId,
      filialId: receita.filialId,
      atendimentoId: receita.atendimentoId,
      prontuarioId: receita.prontuarioId,
      pacienteId: receita.pacienteId,
      profissionalId: receita.profissionalId,
      tipo: receita.tipo,
      observacoes: receita.observacoes,
      createdAt: receita.createdAt,
      updatedAt: receita.updatedAt,
      atendimento: receita.atendimento,
      prontuario: receita.prontuario,
      paciente: receita.paciente,
      profissional: receita.profissional
        ? {
            id: receita.profissional.id,
            email: receita.profissional.email,
            username: receita.profissional.username,
            pessoa: receita.profissional.pessoa
              ? {
                  id: receita.profissional.pessoa.id,
                  nome: receita.profissional.pessoa.nome,
                  tipo: this.mapTipoProfissional(receita.profissional.pessoa),
                }
              : null,
          }
        : null,
      oculos: receita.oculos ? this.mapOculos(receita.oculos) : null,
      lente_contato: receita.lente_contato
        ? this.mapLenteContato(receita.lente_contato)
        : null,
      medicamento: receita.medicamento
        ? this.mapMedicamento(receita.medicamento)
        : null,
    };
  }

  private mapOculosLista(
    oculos: ReceitaOculosCompleta,
  ): ReceitaOculosListaItem {
    return {
      ...this.mapOculos(oculos),
      receita: this.mapContexto(oculos.receita),
    };
  }

  private mapLenteContatoLista(
    lenteContato: ReceitaLenteContatoCompleta,
  ): ReceitaLenteContatoListaItem {
    return {
      ...this.mapLenteContato(lenteContato),
      receita: this.mapContexto(lenteContato.receita),
    };
  }

  private mapMedicamentoLista(
    medicamento: ReceitaMedicamentoCompleta,
  ): ReceitaMedicamentoListaItem {
    return {
      ...this.mapMedicamento(medicamento),
      receita: this.mapContexto(medicamento.receita),
    };
  }
}
