import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma, StatusAtendimento } from '@prisma/client';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProntuarioDto, UpdateProntuarioDto } from './dto/prontuario.dto';
import {
  DadosSecaoLista,
  DadosSecaoUnica,
  FiltroProntuario,
  SecaoLista,
  SecaoUnica,
} from './interfaces/prontuario.interface';

type OperacoesSecaoUnica = {
  [K in SecaoUnica]: {
    nome: string;
    salvar: (
      prontuarioId: string,
      dados: DadosSecaoUnica[K],
    ) => Promise<unknown>;
    remover: (prontuarioId: string) => Promise<Prisma.BatchPayload>;
  };
};

type OperacoesSecaoLista = {
  [K in SecaoLista]: {
    nome: string;
    buscar: (id: string) => Promise<{ prontuarioId: string } | null>;
    criar: (
      prontuarioId: string,
      dados: DadosSecaoLista[K],
    ) => Promise<unknown>;
    atualizar: (id: string, dados: DadosSecaoLista[K]) => Promise<unknown>;
    remover: (id: string) => Promise<unknown>;
  };
};

const paraData = (valor?: string | null): Date | null | undefined =>
  valor ? new Date(valor) : valor === null ? null : undefined;

const PRONTUARIO_COMPLETO = {
  filial: { select: { id: true, nome: true } },
  paciente: {
    select: {
      id: true,
      nome: true,
      cpf: true,
      email: true,
      data_nascimento: true,
      genero: true,
    },
  },
  profissional: {
    select: {
      id: true,
      username: true,
      pessoa: { select: { id: true, nome: true } },
    },
  },
  atendimento: {
    select: {
      id: true,
      dataAtendimento: true,
      status: true,
      queixa_principal: true,
      observacoes: true,
    },
  },
  anamnese: true,
  acuidade_visual: true,
  refracao: true,
  ceratometria: true,
  biomicroscopia: true,
  fundoscopia: true,
  pressao_intraocular: true,
  diagnosticos: { orderBy: { createdAt: 'asc' } },
  exames_complementares: { orderBy: { createdAt: 'asc' } },
  evolucoes_clinicas: { orderBy: { dataEvolucao: 'desc' } },
} satisfies Prisma.ProntuarioInclude;

@Injectable()
export class ProntuarioService {
  private readonly secoesUnicas: OperacoesSecaoUnica;
  private readonly secoesLista: OperacoesSecaoLista;

  constructor(private readonly prisma: PrismaService) {
    this.secoesUnicas = this.criarOperacoesSecaoUnica();
    this.secoesLista = this.criarOperacoesSecaoLista();
  }

  async create(
    dto: CreateProntuarioDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const atendimento = await this.prisma.atendimento.findFirst({
      where: {
        id: dto.atendimentoId,
        ...(escopo.empresaId && { empresaId: escopo.empresaId }),
      },
      select: {
        id: true,
        empresaId: true,
        filialId: true,
        pacienteId: true,
        profissionalId: true,
        status: true,
        prontuario: { select: { id: true } },
      },
    });

    if (!atendimento) {
      throw new NotFoundException('Atendimento não encontrado.');
    }

    if (atendimento.status === StatusAtendimento.cancelado) {
      throw new UnprocessableEntityException(
        'Não é possível abrir prontuário de um atendimento cancelado.',
      );
    }

    if (atendimento.prontuario) {
      throw new ConflictException('Este atendimento já possui prontuário.');
    }

    const prontuario = await this.prisma.prontuario.create({
      data: {
        empresaId: atendimento.empresaId,
        filialId: atendimento.filialId,
        atendimentoId: atendimento.id,
        pacienteId: atendimento.pacienteId,
        profissionalId: atendimento.profissionalId,
        resumo_clinico: dto.resumo_clinico,
      },
      include: PRONTUARIO_COMPLETO,
    });

    return {
      status: 201,
      message: 'Prontuário aberto com sucesso.',
      data: prontuario,
    };
  }

  async findAll(
    escopo: EscopoUsuario,
    filtro: FiltroProntuario,
  ): Promise<ResponseJson> {
    const page = Math.max(1, filtro.page);
    const limit = Math.max(1, filtro.limit);

    const where: Prisma.ProntuarioWhereInput = {
      ...this.filtroEscopo(escopo),
      ...(escopo.filialId && { filialId: escopo.filialId }),
      ...(filtro.pacienteId && { pacienteId: filtro.pacienteId }),
    };

    const [prontuarios, total] = await this.prisma.$transaction([
      this.prisma.prontuario.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          paciente: { select: { id: true, nome: true } },
          profissional: {
            select: { id: true, pessoa: { select: { nome: true } } },
          },
          atendimento: {
            select: { id: true, dataAtendimento: true, status: true },
          },
          diagnosticos: { select: { codigo: true, descricao: true } },
        },
      }),
      this.prisma.prontuario.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Prontuários listados com sucesso.',
      data: {
        prontuarios,
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
    const prontuario = await this.prisma.prontuario.findFirst({
      where: { id, ...this.filtroEscopo(escopo) },
      include: PRONTUARIO_COMPLETO,
    });

    if (!prontuario) {
      throw new NotFoundException('Prontuário não encontrado.');
    }

    return {
      status: 200,
      message: 'Prontuário encontrado.',
      data: prontuario,
    };
  }

  async findByAtendimento(
    atendimentoId: string,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const prontuario = await this.prisma.prontuario.findFirst({
      where: { atendimentoId, ...this.filtroEscopo(escopo) },
      include: PRONTUARIO_COMPLETO,
    });

    if (!prontuario) {
      throw new NotFoundException('Este atendimento ainda não tem prontuário.');
    }

    return {
      status: 200,
      message: 'Prontuário encontrado.',
      data: prontuario,
    };
  }

  async update(
    id: string,
    dto: UpdateProntuarioDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    await this.garantirNoEscopo(id, escopo);

    const prontuario = await this.prisma.prontuario.update({
      where: { id },
      data: { resumo_clinico: dto.resumo_clinico },
      include: PRONTUARIO_COMPLETO,
    });

    return {
      status: 200,
      message: 'Prontuário atualizado com sucesso.',
      data: prontuario,
    };
  }

  async deleteById(id: string, escopo: EscopoUsuario): Promise<ResponseJson> {
    await this.garantirNoEscopo(id, escopo);

    const receitas = await this.prisma.receita.count({
      where: { prontuarioId: id },
    });

    if (receitas > 0) {
      throw new ConflictException(
        'Não é possível excluir prontuário com receitas emitidas.',
      );
    }

    await this.prisma.prontuario.delete({ where: { id } });

    return { status: 200, message: 'Prontuário excluído com sucesso.' };
  }

  async salvarSecao<K extends SecaoUnica>(
    prontuarioId: string,
    secao: K,
    dados: DadosSecaoUnica[K],
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    await this.garantirNoEscopo(prontuarioId, escopo);

    const operacoes = this.secoesUnicas[secao];
    const registro = await operacoes.salvar(prontuarioId, dados);

    return {
      status: 200,
      message: `${operacoes.nome} salva com sucesso.`,
      data: registro,
    };
  }

  async removerSecao(
    prontuarioId: string,
    secao: SecaoUnica,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    await this.garantirNoEscopo(prontuarioId, escopo);

    const operacoes = this.secoesUnicas[secao];
    const { count } = await operacoes.remover(prontuarioId);

    if (count === 0) {
      throw new NotFoundException(`${operacoes.nome} não registrada.`);
    }

    return { status: 200, message: `${operacoes.nome} removida com sucesso.` };
  }

  async adicionarItem<K extends SecaoLista>(
    prontuarioId: string,
    secao: K,
    dados: DadosSecaoLista[K],
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    await this.garantirNoEscopo(prontuarioId, escopo);

    const operacoes = this.secoesLista[secao];
    const item = await operacoes.criar(prontuarioId, dados);

    return {
      status: 201,
      message: `${operacoes.nome} adicionado com sucesso.`,
      data: item,
    };
  }

  async atualizarItem<K extends SecaoLista>(
    prontuarioId: string,
    secao: K,
    itemId: string,
    dados: DadosSecaoLista[K],
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const operacoes = await this.garantirItemNoEscopo(
      prontuarioId,
      secao,
      itemId,
      escopo,
    );
    const item = await operacoes.atualizar(itemId, dados);

    return {
      status: 200,
      message: `${operacoes.nome} atualizado com sucesso.`,
      data: item,
    };
  }

  async removerItem(
    prontuarioId: string,
    secao: SecaoLista,
    itemId: string,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const operacoes = await this.garantirItemNoEscopo(
      prontuarioId,
      secao,
      itemId,
      escopo,
    );
    await operacoes.remover(itemId);

    return { status: 200, message: `${operacoes.nome} removido com sucesso.` };
  }

  private filtroEscopo(escopo: EscopoUsuario): Prisma.ProntuarioWhereInput {
    return escopo.empresaId ? { empresaId: escopo.empresaId } : {};
  }

  private async garantirNoEscopo(
    id: string,
    escopo: EscopoUsuario,
  ): Promise<void> {
    const existe = await this.prisma.prontuario.count({
      where: { id, ...this.filtroEscopo(escopo) },
    });

    if (existe === 0) {
      throw new NotFoundException('Prontuário não encontrado.');
    }
  }

  private async garantirItemNoEscopo<K extends SecaoLista>(
    prontuarioId: string,
    secao: K,
    itemId: string,
    escopo: EscopoUsuario,
  ): Promise<OperacoesSecaoLista[K]> {
    await this.garantirNoEscopo(prontuarioId, escopo);

    const operacoes = this.secoesLista[secao];
    const item = await operacoes.buscar(itemId);

    if (!item || item.prontuarioId !== prontuarioId) {
      throw new NotFoundException(`${operacoes.nome} não encontrado.`);
    }

    return operacoes;
  }

  private criarOperacoesSecaoUnica(): OperacoesSecaoUnica {
    const p = this.prisma;

    return {
      anamnese: {
        nome: 'Anamnese',
        salvar: (prontuarioId, dados) =>
          p.prontuarioAnamnese.upsert({
            where: { prontuarioId },
            create: { ...dados, prontuarioId },
            update: dados,
          }),
        remover: (prontuarioId) =>
          p.prontuarioAnamnese.deleteMany({ where: { prontuarioId } }),
      },
      acuidade_visual: {
        nome: 'Acuidade visual',
        salvar: (prontuarioId, dados) =>
          p.prontuarioAcuidadeVisual.upsert({
            where: { prontuarioId },
            create: { ...dados, prontuarioId },
            update: dados,
          }),
        remover: (prontuarioId) =>
          p.prontuarioAcuidadeVisual.deleteMany({ where: { prontuarioId } }),
      },
      refracao: {
        nome: 'Refração',
        salvar: (prontuarioId, dados) =>
          p.prontuarioRefracao.upsert({
            where: { prontuarioId },
            create: { ...dados, prontuarioId },
            update: dados,
          }),
        remover: (prontuarioId) =>
          p.prontuarioRefracao.deleteMany({ where: { prontuarioId } }),
      },
      ceratometria: {
        nome: 'Ceratometria',
        salvar: (prontuarioId, dados) =>
          p.prontuarioCeratometria.upsert({
            where: { prontuarioId },
            create: { ...dados, prontuarioId },
            update: dados,
          }),
        remover: (prontuarioId) =>
          p.prontuarioCeratometria.deleteMany({ where: { prontuarioId } }),
      },
      biomicroscopia: {
        nome: 'Biomicroscopia',
        salvar: (prontuarioId, dados) =>
          p.prontuarioBiomicroscopia.upsert({
            where: { prontuarioId },
            create: { ...dados, prontuarioId },
            update: dados,
          }),
        remover: (prontuarioId) =>
          p.prontuarioBiomicroscopia.deleteMany({ where: { prontuarioId } }),
      },
      fundoscopia: {
        nome: 'Fundoscopia',
        salvar: (prontuarioId, dados) =>
          p.prontuarioFundoscopia.upsert({
            where: { prontuarioId },
            create: { ...dados, prontuarioId },
            update: dados,
          }),
        remover: (prontuarioId) =>
          p.prontuarioFundoscopia.deleteMany({ where: { prontuarioId } }),
      },
      pressao_intraocular: {
        nome: 'Pressão intraocular',
        salvar: (prontuarioId, { horario, ...dados }) => {
          const data = { ...dados, horario: paraData(horario) };

          return p.prontuarioPressaoIntraocular.upsert({
            where: { prontuarioId },
            create: { ...data, prontuarioId },
            update: data,
          });
        },
        remover: (prontuarioId) =>
          p.prontuarioPressaoIntraocular.deleteMany({
            where: { prontuarioId },
          }),
      },
    };
  }

  private criarOperacoesSecaoLista(): OperacoesSecaoLista {
    const p = this.prisma;
    const selecionarDono = { select: { prontuarioId: true } };

    return {
      diagnosticos: {
        nome: 'Diagnóstico',
        buscar: (id) =>
          p.prontuarioDiagnostico.findUnique({
            where: { id },
            ...selecionarDono,
          }),
        criar: (prontuarioId, dados) =>
          p.prontuarioDiagnostico.create({ data: { ...dados, prontuarioId } }),
        atualizar: (id, dados) =>
          p.prontuarioDiagnostico.update({ where: { id }, data: dados }),
        remover: (id) => p.prontuarioDiagnostico.delete({ where: { id } }),
      },
      exames_complementares: {
        nome: 'Exame complementar',
        buscar: (id) =>
          p.prontuarioExameComplementar.findUnique({
            where: { id },
            ...selecionarDono,
          }),
        criar: (prontuarioId, { dataExame, ...dados }) =>
          p.prontuarioExameComplementar.create({
            data: { ...dados, dataExame: paraData(dataExame), prontuarioId },
          }),
        atualizar: (id, { dataExame, ...dados }) =>
          p.prontuarioExameComplementar.update({
            where: { id },
            data: { ...dados, dataExame: paraData(dataExame) },
          }),
        remover: (id) =>
          p.prontuarioExameComplementar.delete({ where: { id } }),
      },
      evolucoes_clinicas: {
        nome: 'Evolução clínica',
        buscar: (id) =>
          p.prontuarioEvolucaoClinica.findUnique({
            where: { id },
            ...selecionarDono,
          }),
        criar: (prontuarioId, { dataEvolucao, ...dados }) =>
          p.prontuarioEvolucaoClinica.create({
            data: {
              ...dados,
              dataEvolucao: paraData(dataEvolucao) ?? undefined,
              prontuarioId,
            },
          }),
        atualizar: (id, { dataEvolucao, ...dados }) =>
          p.prontuarioEvolucaoClinica.update({
            where: { id },
            data: {
              ...dados,
              dataEvolucao: paraData(dataEvolucao) ?? undefined,
            },
          }),
        remover: (id) => p.prontuarioEvolucaoClinica.delete({ where: { id } }),
      },
    };
  }
}
