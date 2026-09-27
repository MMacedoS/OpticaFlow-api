import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma, TipoReceita } from '@prisma/client';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateReceitaDto,
  ReceitaMedicamentoDto,
  ReceitaOculosDto,
  UpdateReceitaDto,
} from './dto/receita.dto';
import { FiltroReceita } from './interfaces/receita.interface';

const TIPOS: TipoReceita[] = [
  TipoReceita.oculos,
  TipoReceita.lente_contato,
  TipoReceita.medicamento,
];

const NOME_TIPO: Record<TipoReceita, string> = {
  oculos: 'óculos',
  lente_contato: 'lente de contato',
  medicamento: 'medicamento',
};

const CAMPOS_REFRACAO = [
  'od_esferico',
  'od_cilindrico',
  'od_eixo',
  'oe_esferico',
  'oe_cilindrico',
  'oe_eixo',
  'dp',
  'adicao',
] as const;

const PROFISSIONAL_SELECT = {
  id: true,
  username: true,
  pessoa: {
    select: {
      nome: true,
      optometrista: { select: { registro_profissional: true } },
      oftalmologista: { select: { registro_profissional: true } },
    },
  },
} satisfies Prisma.UsuarioSelect;

const RECEITA_COMPLETA = {
  paciente: {
    select: { id: true, nome: true, cpf: true, data_nascimento: true },
  },
  profissional: { select: PROFISSIONAL_SELECT },
  filial: {
    select: {
      id: true,
      nome: true,
      cnpj: true,
      empresa: { select: { nome: true, cnpj: true } },
    },
  },
  atendimento: { select: { id: true, dataAtendimento: true } },
  oculos: true,
  lente_contato: true,
  medicamento: true,
} satisfies Prisma.ReceitaInclude;

type DetalheCriacao = Pick<
  Prisma.ReceitaUncheckedCreateInput,
  'oculos' | 'lente_contato' | 'medicamento'
>;

type DetalheAtualizacao = Pick<
  Prisma.ReceitaUncheckedUpdateInput,
  'oculos' | 'lente_contato' | 'medicamento'
>;

@Injectable()
export class ReceitaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateReceitaDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    this.garantirApenasDetalheDoTipo(dto.tipo, dto);

    const prontuario = await this.prisma.prontuario.findFirst({
      where: { id: dto.prontuarioId, ...this.filtroEmpresa(escopo) },
      select: {
        id: true,
        empresaId: true,
        filialId: true,
        atendimentoId: true,
        pacienteId: true,
        profissionalId: true,
        refracao: true,
      },
    });

    if (!prontuario) {
      throw new NotFoundException('Prontuário não encontrado.');
    }

    const detalhe = this.montarDetalheCriacao(dto, prontuario.refracao);

    const receita = await this.prisma.receita.create({
      data: {
        empresaId: prontuario.empresaId,
        filialId: prontuario.filialId,
        atendimentoId: prontuario.atendimentoId,
        prontuarioId: prontuario.id,
        pacienteId: prontuario.pacienteId,
        profissionalId: prontuario.profissionalId,
        tipo: dto.tipo,
        observacoes: dto.observacoes,
        ...detalhe,
      },
      include: RECEITA_COMPLETA,
    });

    return {
      status: 201,
      message: `Receita de ${NOME_TIPO[dto.tipo]} emitida com sucesso.`,
      data: receita,
    };
  }

  async findAll(
    escopo: EscopoUsuario,
    filtro: FiltroReceita,
  ): Promise<ResponseJson> {
    const page = Math.max(1, filtro.page);
    const limit = Math.max(1, filtro.limit);

    const where: Prisma.ReceitaWhereInput = {
      ...this.filtroEmpresa(escopo),
      ...(escopo.filialId && { filialId: escopo.filialId }),
      ...(filtro.pacienteId && { pacienteId: filtro.pacienteId }),
      ...(filtro.prontuarioId && { prontuarioId: filtro.prontuarioId }),
      ...(filtro.tipo && { tipo: filtro.tipo }),
    };

    const [receitas, total] = await this.prisma.$transaction([
      this.prisma.receita.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
        include: RECEITA_COMPLETA,
      }),
      this.prisma.receita.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Receitas listadas com sucesso.',
      data: {
        receitas,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async findById(id: string, escopo: EscopoUsuario): Promise<ResponseJson> {
    const receita = await this.prisma.receita.findFirst({
      where: { id, ...this.filtroEmpresa(escopo) },
      include: RECEITA_COMPLETA,
    });

    if (!receita) {
      throw new NotFoundException('Receita não encontrada.');
    }

    return { status: 200, message: 'Receita encontrada.', data: receita };
  }

  async update(
    id: string,
    dto: UpdateReceitaDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const { tipo } = await this.buscarNoEscopo(id, escopo);
    this.garantirApenasDetalheDoTipo(tipo, dto);

    const receita = await this.prisma.receita.update({
      where: { id },
      data: {
        observacoes: dto.observacoes,
        ...this.montarDetalheAtualizacao(tipo, dto),
      },
      include: RECEITA_COMPLETA,
    });

    return {
      status: 200,
      message: 'Receita atualizada com sucesso.',
      data: receita,
    };
  }

  async deleteById(id: string, escopo: EscopoUsuario): Promise<ResponseJson> {
    await this.buscarNoEscopo(id, escopo);
    await this.prisma.receita.delete({ where: { id } });

    return { status: 200, message: 'Receita excluída com sucesso.' };
  }

  /** Tambem vale para o prontuario (ambos tem empresaId e profissionalId). */
  private filtroEmpresa(escopo: EscopoUsuario): {
    empresaId?: string;
    profissionalId?: string;
  } {
    return {
      ...(escopo.empresaId && { empresaId: escopo.empresaId }),
      ...(escopo.profissionalId && { profissionalId: escopo.profissionalId }),
    };
  }

  private async buscarNoEscopo(
    id: string,
    escopo: EscopoUsuario,
  ): Promise<{ tipo: TipoReceita }> {
    const receita = await this.prisma.receita.findFirst({
      where: { id, ...this.filtroEmpresa(escopo) },
      select: { tipo: true },
    });

    if (!receita) {
      throw new NotFoundException('Receita não encontrada.');
    }

    return receita;
  }

  private garantirApenasDetalheDoTipo(
    tipo: TipoReceita,
    dto: UpdateReceitaDto,
  ): void {
    const outros = TIPOS.filter((outro) => outro !== tipo && dto[outro]);

    if (outros.length > 0) {
      throw new BadRequestException(
        `Receita de ${NOME_TIPO[tipo]} não aceita dados de ${outros
          .map((outro) => NOME_TIPO[outro])
          .join(', ')}.`,
      );
    }
  }

  private montarDetalheCriacao(
    dto: CreateReceitaDto,
    refracao: Partial<
      Record<(typeof CAMPOS_REFRACAO)[number], string | null>
    > | null,
  ): DetalheCriacao {
    if (dto.tipo === TipoReceita.oculos) {
      return {
        oculos: { create: dto.oculos ?? this.oculosDaRefracao(refracao) },
      };
    }

    if (dto.tipo === TipoReceita.lente_contato) {
      return { lente_contato: { create: dto.lente_contato ?? {} } };
    }

    return { medicamento: { create: this.exigirMedicamento(dto.medicamento) } };
  }

  private montarDetalheAtualizacao(
    tipo: TipoReceita,
    dto: UpdateReceitaDto,
  ): DetalheAtualizacao {
    if (tipo === TipoReceita.oculos && dto.oculos) {
      return {
        oculos: { upsert: { create: dto.oculos, update: dto.oculos } },
      };
    }

    if (tipo === TipoReceita.lente_contato && dto.lente_contato) {
      return {
        lente_contato: {
          upsert: { create: dto.lente_contato, update: dto.lente_contato },
        },
      };
    }

    if (tipo === TipoReceita.medicamento && dto.medicamento) {
      return {
        medicamento: {
          upsert: { create: dto.medicamento, update: dto.medicamento },
        },
      };
    }

    return {};
  }

  private oculosDaRefracao(
    refracao: Partial<
      Record<(typeof CAMPOS_REFRACAO)[number], string | null>
    > | null,
  ): ReceitaOculosDto {
    if (!refracao) {
      throw new UnprocessableEntityException(
        'O prontuário não tem refração registrada. Informe os valores da receita.',
      );
    }

    return Object.fromEntries(
      CAMPOS_REFRACAO.map((campo) => [campo, refracao[campo] ?? null]),
    );
  }

  private exigirMedicamento(
    medicamento?: ReceitaMedicamentoDto,
  ): ReceitaMedicamentoDto {
    if (!medicamento) {
      throw new BadRequestException(
        'Informe os dados do medicamento da receita.',
      );
    }

    return medicamento;
  }
}
