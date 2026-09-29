import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma, StatusAtendimento } from '@prisma/client';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { prepareNumeroOrdemServico } from 'src/utils/validator';
import {
  CreateAtendimentoDto,
  UpdateAtendimentoDto,
} from './dto/atendimento.dto';
import {
  AtendimentoResumo,
  FiltroAtendimento,
} from './interfaces/atendimento.interface';
import { exigirProfissional } from 'src/common/escopo/exigir-profissional';

const ATENDIMENTO_INCLUDE = {
  agenda: { select: { id: true, dataHora: true, status: true } },
  paciente: { select: { id: true, nome: true, email: true, cpf: true } },
  profissional: {
    select: {
      id: true,
      email: true,
      username: true,
      pessoa: {
        select: {
          id: true,
          nome: true,
          optometrista: { select: { id: true } },
          oftalmologista: { select: { id: true } },
        },
      },
    },
  },
  cliente: {
    select: {
      id: true,
      numero_convenio: true,
      pessoa: { select: { id: true, nome: true, email: true, cpf: true } },
    },
  },
  convenio: { select: { id: true, nome: true, registro: true } },
  prontuario: { select: { id: true } },
} satisfies Prisma.AtendimentoInclude;

type AtendimentoCompleto = Prisma.AtendimentoGetPayload<{
  include: typeof ATENDIMENTO_INCLUDE;
}>;

@Injectable()
export class AtendimentoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateAtendimentoDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    // Criar ja iniciada ou concluida segue as regras de iniciar/finalizar.
    if (dto.status) {
      this.validarMudancaDeStatus(
        {
          dataAtendimento: dto.dataAtendimento
            ? new Date(dto.dataAtendimento)
            : null,
        },
        dto.status,
        escopo,
      );
    }

    const filial = await this.resolverFilial(
      escopo.filialId ?? dto.filialId,
      escopo,
    );

    await this.validarPaciente(dto.pacienteId, filial.id);

    // Profissional so agenda consultas para si mesmo.
    if (escopo.profissionalId) {
      dto.profissionalId = escopo.profissionalId;
    }

    if (dto.profissionalId) {
      await this.validarProfissional(
        dto.profissionalId,
        filial.empresaId,
        filial.id,
      );
    }

    if (dto.clienteId) {
      await this.validarCliente(dto.clienteId, filial.id, dto.convenioId);
    }

    if (dto.convenioId) {
      await this.validarConvenio(dto.convenioId, filial.empresaId);
    }

    await this.validarProdutosDaEmpresa(
      (dto.ordemServico?.itens ?? []).map((item) => item.produtoId),
      filial.empresaId,
    );

    try {
      const atendimento = await this.prisma.$transaction(async (tx) => {
        const atend = await tx.atendimento.create({
          data: {
            empresaId: filial.empresaId,
            filialId: filial.id,
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

        if (!dto.ordemServico) {
          return atend;
        }

        const ordemServico = await tx.ordemServico.create({
          data: {
            empresaId: filial.empresaId,
            filialId: filial.id,
            clienteId: dto.clienteId || null,
            atendimentoId: atend.id,
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

        return atend;
      });

      return this.findById(
        atendimento.id,
        escopo,
        'Atendimento criado com sucesso.',
        201,
      );
    } catch (error) {
      this.tratarErroPrisma(error);
    }
  }

  async findAll(
    escopo: EscopoUsuario,
    filtro: FiltroAtendimento,
  ): Promise<ResponseJson> {
    const page = Math.max(1, filtro.page);
    const limit = Math.max(1, filtro.limit);
    const search = filtro.search.trim();

    const where: Prisma.AtendimentoWhereInput = {
      ...(escopo.empresaId && { empresaId: escopo.empresaId }),
      ...(escopo.filialId && { filialId: escopo.filialId }),
      ...(escopo.profissionalId && { profissionalId: escopo.profissionalId }),
      ...(filtro.status && { status: filtro.status }),
      ...(filtro.profissionalId && { profissionalId: filtro.profissionalId }),
      ...(filtro.pacienteId && { pacienteId: filtro.pacienteId }),
      ...((filtro.dataInicio || filtro.dataFim) && {
        dataAtendimento: {
          ...(filtro.dataInicio && { gte: new Date(filtro.dataInicio) }),
          ...(filtro.dataFim && { lte: new Date(filtro.dataFim) }),
        },
      }),
      ...(search && {
        OR: [
          { paciente: { nome: { contains: search, mode: 'insensitive' } } },
          {
            cliente: {
              is: {
                pessoa: { nome: { contains: search, mode: 'insensitive' } },
              },
            },
          },
          { observacoes: { contains: search, mode: 'insensitive' } },
          { queixa_principal: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [atendimentos, total] = await this.prisma.$transaction([
      this.prisma.atendimento.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where,
        include: ATENDIMENTO_INCLUDE,
        orderBy: { dataAtendimento: 'desc' },
      }),
      this.prisma.atendimento.count({ where }),
    ]);

    return {
      status: 200,
      message: 'Atendimentos encontrados.',
      data: {
        appointments: atendimentos.map((atendimento) =>
          this.mapResumo(atendimento),
        ),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async findById(
    id: string,
    escopo: EscopoUsuario,
    message = 'Atendimento encontrado.',
    status = 200,
  ): Promise<ResponseJson> {
    const atendimento = await this.prisma.atendimento.findFirst({
      where: { id, ...this.filtroEmpresa(escopo) },
      include: ATENDIMENTO_INCLUDE,
    });

    if (!atendimento) {
      throw new NotFoundException('Atendimento não encontrado.');
    }

    return { status, message, data: this.mapResumo(atendimento) };
  }

  async update(
    id: string,
    dto: UpdateAtendimentoDto,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const atendimento = await this.buscarNoEscopo(id, escopo);

    // Mudar o status pela edicao segue as mesmas regras dos botoes.
    if (dto.status && dto.status !== atendimento.status) {
      this.validarMudancaDeStatus(
        {
          dataAtendimento: dto.dataAtendimento
            ? new Date(dto.dataAtendimento)
            : atendimento.dataAtendimento,
        },
        dto.status,
        escopo,
      );
    }

    const agendaIdDestino = dto.agendaId ?? atendimento.agendaId;
    const pacienteIdDestino = dto.pacienteId ?? atendimento.pacienteId;
    const profissionalIdDestino = escopo.profissionalId
      ? atendimento.profissionalId
      : (dto.profissionalId ?? atendimento.profissionalId);

    if (escopo.profissionalId) {
      dto.profissionalId = undefined;
    }
    const clienteIdDestino = dto.clienteId ?? atendimento.clienteId;
    const convenioIdDestino = dto.convenioId ?? atendimento.convenioId;

    const filial = await this.resolverFilial(
      escopo.filialId
        ? atendimento.filialId
        : (dto.filialId ?? atendimento.filialId),
      escopo,
    );

    await this.validarPaciente(pacienteIdDestino, filial.id);

    if (profissionalIdDestino) {
      await this.validarProfissional(
        profissionalIdDestino,
        filial.empresaId,
        filial.id,
      );
    }

    if (agendaIdDestino) {
      await this.validarAgenda(
        agendaIdDestino,
        filial.empresaId,
        filial.id,
        pacienteIdDestino,
        profissionalIdDestino,
        id,
      );
    }

    if (clienteIdDestino) {
      await this.validarCliente(clienteIdDestino, filial.id, convenioIdDestino);
    }

    if (convenioIdDestino) {
      await this.validarConvenio(convenioIdDestino, filial.empresaId);
    }

    try {
      await this.prisma.atendimento.update({
        where: { id },
        data: {
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
    } catch (error) {
      this.tratarErroPrisma(error);
    }

    return this.findById(id, escopo, 'Atendimento atualizado com sucesso.');
  }

  async updateStatus(
    id: string,
    status: StatusAtendimento,
    escopo: EscopoUsuario,
  ): Promise<ResponseJson> {
    const atual = await this.buscarNoEscopo(id, escopo);
    this.validarMudancaDeStatus(atual, status, escopo);

    const atendimento = await this.prisma.$transaction(async (tx) => {
      const atualizado = await tx.atendimento.update({
        where: { id },
        data: { status },
      });

      const statusAgenda =
        status === StatusAtendimento.concluido ||
        status === StatusAtendimento.cancelado
          ? status
          : null;

      if (statusAgenda && atualizado.agendaId) {
        await tx.agenda.update({
          where: { id: atualizado.agendaId },
          data: { status: statusAgenda },
        });
      }

      return atualizado;
    });

    return {
      status: 200,
      message: 'Status do atendimento atualizado com sucesso.',
      data: atendimento,
    };
  }

  async deleteById(id: string, escopo: EscopoUsuario): Promise<ResponseJson> {
    await this.buscarNoEscopo(id, escopo);

    const [prontuarios, ordens] = await this.prisma.$transaction([
      this.prisma.prontuario.count({ where: { atendimentoId: id } }),
      this.prisma.ordemServico.findMany({
        where: { atendimentoId: id },
        select: {
          id: true,
          _count: { select: { itens: true, vendas: true, financeiro: true } },
        },
      }),
    ]);

    // A consulta cria uma OS junto; vazia (sem itens, venda ou financeiro)
    // ela nao impede a exclusao e e removida com a consulta.
    const ordensEmUso = ordens.filter(
      ({ _count }) => _count.itens + _count.vendas + _count.financeiro > 0,
    );

    if (prontuarios > 0 || ordensEmUso.length > 0) {
      throw new ConflictException(
        'Não é possível excluir atendimento com prontuário ou ordem de serviço em uso. Cancele-o.',
      );
    }

    await this.prisma.$transaction([
      this.prisma.ordemServico.deleteMany({ where: { atendimentoId: id } }),
      this.prisma.atendimento.delete({ where: { id } }),
    ]);

    return { status: 200, message: 'Atendimento deletado com sucesso.' };
  }

  private filtroEmpresa(escopo: EscopoUsuario): Prisma.AtendimentoWhereInput {
    return {
      ...(escopo.empresaId && { empresaId: escopo.empresaId }),
      ...(escopo.profissionalId && { profissionalId: escopo.profissionalId }),
    };
  }

  /**
   * Iniciar e finalizar a consulta sao atos do profissional do atendimento
   * (o escopo ja restringe o profissional aos proprios atendimentos), e a
   * consulta so pode ser iniciada no dia marcado. Cancelar segue livre para a
   * equipe da filial.
   */
  private validarMudancaDeStatus(
    atendimento: { dataAtendimento: Date | null },
    status: StatusAtendimento,
    escopo: EscopoUsuario,
  ): void {
    if (status === StatusAtendimento.em_andamento) {
      exigirProfissional(
        escopo,
        'Somente o profissional de saúde do atendimento pode iniciar a consulta.',
      );

      if (!this.ehHoje(atendimento.dataAtendimento)) {
        throw new UnprocessableEntityException(
          'A consulta só pode ser iniciada no dia do atendimento.',
        );
      }
    }

    if (status === StatusAtendimento.concluido) {
      exigirProfissional(
        escopo,
        'Somente o profissional de saúde do atendimento pode finalizar a consulta.',
      );
    }
  }

  /** Mesmo dia no fuso da API (TZ). */
  private ehHoje(data: Date | null): boolean {
    if (!data) return false;
    const hoje = new Date();
    return (
      data.getFullYear() === hoje.getFullYear() &&
      data.getMonth() === hoje.getMonth() &&
      data.getDate() === hoje.getDate()
    );
  }

  private async buscarNoEscopo(id: string, escopo: EscopoUsuario) {
    const atendimento = await this.prisma.atendimento.findFirst({
      where: { id, ...this.filtroEmpresa(escopo) },
    });

    if (!atendimento) {
      throw new NotFoundException('Atendimento não encontrado.');
    }

    return atendimento;
  }

  private async resolverFilial(
    filialId: string | undefined,
    escopo: EscopoUsuario,
  ): Promise<{ id: string; empresaId: string }> {
    if (!filialId) {
      throw new BadRequestException('Informe a filial do atendimento.');
    }

    const filial = await this.prisma.filial.findUnique({
      where: { id: filialId },
      select: { id: true, empresaId: true },
    });

    if (
      !filial ||
      (escopo.empresaId && filial.empresaId !== escopo.empresaId)
    ) {
      throw new UnprocessableEntityException(
        'Filial não encontrada para a empresa informada.',
      );
    }

    return filial;
  }

  private tratarErroPrisma(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Já existe atendimento vinculado para esta agenda.',
        );
      }

      if (error.code === 'P2003') {
        throw new UnprocessableEntityException(
          'Relacionamento inválido no atendimento.',
        );
      }
    }

    throw error;
  }

  /** Os produtos dos itens da OS precisam ser da empresa do atendimento. */
  private async validarProdutosDaEmpresa(
    produtoIds: (string | null | undefined)[],
    empresaId: string,
  ): Promise<void> {
    const ids = [...new Set(produtoIds.filter((id): id is string => !!id))];

    if (ids.length === 0) {
      return;
    }

    const encontrados = await this.prisma.produto.count({
      where: { id: { in: ids }, empresaId },
    });

    if (encontrados !== ids.length) {
      throw new UnprocessableEntityException(
        'Produto não encontrado para a empresa do atendimento.',
      );
    }
  }

  private async validarPaciente(
    pacienteId: string,
    filialId: string,
  ): Promise<void> {
    const paciente = await this.prisma.pessoa.findUnique({
      where: { id: pacienteId },
      select: { id: true, filialId: true },
    });

    if (!paciente) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    if (paciente.filialId !== filialId) {
      throw new UnprocessableEntityException(
        'Paciente não pertence à filial informada.',
      );
    }
  }

  private async validarProfissional(
    profissionalId: string,
    empresaId: string,
    filialId: string,
  ): Promise<void> {
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
      throw new NotFoundException('Usuário profissional não encontrado.');
    }

    if (usuario.empresaId !== empresaId) {
      throw new UnprocessableEntityException(
        'Usuário profissional não pertence à empresa informada.',
      );
    }

    if (!usuario.pessoa || usuario.pessoa.filialId !== filialId) {
      throw new UnprocessableEntityException(
        'Usuário profissional não pertence à filial informada.',
      );
    }

    const isOftalmologista = Boolean(usuario.pessoa.oftalmologista);
    const isOptometrista = Boolean(usuario.pessoa.optometrista);

    if (!isOftalmologista && !isOptometrista) {
      throw new UnprocessableEntityException(
        'Profissional inválido. Informe um usuário vinculado a oftalmologista ou optometrista.',
      );
    }
  }

  private async validarAgenda(
    agendaId: string,
    empresaId: string,
    filialId: string,
    pacienteId: string,
    profissionalId?: string | null,
    atendimentoAtualId?: string,
  ): Promise<void> {
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
      throw new NotFoundException('Agenda não encontrada.');
    }

    if (agenda.empresaId !== empresaId || agenda.filialId !== filialId) {
      throw new UnprocessableEntityException(
        'Agenda não pertence à empresa/filial informada.',
      );
    }

    if (agenda.atendimento && agenda.atendimento.id !== atendimentoAtualId) {
      throw new UnprocessableEntityException(
        'Agenda já possui atendimento vinculado.',
      );
    }

    if (agenda.pessoaId && agenda.pessoaId !== pacienteId) {
      throw new UnprocessableEntityException(
        'Paciente informado difere do paciente da agenda.',
      );
    }

    if (
      profissionalId &&
      agenda.profissionalId &&
      agenda.profissionalId !== profissionalId
    ) {
      throw new UnprocessableEntityException(
        'Profissional informado difere do profissional da agenda.',
      );
    }
  }

  private async validarCliente(
    clienteId: string,
    filialId: string,
    convenioId?: string | null,
  ): Promise<void> {
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
      throw new NotFoundException('Cliente não encontrado.');
    }

    if (cliente.pessoa.filialId !== filialId) {
      throw new UnprocessableEntityException(
        'Cliente não pertence à filial informada.',
      );
    }

    if (convenioId && cliente.convenioId && cliente.convenioId !== convenioId) {
      throw new UnprocessableEntityException(
        'Convênio informado difere do convênio do cliente.',
      );
    }
  }

  private async validarConvenio(
    convenioId: string,
    empresaId: string,
  ): Promise<void> {
    const convenio = await this.prisma.convenio.findUnique({
      where: { id: convenioId },
      select: {
        id: true,
        empresaId: true,
      },
    });

    if (!convenio) {
      throw new NotFoundException('Convênio não encontrado.');
    }

    if (convenio.empresaId !== empresaId) {
      throw new UnprocessableEntityException(
        'Convênio não pertence à empresa informada.',
      );
    }
  }

  private mapResumo(atendimento: AtendimentoCompleto): AtendimentoResumo {
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
      prontuarioId: atendimento.prontuario?.id ?? null,
    };
  }
}
