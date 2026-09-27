import { Injectable } from '@nestjs/common';
import {
  Prisma,
  StatusAtendimento,
  StatusFinanceiro,
  StatusOrdemServico,
  StatusVenda,
  TipoFinanceiro,
} from '@prisma/client';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ResumoDashboard,
  SecoesDashboard,
} from './interfaces/dashboard.interface';

const OS_EM_ANDAMENTO: StatusOrdemServico[] = [
  StatusOrdemServico.aberta,
  StatusOrdemServico.orcamento,
];

const LIMITE_LISTAS = 5;

function periodos(agora = new Date()) {
  const inicioHoje = new Date(agora);
  inicioHoje.setHours(0, 0, 0, 0);
  const fimHoje = new Date(inicioHoje);
  fimHoje.setDate(fimHoje.getDate() + 1);
  const em7Dias = new Date(inicioHoje);
  em7Dias.setDate(em7Dias.getDate() + 8);
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const inicioMesAnterior = new Date(
    agora.getFullYear(),
    agora.getMonth() - 1,
    1,
  );

  return { agora, inicioHoje, fimHoje, em7Dias, inicioMes, inicioMesAnterior };
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async resumo(escopo: EscopoUsuario): Promise<ResponseJson> {
    const escopoWhere = {
      ...(escopo.empresaId && { empresaId: escopo.empresaId }),
      ...(escopo.filialId && { filialId: escopo.filialId }),
    };
    const p = periodos();

    const pode = await this.modulosPermitidos(escopo);
    const se = <T>(modulo: string, calcular: () => Promise<T>) =>
      pode(modulo) ? calcular() : Promise.resolve(null);

    const [consultasHoje, ordensServico, vendas, financeiro, estoque] =
      await Promise.all([
        se('atendimento', () =>
          this.consultasHoje(
            {
              ...escopoWhere,
              ...(escopo.profissionalId && {
                profissionalId: escopo.profissionalId,
              }),
            },
            p,
          ),
        ),
        se('ordem-servico', () => this.ordensServico(escopoWhere, p)),
        se('venda', () => this.vendas(escopoWhere, p)),
        se('financeiro-lancamento', () => this.financeiro(escopoWhere, p)),
        se('estoque', () => this.estoque(escopo)),
      ]);

    const data: ResumoDashboard = {
      consultasHoje,
      ordensServico,
      vendas,
      financeiro,
      estoque,
    };

    return { status: 200, message: 'Resumo do painel.', data };
  }

  /**
   * Mesma regra do AcessoGuard: pode listar o modulo se tiver permissao
   * (listar ou *) ou se o modulo nao tiver nenhuma permissao configurada.
   */
  private async modulosPermitidos(
    escopo: EscopoUsuario,
  ): Promise<(modulo: string) => boolean> {
    if (escopo.superadmin) return () => true;

    const escopoEmpresa = [
      { empresaId: null },
      ...(escopo.empresaId ? [{ empresaId: escopo.empresaId }] : []),
    ];

    const [configuradas, doUsuario] = await Promise.all([
      this.prisma.permissao.findMany({
        where: { OR: escopoEmpresa },
        select: { modulo: true },
        distinct: ['modulo'],
      }),
      this.prisma.permissao.findMany({
        where: {
          OR: escopoEmpresa,
          acao: { in: ['listar', '*'] },
          acesso: {
            some: {
              acesso: {
                atribuicao: { some: { usuarioId: escopo.usuarioId ?? '' } },
              },
            },
          },
        },
        select: { modulo: true },
        distinct: ['modulo'],
      }),
    ]);

    const configurados = new Set(configuradas.map((p) => p.modulo));
    const permitidos = new Set(doUsuario.map((p) => p.modulo));

    return (modulo) =>
      permitidos.has('*') ||
      permitidos.has(modulo) ||
      (!configurados.has(modulo) && !configurados.has('*'));
  }

  private async consultasHoje(
    escopoWhere: Prisma.AtendimentoWhereInput,
    p: ReturnType<typeof periodos>,
  ): Promise<SecoesDashboard['consultasHoje']> {
    const where: Prisma.AtendimentoWhereInput = {
      ...escopoWhere,
      dataAtendimento: { gte: p.inicioHoje, lt: p.fimHoje },
    };

    const [grupos, proximas] = await Promise.all([
      this.prisma.atendimento.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      this.prisma.atendimento.findMany({
        where: {
          ...where,
          status: {
            in: [StatusAtendimento.em_espera, StatusAtendimento.em_andamento],
          },
        },
        orderBy: { dataAtendimento: 'asc' },
        take: LIMITE_LISTAS,
        select: {
          id: true,
          dataAtendimento: true,
          status: true,
          paciente: { select: { nome: true } },
          profissional: {
            select: { username: true, pessoa: { select: { nome: true } } },
          },
        },
      }),
    ]);

    const porStatus = Object.fromEntries(
      Object.values(StatusAtendimento).map((status) => [
        status,
        grupos.find((g) => g.status === status)?._count._all ?? 0,
      ]),
    ) as Record<StatusAtendimento, number>;

    return {
      total: Object.values(porStatus).reduce((soma, n) => soma + n, 0),
      porStatus,
      proximas: proximas.map((a) => ({
        id: a.id,
        dataAtendimento: a.dataAtendimento,
        status: a.status,
        paciente: a.paciente.nome,
        profissional:
          a.profissional?.pessoa?.nome ?? a.profissional?.username ?? null,
      })),
    };
  }

  private async ordensServico(
    escopoWhere: Prisma.OrdemServicoWhereInput,
    p: ReturnType<typeof periodos>,
  ): Promise<SecoesDashboard['ordensServico']> {
    const emAndamento: Prisma.OrdemServicoWhereInput = {
      ...escopoWhere,
      status: { in: OS_EM_ANDAMENTO },
    };
    const atrasadas: Prisma.OrdemServicoWhereInput = {
      ...emAndamento,
      previsao_entrega: { lt: p.agora },
    };

    const [abertas, totalAtrasadas, lista] = await Promise.all([
      this.prisma.ordemServico.count({ where: emAndamento }),
      this.prisma.ordemServico.count({ where: atrasadas }),
      this.prisma.ordemServico.findMany({
        where: atrasadas,
        orderBy: { previsao_entrega: 'asc' },
        take: LIMITE_LISTAS,
        select: {
          id: true,
          numero: true,
          previsao_entrega: true,
          valor_total: true,
          cliente: { select: { pessoa: { select: { nome: true } } } },
        },
      }),
    ]);

    return {
      abertas,
      atrasadas: totalAtrasadas,
      listaAtrasadas: lista.map((os) => ({
        id: os.id,
        numero: os.numero,
        previsao_entrega: os.previsao_entrega,
        valor_total: os.valor_total,
        cliente: os.cliente?.pessoa.nome ?? null,
      })),
    };
  }

  private async vendas(
    escopoWhere: Prisma.VendaWhereInput,
    p: ReturnType<typeof periodos>,
  ): Promise<SecoesDashboard['vendas']> {
    const periodo = async (gte: Date, lt?: Date) => {
      const r = await this.prisma.venda.aggregate({
        where: {
          ...escopoWhere,
          status: StatusVenda.finalizada,
          dataVenda: { gte, ...(lt && { lt }) },
        },
        _sum: { valor_total: true },
        _count: { _all: true },
      });
      return {
        total: Math.round((r._sum.valor_total ?? 0) * 100) / 100,
        quantidade: r._count._all,
      };
    };

    const [mesAtual, mesAnterior] = await Promise.all([
      periodo(p.inicioMes),
      periodo(p.inicioMesAnterior, p.inicioMes),
    ]);

    return { mesAtual, mesAnterior };
  }

  private async financeiro(
    escopoWhere: Prisma.FinanceiroLancamentoWhereInput,
    p: ReturnType<typeof periodos>,
  ): Promise<SecoesDashboard['financeiro']> {
    const soma = async (
      tipo: TipoFinanceiro,
      vencimento: Prisma.DateTimeNullableFilter,
    ) => {
      const r = await this.prisma.financeiroLancamento.aggregate({
        where: {
          ...escopoWhere,
          tipo,
          status: StatusFinanceiro.pendente,
          vencimento,
        },
        _sum: { valor: true },
      });
      return Math.round((r._sum.valor ?? 0) * 100) / 100;
    };

    const [
      receberVencido,
      pagarVencido,
      receberProximos7Dias,
      pagarProximos7Dias,
    ] = await Promise.all([
      soma(TipoFinanceiro.receita, { lt: p.inicioHoje }),
      soma(TipoFinanceiro.despesa, { lt: p.inicioHoje }),
      soma(TipoFinanceiro.receita, { gte: p.inicioHoje, lt: p.em7Dias }),
      soma(TipoFinanceiro.despesa, { gte: p.inicioHoje, lt: p.em7Dias }),
    ]);

    return {
      receberVencido,
      pagarVencido,
      receberProximos7Dias,
      pagarProximos7Dias,
    };
  }

  private async estoque(
    escopo: EscopoUsuario,
  ): Promise<SecoesDashboard['estoque']> {
    const where: Prisma.EstoqueItemWhereInput = {
      estoque: {
        ...(escopo.empresaId && { empresaId: escopo.empresaId }),
        ...(escopo.filialId && { filialId: escopo.filialId }),
      },
      minimo: { not: null },
      quantidade: { lte: this.prisma.estoqueItem.fields.minimo },
    };

    const [total, itens] = await Promise.all([
      this.prisma.estoqueItem.count({ where }),
      this.prisma.estoqueItem.findMany({
        where,
        orderBy: { quantidade: 'asc' },
        take: LIMITE_LISTAS,
        select: {
          id: true,
          quantidade: true,
          minimo: true,
          produto: { select: { nome: true, sku: true } },
        },
      }),
    ]);

    return {
      abaixoMinimo: total,
      itens: itens.map((item) => ({
        id: item.id,
        produto: item.produto.nome,
        sku: item.produto.sku,
        quantidade: item.quantidade,
        minimo: item.minimo,
      })),
    };
  }
}
