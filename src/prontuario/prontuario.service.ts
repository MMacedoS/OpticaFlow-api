import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateProntuarioAnamneseDto,
  CreateProntuarioAcuidadeVisualDto,
  CreateProntuarioBiomicroscopiaDto,
  CreateProntuarioCeratometriaDto,
  CreateProntuarioDiagnosticoDto,
  CreateProntuarioDto,
  CreateProntuarioEvolucaoClinicaDto,
  CreateProntuarioExameComplementarDto,
  CreateProntuarioFundoscopiaDto,
  CreateProntuarioPressaoIntraocularDto,
  CreateProntuarioRefracaoDto,
  UpdateProntuarioAnamneseDto,
  UpdateProntuarioAcuidadeVisualDto,
  UpdateProntuarioBiomicroscopiaDto,
  UpdateProntuarioCeratometriaDto,
  UpdateProntuarioDiagnosticoDto,
  UpdateProntuarioDto,
  UpdateProntuarioEvolucaoClinicaDto,
  UpdateProntuarioExameComplementarDto,
  UpdateProntuarioFundoscopiaDto,
  UpdateProntuarioPressaoIntraocularDto,
  UpdateProntuarioRefracaoDto,
} from './dto/prontuario.dto';
import {
  ProntuarioAnamneseListaItem,
  ProntuarioAnamneseResumo,
  ProntuarioAcuidadeVisualListaItem,
  ProntuarioAcuidadeVisualResumo,
  ProntuarioResumo,
} from './interfaces/prontuario.interface';

const prontuarioListSelect = {
  id: true,
  filialId: true,
  profissionalId: true,
  createdAt: true,
  atendimento: {
    select: {
      id: true,
      dataAtendimento: true,
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
} satisfies Prisma.ProntuarioSelect;

const prontuarioAnamneseListInclude = {
  prontuario: {
    select: prontuarioListSelect,
  },
} satisfies Prisma.ProntuarioAnamneseInclude;

const prontuarioAcuidadeVisualListInclude = {
  prontuario: {
    select: prontuarioListSelect,
  },
} satisfies Prisma.ProntuarioAcuidadeVisualInclude;

const prontuarioRefracaoListInclude = {
  prontuario: {
    select: prontuarioListSelect,
  },
} satisfies Prisma.ProntuarioRefracaoInclude;

const prontuarioCeratometriaListInclude = {
  prontuario: {
    select: prontuarioListSelect,
  },
} satisfies Prisma.ProntuarioCeratometriaInclude;

const prontuarioBiomicroscopiaListInclude = {
  prontuario: {
    select: prontuarioListSelect,
  },
} satisfies Prisma.ProntuarioBiomicroscopiaInclude;

const prontuarioFundoscopiaListInclude = {
  prontuario: {
    select: prontuarioListSelect,
  },
} satisfies Prisma.ProntuarioFundoscopiaInclude;

const prontuarioPressaoIntraocularListInclude = {
  prontuario: {
    select: prontuarioListSelect,
  },
} satisfies Prisma.ProntuarioPressaoIntraocularInclude;

const prontuarioDiagnosticoListInclude = {
  prontuario: {
    select: prontuarioListSelect,
  },
} satisfies Prisma.ProntuarioDiagnosticoInclude;

const prontuarioExameComplementarListInclude = {
  prontuario: {
    select: prontuarioListSelect,
  },
} satisfies Prisma.ProntuarioExameComplementarInclude;

const prontuarioEvolucaoClinicaListInclude = {
  prontuario: {
    select: prontuarioListSelect,
  },
} satisfies Prisma.ProntuarioEvolucaoClinicaInclude;

const prontuarioInclude = {
  atendimento: {
    select: {
      id: true,
      dataAtendimento: true,
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
  anamnese: true,
  acuidade_visual: true,
  refracao: true,
  ceratometria: true,
  biomicroscopia: true,
  fundoscopia: true,
  pressao_intraocular: true,
  diagnosticos: {
    orderBy: { createdAt: 'desc' },
  },
  exames_complementares: {
    orderBy: { createdAt: 'desc' },
  },
  evolucoes_clinicas: {
    orderBy: { dataEvolucao: 'desc' },
  },
} satisfies Prisma.ProntuarioInclude;

type ProntuarioCompleto = Prisma.ProntuarioGetPayload<{
  include: typeof prontuarioInclude;
}>;

type ProntuarioAnamneseCompleta = Prisma.ProntuarioAnamneseGetPayload<{
  include: typeof prontuarioAnamneseListInclude;
}>;

type ProntuarioAcuidadeVisualCompleta =
  Prisma.ProntuarioAcuidadeVisualGetPayload<{
    include: typeof prontuarioAcuidadeVisualListInclude;
  }>;

type ProntuarioListaContexto = Prisma.ProntuarioGetPayload<{
  select: typeof prontuarioListSelect;
}>;

type ProntuarioRefracaoCompleta = Prisma.ProntuarioRefracaoGetPayload<{
  include: typeof prontuarioRefracaoListInclude;
}>;

type ProntuarioCeratometriaCompleta = Prisma.ProntuarioCeratometriaGetPayload<{
  include: typeof prontuarioCeratometriaListInclude;
}>;

type ProntuarioBiomicroscopiaCompleta =
  Prisma.ProntuarioBiomicroscopiaGetPayload<{
    include: typeof prontuarioBiomicroscopiaListInclude;
  }>;

type ProntuarioFundoscopiaCompleta = Prisma.ProntuarioFundoscopiaGetPayload<{
  include: typeof prontuarioFundoscopiaListInclude;
}>;

type ProntuarioPressaoIntraocularCompleta =
  Prisma.ProntuarioPressaoIntraocularGetPayload<{
    include: typeof prontuarioPressaoIntraocularListInclude;
  }>;

type ProntuarioDiagnosticoCompleto = Prisma.ProntuarioDiagnosticoGetPayload<{
  include: typeof prontuarioDiagnosticoListInclude;
}>;

type ProntuarioExameComplementarCompleto =
  Prisma.ProntuarioExameComplementarGetPayload<{
    include: typeof prontuarioExameComplementarListInclude;
  }>;

type ProntuarioEvolucaoClinicaCompleta =
  Prisma.ProntuarioEvolucaoClinicaGetPayload<{
    include: typeof prontuarioEvolucaoClinicaListInclude;
  }>;

@Injectable()
export class ProntuarioService {
  constructor(private readonly prisma: PrismaService) {}

  async createAnamnese(
    prontuarioId: string,
    dto: CreateProntuarioAnamneseDto,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const existente = await this.prisma.prontuarioAnamnese.findUnique({
      where: { prontuarioId },
      select: { id: true },
    });

    if (existente) {
      return {
        status: 422,
        message: 'Anamnese já cadastrada para o prontuário informado.',
      };
    }

    const anamnese = await this.prisma.prontuarioAnamnese.create({
      data: {
        prontuarioId,
        historico_pessoal: dto.historico_pessoal,
        historico_familiar: dto.historico_familiar,
        alergias: dto.alergias,
        medicamentos_uso: dto.medicamentos_uso,
        observacoes: dto.observacoes,
      },
    });

    return {
      status: 201,
      message: 'Anamnese criada com sucesso.',
      data: this.mapAnamnese(anamnese),
    };
  }

  async createAcuidadeVisual(
    prontuarioId: string,
    dto: CreateProntuarioAcuidadeVisualDto,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const existente = await this.prisma.prontuarioAcuidadeVisual.findUnique({
      where: { prontuarioId },
      select: { id: true },
    });

    if (existente) {
      return {
        status: 422,
        message: 'Acuidade visual já cadastrada para o prontuário informado.',
      };
    }

    const acuidadeVisual = await this.prisma.prontuarioAcuidadeVisual.create({
      data: {
        prontuarioId,
        od_sem_correcao: dto.od_sem_correcao,
        oe_sem_correcao: dto.oe_sem_correcao,
        od_com_correcao: dto.od_com_correcao,
        oe_com_correcao: dto.oe_com_correcao,
        observacoes: dto.observacoes,
      },
    });

    return {
      status: 201,
      message: 'Acuidade visual criada com sucesso.',
      data: this.mapAcuidadeVisual(acuidadeVisual),
    };
  }

  async createRefracao(
    prontuarioId: string,
    dto: CreateProntuarioRefracaoDto,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const existente = await this.prisma.prontuarioRefracao.findUnique({
      where: { prontuarioId },
      select: { id: true },
    });

    if (existente) {
      return {
        status: 422,
        message: 'Refração já cadastrada para o prontuário informado.',
      };
    }

    const refracao = await this.prisma.prontuarioRefracao.create({
      data: {
        prontuarioId,
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
      message: 'Refração criada com sucesso.',
      data: refracao,
    };
  }

  async createCeratometria(
    prontuarioId: string,
    dto: CreateProntuarioCeratometriaDto,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const existente = await this.prisma.prontuarioCeratometria.findUnique({
      where: { prontuarioId },
      select: { id: true },
    });

    if (existente) {
      return {
        status: 422,
        message: 'Ceratometria já cadastrada para o prontuário informado.',
      };
    }

    const ceratometria = await this.prisma.prontuarioCeratometria.create({
      data: {
        prontuarioId,
        od_k1: dto.od_k1,
        od_k2: dto.od_k2,
        oe_k1: dto.oe_k1,
        oe_k2: dto.oe_k2,
        observacoes: dto.observacoes,
      },
    });

    return {
      status: 201,
      message: 'Ceratometria criada com sucesso.',
      data: ceratometria,
    };
  }

  async createBiomicroscopia(
    prontuarioId: string,
    dto: CreateProntuarioBiomicroscopiaDto,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const existente = await this.prisma.prontuarioBiomicroscopia.findUnique({
      where: { prontuarioId },
      select: { id: true },
    });

    if (existente) {
      return {
        status: 422,
        message: 'Biomicroscopia já cadastrada para o prontuário informado.',
      };
    }

    const biomicroscopia = await this.prisma.prontuarioBiomicroscopia.create({
      data: {
        prontuarioId,
        descricao: dto.descricao,
      },
    });

    return {
      status: 201,
      message: 'Biomicroscopia criada com sucesso.',
      data: biomicroscopia,
    };
  }

  async createFundoscopia(
    prontuarioId: string,
    dto: CreateProntuarioFundoscopiaDto,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const existente = await this.prisma.prontuarioFundoscopia.findUnique({
      where: { prontuarioId },
      select: { id: true },
    });

    if (existente) {
      return {
        status: 422,
        message: 'Fundoscopia já cadastrada para o prontuário informado.',
      };
    }

    const fundoscopia = await this.prisma.prontuarioFundoscopia.create({
      data: {
        prontuarioId,
        descricao: dto.descricao,
      },
    });

    return {
      status: 201,
      message: 'Fundoscopia criada com sucesso.',
      data: fundoscopia,
    };
  }

  async createPressaoIntraocular(
    prontuarioId: string,
    dto: CreateProntuarioPressaoIntraocularDto,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const existente = await this.prisma.prontuarioPressaoIntraocular.findUnique(
      {
        where: { prontuarioId },
        select: { id: true },
      },
    );

    if (existente) {
      return {
        status: 422,
        message:
          'Pressão intraocular já cadastrada para o prontuário informado.',
      };
    }

    const pressaoIntraocular =
      await this.prisma.prontuarioPressaoIntraocular.create({
        data: {
          prontuarioId,
          od_mmhg: dto.od_mmhg,
          oe_mmhg: dto.oe_mmhg,
          horario: dto.horario ? new Date(dto.horario) : undefined,
          observacoes: dto.observacoes,
        },
      });

    return {
      status: 201,
      message: 'Pressão intraocular criada com sucesso.',
      data: pressaoIntraocular,
    };
  }

  async createDiagnostico(
    prontuarioId: string,
    dto: CreateProntuarioDiagnosticoDto,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const diagnostico = await this.prisma.prontuarioDiagnostico.create({
      data: {
        prontuarioId,
        codigo: dto.codigo,
        versao: dto.versao,
        descricao: dto.descricao,
      },
    });

    return {
      status: 201,
      message: 'Diagnóstico criado com sucesso.',
      data: diagnostico,
    };
  }

  async createExameComplementar(
    prontuarioId: string,
    dto: CreateProntuarioExameComplementarDto,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const exameComplementar =
      await this.prisma.prontuarioExameComplementar.create({
        data: {
          prontuarioId,
          exame: dto.exame,
          resultado: dto.resultado,
          dataExame: dto.dataExame ? new Date(dto.dataExame) : undefined,
        },
      });

    return {
      status: 201,
      message: 'Exame complementar criado com sucesso.',
      data: exameComplementar,
    };
  }

  async createEvolucaoClinica(
    prontuarioId: string,
    dto: CreateProntuarioEvolucaoClinicaDto,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const evolucaoClinica = await this.prisma.prontuarioEvolucaoClinica.create({
      data: {
        prontuarioId,
        descricao: dto.descricao,
        dataEvolucao: dto.dataEvolucao ? new Date(dto.dataEvolucao) : undefined,
      },
    });

    return {
      status: 201,
      message: 'Evolução clínica criada com sucesso.',
      data: evolucaoClinica,
    };
  }

  async create(dto: CreateProntuarioDto): Promise<ResponseJson> {
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

    try {
      const prontuario = await this.prisma.$transaction(async (tx) => {
        const prontuarioCriado = await tx.prontuario.create({
          data: {
            empresaId: dto.empresaId,
            filialId: dto.filialId,
            atendimentoId: dto.atendimentoId,
            pacienteId: dto.pacienteId,
            profissionalId: dto.profissionalId,
            resumo_clinico: dto.resumo_clinico,
          },
        });

        await this.aplicarDadosClinicos(prontuarioCriado.id, dto, tx);

        return prontuarioCriado;
      });

      const prontoCompleto = await this.buscarProntuarioCompleto(prontuario.id);

      if (!prontoCompleto) {
        return {
          status: 422,
          message: 'Prontuário criado, mas não encontrado.',
        };
      }

      return {
        status: 201,
        message: 'Prontuário criado com sucesso.',
        data: this.mapResumo(prontoCompleto),
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return {
          status: 422,
          message: 'Já existe prontuário para o atendimento informado.',
        };
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        return {
          status: 422,
          message: 'Relacionamento inválido ao criar prontuário.',
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
    dataInicio?: string,
    dataFim?: string,
  ): Promise<ProntuarioResumo[]> {
    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, limit);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.ProntuarioWhereInput = {
      filialId,
      ...(pacienteId && { pacienteId }),
      ...(profissionalId && { profissionalId }),
      ...(atendimentoId && { atendimentoId }),
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
              { resumo_clinico: { contains: search, mode: 'insensitive' } },
              {
                paciente: {
                  nome: { contains: search, mode: 'insensitive' },
                },
              },
              {
                diagnosticos: {
                  some: {
                    OR: [
                      { codigo: { contains: search, mode: 'insensitive' } },
                      { descricao: { contains: search, mode: 'insensitive' } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };

    const prontuarios = await this.prisma.prontuario.findMany({
      skip,
      take: limitNumber,
      where,
      include: prontuarioInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return prontuarios.map((prontuario) => this.mapResumo(prontuario));
  }

  async findAllAnamneses(
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

    const where: Prisma.ProntuarioAnamneseWhereInput = {
      prontuario: {
        ...(filialId && { filialId }),
        ...(profissionalId && { profissionalId }),
      },
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
                historico_pessoal: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                historico_familiar: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                alergias: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                medicamentos_uso: {
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
                prontuario: {
                  paciente: {
                    nome: { contains: search, mode: 'insensitive' },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [anamneses, total] = await this.prisma.$transaction([
      this.prisma.prontuarioAnamnese.findMany({
        skip,
        take: limitNumber,
        where,
        include: prontuarioAnamneseListInclude,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.prontuarioAnamnese.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Anamneses listadas com sucesso.',
      data: anamneses.map((anamnese) => this.mapAnamneseLista(anamnese)),
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async findAllAcuidadesVisuais(
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

    const where: Prisma.ProntuarioAcuidadeVisualWhereInput = {
      prontuario: {
        ...(filialId && { filialId }),
        ...(profissionalId && { profissionalId }),
      },
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
              { od_sem_correcao: { contains: search, mode: 'insensitive' } },
              { oe_sem_correcao: { contains: search, mode: 'insensitive' } },
              { od_com_correcao: { contains: search, mode: 'insensitive' } },
              { oe_com_correcao: { contains: search, mode: 'insensitive' } },
              { observacoes: { contains: search, mode: 'insensitive' } },
              {
                prontuario: {
                  paciente: {
                    nome: { contains: search, mode: 'insensitive' },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [acuidadesVisuais, total] = await this.prisma.$transaction([
      this.prisma.prontuarioAcuidadeVisual.findMany({
        skip,
        take: limitNumber,
        where,
        include: prontuarioAcuidadeVisualListInclude,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.prontuarioAcuidadeVisual.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Acuidades visuais listadas com sucesso.',
      data: acuidadesVisuais.map((acuidadeVisual) =>
        this.mapAcuidadeVisualLista(acuidadeVisual),
      ),
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async findAllRefracoes(
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

    const where: Prisma.ProntuarioRefracaoWhereInput = {
      prontuario: {
        ...(filialId && { filialId }),
        ...(profissionalId && { profissionalId }),
      },
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
              { od_esferico: { contains: search, mode: 'insensitive' } },
              { od_cilindrico: { contains: search, mode: 'insensitive' } },
              { od_eixo: { contains: search, mode: 'insensitive' } },
              { oe_esferico: { contains: search, mode: 'insensitive' } },
              { oe_cilindrico: { contains: search, mode: 'insensitive' } },
              { oe_eixo: { contains: search, mode: 'insensitive' } },
              { dp: { contains: search, mode: 'insensitive' } },
              { adicao: { contains: search, mode: 'insensitive' } },
              { observacoes: { contains: search, mode: 'insensitive' } },
              {
                prontuario: {
                  paciente: {
                    nome: { contains: search, mode: 'insensitive' },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [refracoes, total] = await this.prisma.$transaction([
      this.prisma.prontuarioRefracao.findMany({
        skip,
        take: limitNumber,
        where,
        include: prontuarioRefracaoListInclude,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.prontuarioRefracao.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Refrações listadas com sucesso.',
      data: refracoes.map((refracao) => this.mapRegistroClinicoLista(refracao)),
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async findAllCeratometrias(
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

    const where: Prisma.ProntuarioCeratometriaWhereInput = {
      prontuario: {
        ...(filialId && { filialId }),
        ...(profissionalId && { profissionalId }),
      },
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
              { od_k1: { contains: search, mode: 'insensitive' } },
              { od_k2: { contains: search, mode: 'insensitive' } },
              { oe_k1: { contains: search, mode: 'insensitive' } },
              { oe_k2: { contains: search, mode: 'insensitive' } },
              { observacoes: { contains: search, mode: 'insensitive' } },
              {
                prontuario: {
                  paciente: {
                    nome: { contains: search, mode: 'insensitive' },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [ceratometrias, total] = await this.prisma.$transaction([
      this.prisma.prontuarioCeratometria.findMany({
        skip,
        take: limitNumber,
        where,
        include: prontuarioCeratometriaListInclude,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.prontuarioCeratometria.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Ceratometrias listadas com sucesso.',
      data: ceratometrias.map((ceratometria) =>
        this.mapRegistroClinicoLista(ceratometria),
      ),
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async findAllBiomicroscopias(
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

    const where: Prisma.ProntuarioBiomicroscopiaWhereInput = {
      prontuario: {
        ...(filialId && { filialId }),
        ...(profissionalId && { profissionalId }),
      },
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
              { descricao: { contains: search, mode: 'insensitive' } },
              {
                prontuario: {
                  paciente: {
                    nome: { contains: search, mode: 'insensitive' },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [biomicroscopias, total] = await this.prisma.$transaction([
      this.prisma.prontuarioBiomicroscopia.findMany({
        skip,
        take: limitNumber,
        where,
        include: prontuarioBiomicroscopiaListInclude,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.prontuarioBiomicroscopia.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Biomicroscopias listadas com sucesso.',
      data: biomicroscopias.map((biomicroscopia) =>
        this.mapRegistroClinicoLista(biomicroscopia),
      ),
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async findAllFundoscopias(
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

    const where: Prisma.ProntuarioFundoscopiaWhereInput = {
      prontuario: {
        ...(filialId && { filialId }),
        ...(profissionalId && { profissionalId }),
      },
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
              { descricao: { contains: search, mode: 'insensitive' } },
              {
                prontuario: {
                  paciente: {
                    nome: { contains: search, mode: 'insensitive' },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [fundoscopias, total] = await this.prisma.$transaction([
      this.prisma.prontuarioFundoscopia.findMany({
        skip,
        take: limitNumber,
        where,
        include: prontuarioFundoscopiaListInclude,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.prontuarioFundoscopia.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Fundoscopias listadas com sucesso.',
      data: fundoscopias.map((fundoscopia) =>
        this.mapRegistroClinicoLista(fundoscopia),
      ),
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async findAllPressoesIntraoculares(
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

    const where: Prisma.ProntuarioPressaoIntraocularWhereInput = {
      prontuario: {
        ...(filialId && { filialId }),
        ...(profissionalId && { profissionalId }),
      },
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
              { observacoes: { contains: search, mode: 'insensitive' } },
              {
                prontuario: {
                  paciente: {
                    nome: { contains: search, mode: 'insensitive' },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [pressoesIntraoculares, total] = await this.prisma.$transaction([
      this.prisma.prontuarioPressaoIntraocular.findMany({
        skip,
        take: limitNumber,
        where,
        include: prontuarioPressaoIntraocularListInclude,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.prontuarioPressaoIntraocular.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Pressões intraoculares listadas com sucesso.',
      data: pressoesIntraoculares.map((pressaoIntraocular) =>
        this.mapRegistroClinicoLista(pressaoIntraocular),
      ),
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async findAllDiagnosticos(
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

    const where: Prisma.ProntuarioDiagnosticoWhereInput = {
      prontuario: {
        ...(filialId && { filialId }),
        ...(profissionalId && { profissionalId }),
      },
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
              { codigo: { contains: search, mode: 'insensitive' } },
              { versao: { contains: search, mode: 'insensitive' } },
              { descricao: { contains: search, mode: 'insensitive' } },
              {
                prontuario: {
                  paciente: {
                    nome: { contains: search, mode: 'insensitive' },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [diagnosticos, total] = await this.prisma.$transaction([
      this.prisma.prontuarioDiagnostico.findMany({
        skip,
        take: limitNumber,
        where,
        include: prontuarioDiagnosticoListInclude,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.prontuarioDiagnostico.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Diagnósticos listados com sucesso.',
      data: diagnosticos.map((diagnostico) =>
        this.mapRegistroClinicoLista(diagnostico),
      ),
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async findAllExamesComplementares(
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

    const where: Prisma.ProntuarioExameComplementarWhereInput = {
      prontuario: {
        ...(filialId && { filialId }),
        ...(profissionalId && { profissionalId }),
      },
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
              { exame: { contains: search, mode: 'insensitive' } },
              { resultado: { contains: search, mode: 'insensitive' } },
              {
                prontuario: {
                  paciente: {
                    nome: { contains: search, mode: 'insensitive' },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [examesComplementares, total] = await this.prisma.$transaction([
      this.prisma.prontuarioExameComplementar.findMany({
        skip,
        take: limitNumber,
        where,
        include: prontuarioExameComplementarListInclude,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.prontuarioExameComplementar.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Exames complementares listados com sucesso.',
      data: examesComplementares.map((exameComplementar) =>
        this.mapRegistroClinicoLista(exameComplementar),
      ),
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async findAllEvolucoesClinicas(
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

    const where: Prisma.ProntuarioEvolucaoClinicaWhereInput = {
      prontuario: {
        ...(filialId && { filialId }),
        ...(profissionalId && { profissionalId }),
      },
      ...(dataInicio || dataFim
        ? {
            dataEvolucao: {
              ...(dataInicio && { gte: new Date(dataInicio) }),
              ...(dataFim && { lte: new Date(dataFim) }),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { descricao: { contains: search, mode: 'insensitive' } },
              {
                prontuario: {
                  paciente: {
                    nome: { contains: search, mode: 'insensitive' },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [evolucoesClinicas, total] = await this.prisma.$transaction([
      this.prisma.prontuarioEvolucaoClinica.findMany({
        skip,
        take: limitNumber,
        where,
        include: prontuarioEvolucaoClinicaListInclude,
        orderBy: {
          dataEvolucao: 'desc',
        },
      }),
      this.prisma.prontuarioEvolucaoClinica.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Evoluções clínicas listadas com sucesso.',
      data: evolucoesClinicas.map((evolucaoClinica) =>
        this.mapRegistroClinicoLista(evolucaoClinica),
      ),
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async findById(id: string): Promise<ResponseJson> {
    const prontuario = await this.buscarProntuarioCompleto(id);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    return {
      status: 200,
      message: 'Prontuário encontrado.',
      data: this.mapResumo(prontuario),
    };
  }

  async findAnamneseByProntuarioId(
    prontuarioId: string,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const anamnese = await this.prisma.prontuarioAnamnese.findUnique({
      where: { prontuarioId },
    });

    if (!anamnese) {
      return { status: 422, message: 'Anamnese não encontrada.' };
    }

    return {
      status: 200,
      message: 'Anamnese encontrada.',
      data: this.mapAnamnese(anamnese),
    };
  }

  async findAcuidadeVisualByProntuarioId(
    prontuarioId: string,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const acuidadeVisual =
      await this.prisma.prontuarioAcuidadeVisual.findUnique({
        where: { prontuarioId },
      });

    if (!acuidadeVisual) {
      return { status: 422, message: 'Acuidade visual não encontrada.' };
    }

    return {
      status: 200,
      message: 'Acuidade visual encontrada.',
      data: this.mapAcuidadeVisual(acuidadeVisual),
    };
  }

  async findRefracaoByProntuarioId(
    prontuarioId: string,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const refracao = await this.prisma.prontuarioRefracao.findUnique({
      where: { prontuarioId },
    });

    if (!refracao) {
      return { status: 422, message: 'Refração não encontrada.' };
    }

    return {
      status: 200,
      message: 'Refração encontrada.',
      data: refracao,
    };
  }

  async findCeratometriaByProntuarioId(
    prontuarioId: string,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const ceratometria = await this.prisma.prontuarioCeratometria.findUnique({
      where: { prontuarioId },
    });

    if (!ceratometria) {
      return { status: 422, message: 'Ceratometria não encontrada.' };
    }

    return {
      status: 200,
      message: 'Ceratometria encontrada.',
      data: ceratometria,
    };
  }

  async findBiomicroscopiaByProntuarioId(
    prontuarioId: string,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const biomicroscopia =
      await this.prisma.prontuarioBiomicroscopia.findUnique({
        where: { prontuarioId },
      });

    if (!biomicroscopia) {
      return { status: 422, message: 'Biomicroscopia não encontrada.' };
    }

    return {
      status: 200,
      message: 'Biomicroscopia encontrada.',
      data: biomicroscopia,
    };
  }

  async findFundoscopiaByProntuarioId(
    prontuarioId: string,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const fundoscopia = await this.prisma.prontuarioFundoscopia.findUnique({
      where: { prontuarioId },
    });

    if (!fundoscopia) {
      return { status: 422, message: 'Fundoscopia não encontrada.' };
    }

    return {
      status: 200,
      message: 'Fundoscopia encontrada.',
      data: fundoscopia,
    };
  }

  async findPressaoIntraocularByProntuarioId(
    prontuarioId: string,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const pressaoIntraocular =
      await this.prisma.prontuarioPressaoIntraocular.findUnique({
        where: { prontuarioId },
      });

    if (!pressaoIntraocular) {
      return { status: 422, message: 'Pressão intraocular não encontrada.' };
    }

    return {
      status: 200,
      message: 'Pressão intraocular encontrada.',
      data: pressaoIntraocular,
    };
  }

  async findDiagnosticosByProntuarioId(
    prontuarioId: string,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const diagnosticos = await this.prisma.prontuarioDiagnostico.findMany({
      where: { prontuarioId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      status: 200,
      message: 'Diagnósticos encontrados.',
      data: diagnosticos,
    };
  }

  async findExamesComplementaresByProntuarioId(
    prontuarioId: string,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const examesComplementares =
      await this.prisma.prontuarioExameComplementar.findMany({
        where: { prontuarioId },
        orderBy: { createdAt: 'desc' },
      });

    return {
      status: 200,
      message: 'Exames complementares encontrados.',
      data: examesComplementares,
    };
  }

  async findEvolucoesClinicasByProntuarioId(
    prontuarioId: string,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const evolucoesClinicas =
      await this.prisma.prontuarioEvolucaoClinica.findMany({
        where: { prontuarioId },
        orderBy: { dataEvolucao: 'desc' },
      });

    return {
      status: 200,
      message: 'Evoluções clínicas encontradas.',
      data: evolucoesClinicas,
    };
  }

  async update(id: string, dto: UpdateProntuarioDto): Promise<ResponseJson> {
    const prontuario = await this.prisma.prontuario.findUnique({
      where: { id },
      select: {
        id: true,
        empresaId: true,
        filialId: true,
        atendimentoId: true,
        pacienteId: true,
        profissionalId: true,
      },
    });

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const empresaIdDestino = dto.empresaId ?? prontuario.empresaId;
    const filialIdDestino = dto.filialId ?? prontuario.filialId;
    const atendimentoIdDestino = dto.atendimentoId ?? prontuario.atendimentoId;
    const pacienteIdDestino = dto.pacienteId ?? prontuario.pacienteId;
    const profissionalIdDestino =
      dto.profissionalId ?? prontuario.profissionalId;

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

    const validacaoAtendimento = await this.validarAtendimento(
      atendimentoIdDestino,
      empresaIdDestino,
      filialIdDestino,
      pacienteIdDestino,
      profissionalIdDestino,
      id,
    );

    if (!validacaoAtendimento.valido) {
      return { status: 422, message: validacaoAtendimento.mensagem };
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.prontuario.update({
          where: { id },
          data: {
            empresaId: dto.empresaId,
            filialId: dto.filialId,
            atendimentoId: dto.atendimentoId,
            pacienteId: dto.pacienteId,
            profissionalId: dto.profissionalId,
            resumo_clinico: dto.resumo_clinico,
          },
        });

        await this.aplicarDadosClinicos(id, dto, tx);
      });

      return this.findById(id);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return {
          status: 422,
          message: 'Já existe prontuário para o atendimento informado.',
        };
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        return {
          status: 422,
          message: 'Relacionamento inválido ao atualizar prontuário.',
        };
      }

      throw error;
    }
  }

  async updateAnamnese(
    prontuarioId: string,
    dto: UpdateProntuarioAnamneseDto,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const anamnese = await this.prisma.prontuarioAnamnese.findUnique({
      where: { prontuarioId },
    });

    if (!anamnese) {
      return { status: 422, message: 'Anamnese não encontrada.' };
    }

    const anamneseAtualizada = await this.prisma.prontuarioAnamnese.update({
      where: { prontuarioId },
      data: {
        historico_pessoal: dto.historico_pessoal,
        historico_familiar: dto.historico_familiar,
        alergias: dto.alergias,
        medicamentos_uso: dto.medicamentos_uso,
        observacoes: dto.observacoes,
      },
    });

    return {
      status: 200,
      message: 'Anamnese atualizada com sucesso.',
      data: this.mapAnamnese(anamneseAtualizada),
    };
  }

  async updateAcuidadeVisual(
    prontuarioId: string,
    dto: UpdateProntuarioAcuidadeVisualDto,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const acuidadeVisual =
      await this.prisma.prontuarioAcuidadeVisual.findUnique({
        where: { prontuarioId },
      });

    if (!acuidadeVisual) {
      return { status: 422, message: 'Acuidade visual não encontrada.' };
    }

    const acuidadeVisualAtualizada =
      await this.prisma.prontuarioAcuidadeVisual.update({
        where: { prontuarioId },
        data: {
          od_sem_correcao: dto.od_sem_correcao,
          oe_sem_correcao: dto.oe_sem_correcao,
          od_com_correcao: dto.od_com_correcao,
          oe_com_correcao: dto.oe_com_correcao,
          observacoes: dto.observacoes,
        },
      });

    return {
      status: 200,
      message: 'Acuidade visual atualizada com sucesso.',
      data: this.mapAcuidadeVisual(acuidadeVisualAtualizada),
    };
  }

  async updateRefracao(
    prontuarioId: string,
    dto: UpdateProntuarioRefracaoDto,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const refracao = await this.prisma.prontuarioRefracao.findUnique({
      where: { prontuarioId },
      select: { id: true },
    });

    if (!refracao) {
      return { status: 422, message: 'Refração não encontrada.' };
    }

    const refracaoAtualizada = await this.prisma.prontuarioRefracao.update({
      where: { prontuarioId },
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
      message: 'Refração atualizada com sucesso.',
      data: refracaoAtualizada,
    };
  }

  async updateCeratometria(
    prontuarioId: string,
    dto: UpdateProntuarioCeratometriaDto,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const ceratometria = await this.prisma.prontuarioCeratometria.findUnique({
      where: { prontuarioId },
      select: { id: true },
    });

    if (!ceratometria) {
      return { status: 422, message: 'Ceratometria não encontrada.' };
    }

    const ceratometriaAtualizada =
      await this.prisma.prontuarioCeratometria.update({
        where: { prontuarioId },
        data: {
          od_k1: dto.od_k1,
          od_k2: dto.od_k2,
          oe_k1: dto.oe_k1,
          oe_k2: dto.oe_k2,
          observacoes: dto.observacoes,
        },
      });

    return {
      status: 200,
      message: 'Ceratometria atualizada com sucesso.',
      data: ceratometriaAtualizada,
    };
  }

  async updateBiomicroscopia(
    prontuarioId: string,
    dto: UpdateProntuarioBiomicroscopiaDto,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const biomicroscopia =
      await this.prisma.prontuarioBiomicroscopia.findUnique({
        where: { prontuarioId },
        select: { id: true },
      });

    if (!biomicroscopia) {
      return { status: 422, message: 'Biomicroscopia não encontrada.' };
    }

    const biomicroscopiaAtualizada =
      await this.prisma.prontuarioBiomicroscopia.update({
        where: { prontuarioId },
        data: {
          descricao: dto.descricao,
        },
      });

    return {
      status: 200,
      message: 'Biomicroscopia atualizada com sucesso.',
      data: biomicroscopiaAtualizada,
    };
  }

  async updateFundoscopia(
    prontuarioId: string,
    dto: UpdateProntuarioFundoscopiaDto,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const fundoscopia = await this.prisma.prontuarioFundoscopia.findUnique({
      where: { prontuarioId },
      select: { id: true },
    });

    if (!fundoscopia) {
      return { status: 422, message: 'Fundoscopia não encontrada.' };
    }

    const fundoscopiaAtualizada =
      await this.prisma.prontuarioFundoscopia.update({
        where: { prontuarioId },
        data: {
          descricao: dto.descricao,
        },
      });

    return {
      status: 200,
      message: 'Fundoscopia atualizada com sucesso.',
      data: fundoscopiaAtualizada,
    };
  }

  async updatePressaoIntraocular(
    prontuarioId: string,
    dto: UpdateProntuarioPressaoIntraocularDto,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const pressaoIntraocular =
      await this.prisma.prontuarioPressaoIntraocular.findUnique({
        where: { prontuarioId },
        select: { id: true },
      });

    if (!pressaoIntraocular) {
      return { status: 422, message: 'Pressão intraocular não encontrada.' };
    }

    const pressaoIntraocularAtualizada =
      await this.prisma.prontuarioPressaoIntraocular.update({
        where: { prontuarioId },
        data: {
          od_mmhg: dto.od_mmhg,
          oe_mmhg: dto.oe_mmhg,
          horario: dto.horario ? new Date(dto.horario) : undefined,
          observacoes: dto.observacoes,
        },
      });

    return {
      status: 200,
      message: 'Pressão intraocular atualizada com sucesso.',
      data: pressaoIntraocularAtualizada,
    };
  }

  async updateDiagnostico(
    prontuarioId: string,
    diagnosticoId: string,
    dto: UpdateProntuarioDiagnosticoDto,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const diagnostico = await this.prisma.prontuarioDiagnostico.findFirst({
      where: { id: diagnosticoId, prontuarioId },
      select: { id: true },
    });

    if (!diagnostico) {
      return { status: 422, message: 'Diagnóstico não encontrado.' };
    }

    const diagnosticoAtualizado =
      await this.prisma.prontuarioDiagnostico.update({
        where: { id: diagnosticoId },
        data: {
          codigo: dto.codigo,
          versao: dto.versao,
          descricao: dto.descricao,
        },
      });

    return {
      status: 200,
      message: 'Diagnóstico atualizado com sucesso.',
      data: diagnosticoAtualizado,
    };
  }

  async updateExameComplementar(
    prontuarioId: string,
    exameComplementarId: string,
    dto: UpdateProntuarioExameComplementarDto,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const exameComplementar =
      await this.prisma.prontuarioExameComplementar.findFirst({
        where: { id: exameComplementarId, prontuarioId },
        select: { id: true },
      });

    if (!exameComplementar) {
      return { status: 422, message: 'Exame complementar não encontrado.' };
    }

    const exameComplementarAtualizado =
      await this.prisma.prontuarioExameComplementar.update({
        where: { id: exameComplementarId },
        data: {
          exame: dto.exame,
          resultado: dto.resultado,
          dataExame: dto.dataExame ? new Date(dto.dataExame) : undefined,
        },
      });

    return {
      status: 200,
      message: 'Exame complementar atualizado com sucesso.',
      data: exameComplementarAtualizado,
    };
  }

  async updateEvolucaoClinica(
    prontuarioId: string,
    evolucaoClinicaId: string,
    dto: UpdateProntuarioEvolucaoClinicaDto,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const evolucaoClinica =
      await this.prisma.prontuarioEvolucaoClinica.findFirst({
        where: { id: evolucaoClinicaId, prontuarioId },
        select: { id: true },
      });

    if (!evolucaoClinica) {
      return { status: 422, message: 'Evolução clínica não encontrada.' };
    }

    const evolucaoClinicaAtualizada =
      await this.prisma.prontuarioEvolucaoClinica.update({
        where: { id: evolucaoClinicaId },
        data: {
          descricao: dto.descricao,
          dataEvolucao: dto.dataEvolucao
            ? new Date(dto.dataEvolucao)
            : undefined,
        },
      });

    return {
      status: 200,
      message: 'Evolução clínica atualizada com sucesso.',
      data: evolucaoClinicaAtualizada,
    };
  }

  async deleteById(id: string): Promise<ResponseJson> {
    const prontuario = await this.prisma.prontuario.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    await this.prisma.prontuario.delete({ where: { id } });

    return { status: 200, message: 'Prontuário deletado com sucesso.' };
  }

  async deleteAnamneseByProntuarioId(
    prontuarioId: string,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const anamnese = await this.prisma.prontuarioAnamnese.findUnique({
      where: { prontuarioId },
      select: { id: true },
    });

    if (!anamnese) {
      return { status: 422, message: 'Anamnese não encontrada.' };
    }

    await this.prisma.prontuarioAnamnese.delete({
      where: { prontuarioId },
    });

    return { status: 200, message: 'Anamnese deletada com sucesso.' };
  }

  async deleteAcuidadeVisualByProntuarioId(
    prontuarioId: string,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const acuidadeVisual =
      await this.prisma.prontuarioAcuidadeVisual.findUnique({
        where: { prontuarioId },
        select: { id: true },
      });

    if (!acuidadeVisual) {
      return { status: 422, message: 'Acuidade visual não encontrada.' };
    }

    await this.prisma.prontuarioAcuidadeVisual.delete({
      where: { prontuarioId },
    });

    return {
      status: 200,
      message: 'Acuidade visual deletada com sucesso.',
    };
  }

  async deleteRefracaoByProntuarioId(
    prontuarioId: string,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const refracao = await this.prisma.prontuarioRefracao.findUnique({
      where: { prontuarioId },
      select: { id: true },
    });

    if (!refracao) {
      return { status: 422, message: 'Refração não encontrada.' };
    }

    await this.prisma.prontuarioRefracao.delete({
      where: { prontuarioId },
    });

    return { status: 200, message: 'Refração deletada com sucesso.' };
  }

  async deleteCeratometriaByProntuarioId(
    prontuarioId: string,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const ceratometria = await this.prisma.prontuarioCeratometria.findUnique({
      where: { prontuarioId },
      select: { id: true },
    });

    if (!ceratometria) {
      return { status: 422, message: 'Ceratometria não encontrada.' };
    }

    await this.prisma.prontuarioCeratometria.delete({
      where: { prontuarioId },
    });

    return { status: 200, message: 'Ceratometria deletada com sucesso.' };
  }

  async deleteBiomicroscopiaByProntuarioId(
    prontuarioId: string,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const biomicroscopia =
      await this.prisma.prontuarioBiomicroscopia.findUnique({
        where: { prontuarioId },
        select: { id: true },
      });

    if (!biomicroscopia) {
      return { status: 422, message: 'Biomicroscopia não encontrada.' };
    }

    await this.prisma.prontuarioBiomicroscopia.delete({
      where: { prontuarioId },
    });

    return { status: 200, message: 'Biomicroscopia deletada com sucesso.' };
  }

  async deleteFundoscopiaByProntuarioId(
    prontuarioId: string,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const fundoscopia = await this.prisma.prontuarioFundoscopia.findUnique({
      where: { prontuarioId },
      select: { id: true },
    });

    if (!fundoscopia) {
      return { status: 422, message: 'Fundoscopia não encontrada.' };
    }

    await this.prisma.prontuarioFundoscopia.delete({
      where: { prontuarioId },
    });

    return { status: 200, message: 'Fundoscopia deletada com sucesso.' };
  }

  async deletePressaoIntraocularByProntuarioId(
    prontuarioId: string,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const pressaoIntraocular =
      await this.prisma.prontuarioPressaoIntraocular.findUnique({
        where: { prontuarioId },
        select: { id: true },
      });

    if (!pressaoIntraocular) {
      return { status: 422, message: 'Pressão intraocular não encontrada.' };
    }

    await this.prisma.prontuarioPressaoIntraocular.delete({
      where: { prontuarioId },
    });

    return {
      status: 200,
      message: 'Pressão intraocular deletada com sucesso.',
    };
  }

  async deleteDiagnostico(
    prontuarioId: string,
    diagnosticoId: string,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const diagnostico = await this.prisma.prontuarioDiagnostico.findFirst({
      where: { id: diagnosticoId, prontuarioId },
      select: { id: true },
    });

    if (!diagnostico) {
      return { status: 422, message: 'Diagnóstico não encontrado.' };
    }

    await this.prisma.prontuarioDiagnostico.delete({
      where: { id: diagnosticoId },
    });

    return { status: 200, message: 'Diagnóstico deletado com sucesso.' };
  }

  async deleteExameComplementar(
    prontuarioId: string,
    exameComplementarId: string,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const exameComplementar =
      await this.prisma.prontuarioExameComplementar.findFirst({
        where: { id: exameComplementarId, prontuarioId },
        select: { id: true },
      });

    if (!exameComplementar) {
      return { status: 422, message: 'Exame complementar não encontrado.' };
    }

    await this.prisma.prontuarioExameComplementar.delete({
      where: { id: exameComplementarId },
    });

    return {
      status: 200,
      message: 'Exame complementar deletado com sucesso.',
    };
  }

  async deleteEvolucaoClinica(
    prontuarioId: string,
    evolucaoClinicaId: string,
  ): Promise<ResponseJson> {
    const prontuario = await this.validarProntuarioExistente(prontuarioId);

    if (!prontuario) {
      return { status: 422, message: 'Prontuário não encontrado.' };
    }

    const evolucaoClinica =
      await this.prisma.prontuarioEvolucaoClinica.findFirst({
        where: { id: evolucaoClinicaId, prontuarioId },
        select: { id: true },
      });

    if (!evolucaoClinica) {
      return { status: 422, message: 'Evolução clínica não encontrada.' };
    }

    await this.prisma.prontuarioEvolucaoClinica.delete({
      where: { id: evolucaoClinicaId },
    });

    return {
      status: 200,
      message: 'Evolução clínica deletada com sucesso.',
    };
  }

  private async aplicarDadosClinicos(
    prontuarioId: string,
    dto: CreateProntuarioDto | UpdateProntuarioDto,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    if (dto.anamnese) {
      await tx.prontuarioAnamnese.upsert({
        where: { prontuarioId },
        update: {
          historico_pessoal: dto.anamnese.historico_pessoal,
          historico_familiar: dto.anamnese.historico_familiar,
          alergias: dto.anamnese.alergias,
          medicamentos_uso: dto.anamnese.medicamentos_uso,
          observacoes: dto.anamnese.observacoes,
        },
        create: {
          prontuarioId,
          historico_pessoal: dto.anamnese.historico_pessoal,
          historico_familiar: dto.anamnese.historico_familiar,
          alergias: dto.anamnese.alergias,
          medicamentos_uso: dto.anamnese.medicamentos_uso,
          observacoes: dto.anamnese.observacoes,
        },
      });
    }

    if (dto.acuidade_visual) {
      await tx.prontuarioAcuidadeVisual.upsert({
        where: { prontuarioId },
        update: {
          od_sem_correcao: dto.acuidade_visual.od_sem_correcao,
          oe_sem_correcao: dto.acuidade_visual.oe_sem_correcao,
          od_com_correcao: dto.acuidade_visual.od_com_correcao,
          oe_com_correcao: dto.acuidade_visual.oe_com_correcao,
          observacoes: dto.acuidade_visual.observacoes,
        },
        create: {
          prontuarioId,
          od_sem_correcao: dto.acuidade_visual.od_sem_correcao,
          oe_sem_correcao: dto.acuidade_visual.oe_sem_correcao,
          od_com_correcao: dto.acuidade_visual.od_com_correcao,
          oe_com_correcao: dto.acuidade_visual.oe_com_correcao,
          observacoes: dto.acuidade_visual.observacoes,
        },
      });
    }

    if (dto.refracao) {
      await tx.prontuarioRefracao.upsert({
        where: { prontuarioId },
        update: {
          od_esferico: dto.refracao.od_esferico,
          od_cilindrico: dto.refracao.od_cilindrico,
          od_eixo: dto.refracao.od_eixo,
          oe_esferico: dto.refracao.oe_esferico,
          oe_cilindrico: dto.refracao.oe_cilindrico,
          oe_eixo: dto.refracao.oe_eixo,
          dp: dto.refracao.dp,
          adicao: dto.refracao.adicao,
          observacoes: dto.refracao.observacoes,
        },
        create: {
          prontuarioId,
          od_esferico: dto.refracao.od_esferico,
          od_cilindrico: dto.refracao.od_cilindrico,
          od_eixo: dto.refracao.od_eixo,
          oe_esferico: dto.refracao.oe_esferico,
          oe_cilindrico: dto.refracao.oe_cilindrico,
          oe_eixo: dto.refracao.oe_eixo,
          dp: dto.refracao.dp,
          adicao: dto.refracao.adicao,
          observacoes: dto.refracao.observacoes,
        },
      });
    }

    if (dto.ceratometria) {
      await tx.prontuarioCeratometria.upsert({
        where: { prontuarioId },
        update: {
          od_k1: dto.ceratometria.od_k1,
          od_k2: dto.ceratometria.od_k2,
          oe_k1: dto.ceratometria.oe_k1,
          oe_k2: dto.ceratometria.oe_k2,
          observacoes: dto.ceratometria.observacoes,
        },
        create: {
          prontuarioId,
          od_k1: dto.ceratometria.od_k1,
          od_k2: dto.ceratometria.od_k2,
          oe_k1: dto.ceratometria.oe_k1,
          oe_k2: dto.ceratometria.oe_k2,
          observacoes: dto.ceratometria.observacoes,
        },
      });
    }

    if (dto.biomicroscopia) {
      await tx.prontuarioBiomicroscopia.upsert({
        where: { prontuarioId },
        update: {
          descricao: dto.biomicroscopia.descricao,
        },
        create: {
          prontuarioId,
          descricao: dto.biomicroscopia.descricao,
        },
      });
    }

    if (dto.fundoscopia) {
      await tx.prontuarioFundoscopia.upsert({
        where: { prontuarioId },
        update: {
          descricao: dto.fundoscopia.descricao,
        },
        create: {
          prontuarioId,
          descricao: dto.fundoscopia.descricao,
        },
      });
    }

    if (dto.pressao_intraocular) {
      await tx.prontuarioPressaoIntraocular.upsert({
        where: { prontuarioId },
        update: {
          od_mmhg: dto.pressao_intraocular.od_mmhg,
          oe_mmhg: dto.pressao_intraocular.oe_mmhg,
          horario: dto.pressao_intraocular.horario
            ? new Date(dto.pressao_intraocular.horario)
            : undefined,
          observacoes: dto.pressao_intraocular.observacoes,
        },
        create: {
          prontuarioId,
          od_mmhg: dto.pressao_intraocular.od_mmhg,
          oe_mmhg: dto.pressao_intraocular.oe_mmhg,
          horario: dto.pressao_intraocular.horario
            ? new Date(dto.pressao_intraocular.horario)
            : undefined,
          observacoes: dto.pressao_intraocular.observacoes,
        },
      });
    }

    if (dto.diagnosticos !== undefined) {
      await tx.prontuarioDiagnostico.deleteMany({
        where: { prontuarioId },
      });

      if (dto.diagnosticos.length > 0) {
        await tx.prontuarioDiagnostico.createMany({
          data: dto.diagnosticos.map((diagnostico) => ({
            prontuarioId,
            codigo: diagnostico.codigo,
            versao: diagnostico.versao,
            descricao: diagnostico.descricao,
          })),
        });
      }
    }

    if (dto.exames_complementares !== undefined) {
      await tx.prontuarioExameComplementar.deleteMany({
        where: { prontuarioId },
      });

      if (dto.exames_complementares.length > 0) {
        await tx.prontuarioExameComplementar.createMany({
          data: dto.exames_complementares.map((exame) => ({
            prontuarioId,
            exame: exame.exame,
            resultado: exame.resultado,
            dataExame: exame.dataExame ? new Date(exame.dataExame) : undefined,
          })),
        });
      }
    }

    if (dto.evolucoes_clinicas !== undefined) {
      await tx.prontuarioEvolucaoClinica.deleteMany({
        where: { prontuarioId },
      });

      if (dto.evolucoes_clinicas.length > 0) {
        await tx.prontuarioEvolucaoClinica.createMany({
          data: dto.evolucoes_clinicas.map((evolucao) => ({
            prontuarioId,
            descricao: evolucao.descricao,
            dataEvolucao: evolucao.dataEvolucao
              ? new Date(evolucao.dataEvolucao)
              : undefined,
          })),
        });
      }
    }
  }

  private async buscarProntuarioCompleto(
    id: string,
  ): Promise<ProntuarioCompleto | null> {
    return this.prisma.prontuario.findUnique({
      where: { id },
      include: prontuarioInclude,
    });
  }

  private async validarProntuarioExistente(
    prontuarioId: string,
  ): Promise<{ id: string } | null> {
    return this.prisma.prontuario.findUnique({
      where: { id: prontuarioId },
      select: { id: true },
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

    return { valido: true, mensagem: 'Filial válida.' };
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
      return { valido: false, mensagem: 'Paciente não encontrado.' };
    }

    if (paciente.filialId !== filialId) {
      return {
        valido: false,
        mensagem: 'Paciente não pertence à filial informada.',
      };
    }

    return { valido: true, mensagem: 'Paciente válido.' };
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

    return { valido: true, mensagem: 'Profissional válido.' };
  }

  private async validarAtendimento(
    atendimentoId: string,
    empresaId: string,
    filialId: string,
    pacienteId: string,
    profissionalId?: string | null,
    prontuarioAtualId?: string,
  ): Promise<{ valido: boolean; mensagem: string }> {
    const atendimento = await this.prisma.atendimento.findUnique({
      where: { id: atendimentoId },
      select: {
        id: true,
        empresaId: true,
        filialId: true,
        pacienteId: true,
        profissionalId: true,
        prontuario: {
          select: {
            id: true,
          },
        },
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
        mensagem: 'Paciente informado difere do paciente do atendimento.',
      };
    }

    if (
      profissionalId &&
      atendimento.profissionalId &&
      atendimento.profissionalId !== profissionalId
    ) {
      return {
        valido: false,
        mensagem:
          'Profissional informado difere do profissional do atendimento.',
      };
    }

    if (
      atendimento.prontuario &&
      atendimento.prontuario.id !== prontuarioAtualId
    ) {
      return {
        valido: false,
        mensagem: 'Atendimento já possui prontuário vinculado.',
      };
    }

    return {
      valido: true,
      mensagem: 'Atendimento válido.',
    };
  }

  private mapResumo(prontuario: ProntuarioCompleto): ProntuarioResumo {
    return {
      id: prontuario.id,
      empresaId: prontuario.empresaId,
      filialId: prontuario.filialId,
      atendimentoId: prontuario.atendimentoId,
      pacienteId: prontuario.pacienteId,
      profissionalId: prontuario.profissionalId,
      resumo_clinico: prontuario.resumo_clinico,
      createdAt: prontuario.createdAt,
      updatedAt: prontuario.updatedAt,
      atendimento: prontuario.atendimento,
      paciente: prontuario.paciente,
      profissional: prontuario.profissional
        ? {
            id: prontuario.profissional.id,
            email: prontuario.profissional.email,
            username: prontuario.profissional.username,
            pessoa: prontuario.profissional.pessoa
              ? {
                  id: prontuario.profissional.pessoa.id,
                  nome: prontuario.profissional.pessoa.nome,
                  tipo: prontuario.profissional.pessoa.oftalmologista
                    ? 'oftalmologista'
                    : prontuario.profissional.pessoa.optometrista
                      ? 'optometrista'
                      : 'nao_definido',
                }
              : null,
          }
        : null,
      anamnese: prontuario.anamnese,
      acuidade_visual: prontuario.acuidade_visual,
      refracao: prontuario.refracao,
      ceratometria: prontuario.ceratometria,
      biomicroscopia: prontuario.biomicroscopia,
      fundoscopia: prontuario.fundoscopia,
      pressao_intraocular: prontuario.pressao_intraocular,
      diagnosticos: prontuario.diagnosticos,
      exames_complementares: prontuario.exames_complementares,
      evolucoes_clinicas: prontuario.evolucoes_clinicas,
    };
  }

  private mapAnamnese(
    anamnese: Prisma.ProntuarioAnamneseGetPayload<Record<string, never>>,
  ): ProntuarioAnamneseResumo {
    return {
      id: anamnese.id,
      prontuarioId: anamnese.prontuarioId,
      historico_pessoal: anamnese.historico_pessoal,
      historico_familiar: anamnese.historico_familiar,
      alergias: anamnese.alergias,
      medicamentos_uso: anamnese.medicamentos_uso,
      observacoes: anamnese.observacoes,
      createdAt: anamnese.createdAt,
      updatedAt: anamnese.updatedAt,
    };
  }

  private mapAcuidadeVisual(
    acuidadeVisual: Prisma.ProntuarioAcuidadeVisualGetPayload<
      Record<string, never>
    >,
  ): ProntuarioAcuidadeVisualResumo {
    return {
      id: acuidadeVisual.id,
      prontuarioId: acuidadeVisual.prontuarioId,
      od_sem_correcao: acuidadeVisual.od_sem_correcao,
      oe_sem_correcao: acuidadeVisual.oe_sem_correcao,
      od_com_correcao: acuidadeVisual.od_com_correcao,
      oe_com_correcao: acuidadeVisual.oe_com_correcao,
      observacoes: acuidadeVisual.observacoes,
      createdAt: acuidadeVisual.createdAt,
      updatedAt: acuidadeVisual.updatedAt,
    };
  }

  private mapProntuarioListaContexto(prontuario: ProntuarioListaContexto) {
    return {
      id: prontuario.id,
      filialId: prontuario.filialId,
      profissionalId: prontuario.profissionalId,
      createdAt: prontuario.createdAt,
      atendimento: prontuario.atendimento,
      paciente: prontuario.paciente,
      profissional: prontuario.profissional
        ? {
            id: prontuario.profissional.id,
            email: prontuario.profissional.email,
            username: prontuario.profissional.username,
            pessoa: prontuario.profissional.pessoa
              ? {
                  id: prontuario.profissional.pessoa.id,
                  nome: prontuario.profissional.pessoa.nome,
                  tipo: prontuario.profissional.pessoa.oftalmologista
                    ? 'oftalmologista'
                    : prontuario.profissional.pessoa.optometrista
                      ? 'optometrista'
                      : 'nao_definido',
                }
              : null,
          }
        : null,
    };
  }

  private mapRegistroClinicoLista<
    T extends { prontuario: ProntuarioListaContexto },
  >(registro: T) {
    return {
      ...registro,
      prontuario: this.mapProntuarioListaContexto(registro.prontuario),
    };
  }

  private mapAnamneseLista(
    anamnese: ProntuarioAnamneseCompleta,
  ): ProntuarioAnamneseListaItem {
    return {
      ...this.mapAnamnese(anamnese),
      prontuario: {
        id: anamnese.prontuario.id,
        filialId: anamnese.prontuario.filialId,
        profissionalId: anamnese.prontuario.profissionalId,
        createdAt: anamnese.prontuario.createdAt,
        atendimento: anamnese.prontuario.atendimento,
        paciente: anamnese.prontuario.paciente,
        profissional: anamnese.prontuario.profissional
          ? {
              id: anamnese.prontuario.profissional.id,
              email: anamnese.prontuario.profissional.email,
              username: anamnese.prontuario.profissional.username,
              pessoa: anamnese.prontuario.profissional.pessoa
                ? {
                    id: anamnese.prontuario.profissional.pessoa.id,
                    nome: anamnese.prontuario.profissional.pessoa.nome,
                    tipo: anamnese.prontuario.profissional.pessoa.oftalmologista
                      ? 'oftalmologista'
                      : anamnese.prontuario.profissional.pessoa.optometrista
                        ? 'optometrista'
                        : 'nao_definido',
                  }
                : null,
            }
          : null,
      },
    };
  }

  private mapAcuidadeVisualLista(
    acuidadeVisual: ProntuarioAcuidadeVisualCompleta,
  ): ProntuarioAcuidadeVisualListaItem {
    return {
      ...this.mapAcuidadeVisual(acuidadeVisual),
      prontuario: {
        id: acuidadeVisual.prontuario.id,
        filialId: acuidadeVisual.prontuario.filialId,
        profissionalId: acuidadeVisual.prontuario.profissionalId,
        createdAt: acuidadeVisual.prontuario.createdAt,
        atendimento: acuidadeVisual.prontuario.atendimento,
        paciente: acuidadeVisual.prontuario.paciente,
        profissional: acuidadeVisual.prontuario.profissional
          ? {
              id: acuidadeVisual.prontuario.profissional.id,
              email: acuidadeVisual.prontuario.profissional.email,
              username: acuidadeVisual.prontuario.profissional.username,
              pessoa: acuidadeVisual.prontuario.profissional.pessoa
                ? {
                    id: acuidadeVisual.prontuario.profissional.pessoa.id,
                    nome: acuidadeVisual.prontuario.profissional.pessoa.nome,
                    tipo: acuidadeVisual.prontuario.profissional.pessoa
                      .oftalmologista
                      ? 'oftalmologista'
                      : acuidadeVisual.prontuario.profissional.pessoa
                            .optometrista
                        ? 'optometrista'
                        : 'nao_definido',
                  }
                : null,
            }
          : null,
      },
    };
  }
}
