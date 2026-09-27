import { Injectable } from '@nestjs/common';
import {
  StatusAgenda,
  StatusAtendimento,
  StatusCompra,
  StatusFinanceiro,
  StatusOrdemServico,
  StatusVenda,
  TipoFinanceiro,
} from '@prisma/client';
import type { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { ResponseJson } from 'src/interface/response/response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ColunaRelatorio,
  FiltroRelatorio,
  GrupoRelatorio,
  IndicadorRelatorio,
  Periodo,
  Relatorio,
} from './interfaces/relatorio.interface';
import {
  agrupar,
  coluna,
  diaIso,
  escopoWhere,
  indicador,
  LIMITE_LINHAS,
  porDia,
  resolverPeriodo,
} from './relatorio.util';

const STATUS_VENDA: Record<string, string> = {
  aberta: 'Aberta',
  finalizada: 'Finalizada',
  cancelada: 'Cancelada',
};
const STATUS_COMPRA: Record<string, string> = {
  rascunho: 'Rascunho',
  recebida: 'Recebida',
  cancelada: 'Cancelada',
};
const STATUS_FINANCEIRO: Record<string, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  cancelado: 'Cancelado',
};
const STATUS_AGENDA: Record<string, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
  concluido: 'Concluído',
  falta: 'Falta',
};
const STATUS_ATENDIMENTO: Record<string, string> = {
  em_espera: 'Em espera',
  em_andamento: 'Em andamento',
  concluido: 'Concluída',
  cancelado: 'Cancelada',
};
const STATUS_OS: Record<string, string> = {
  aberta: 'Aberta',
  orcamento: 'Orçamento',
  faturada: 'Faturada',
  finalizada: 'Finalizada',
  cancelada: 'Cancelada',
};
const FORMAS_PAGAMENTO: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'Pix',
  cartao_credito: 'Cartão de crédito',
  cartao_debito: 'Cartão de débito',
  boleto: 'Boleto',
  transferencia: 'Transferência',
};
const TIPOS_PRODUTO: Record<string, string> = {
  armacao: 'Armação',
  lente: 'Lente',
  acessorio: 'Acessório',
  servico: 'Serviço',
};
const TIPOS_FINANCEIRO: Record<string, string> = {
  receita: 'Receita',
  despesa: 'Despesa',
};

const rotulo = (mapa: Record<string, string>, chave?: string | null) =>
  chave ? (mapa[chave] ?? chave) : null;

const nomeUsuario = (
  usuario?: { email: string; pessoa: { nome: string } | null } | null,
) => (usuario ? (usuario.pessoa?.nome ?? usuario.email) : null);

const soma = <T>(itens: T[], valor: (item: T) => number) =>
  itens.reduce((total, item) => total + valor(item), 0);

const SELECT_PROFISSIONAL = {
  select: { email: true, pessoa: { select: { nome: true } } },
} as const;

/** Relatorios gerenciais. Cada um respeita o escopo de empresa/filial do usuario. */
@Injectable()
export class RelatorioService {
  constructor(private readonly prisma: PrismaService) {}

  async vendas(escopo: EscopoUsuario, filtro: FiltroRelatorio) {
    const periodo = resolverPeriodo(filtro.dataInicio, filtro.dataFim);
    const vendas = await this.prisma.venda.findMany({
      where: {
        ...escopoWhere(escopo, filtro.filialId),
        dataVenda: { gte: periodo.inicio, lt: periodo.fim },
      },
      select: {
        id: true,
        dataVenda: true,
        status: true,
        valor_total: true,
        cliente: { select: { pessoa: { select: { nome: true } } } },
        itens: {
          select: {
            quantidade: true,
            valor_unitario: true,
            desconto: true,
            descricao_servico: true,
            produto: { select: { nome: true } },
          },
        },
        financeiro: {
          where: {
            tipo: TipoFinanceiro.receita,
            status: StatusFinanceiro.pago,
          },
          select: { valor: true, forma_pagamento: true },
        },
      },
      orderBy: { dataVenda: 'desc' },
    });

    const finalizadas = vendas.filter(
      (v) => v.status === StatusVenda.finalizada,
    );
    const faturamento = soma(finalizadas, (v) => v.valor_total);
    const itens = finalizadas.flatMap((v) => v.itens);
    const valorItem = (i: (typeof itens)[number]) =>
      i.quantidade * i.valor_unitario - (i.desconto ?? 0);

    return this.responder('Relatório de vendas', periodo, {
      indicadores: [
        indicador('Vendas finalizadas', finalizadas.length),
        indicador('Faturamento', faturamento, 'moeda'),
        indicador(
          'Ticket médio',
          finalizadas.length ? faturamento / finalizadas.length : 0,
          'moeda',
        ),
        indicador(
          'Em aberto',
          vendas.filter((v) => v.status === StatusVenda.aberta).length,
        ),
        indicador(
          'Canceladas',
          vendas.filter((v) => v.status === StatusVenda.cancelada).length,
        ),
      ],
      grupos: [
        porDia(
          'Faturamento por dia',
          periodo,
          finalizadas,
          (v) => v.dataVenda,
          (v) => v.valor_total,
          'moeda',
        ),
        agrupar(
          'Recebido por forma de pagamento',
          finalizadas.flatMap((v) => v.financeiro),
          (f) => f.forma_pagamento,
          (f) => f.valor,
          { formato: 'moeda', rotulos: FORMAS_PAGAMENTO },
        ),
        agrupar(
          'Produtos mais vendidos (valor)',
          itens,
          (i) => i.produto?.nome ?? i.descricao_servico,
          valorItem,
          { formato: 'moeda', limite: 10 },
        ),
        agrupar(
          'Melhores clientes',
          finalizadas,
          (v) => v.cliente?.pessoa.nome ?? 'Venda balcão',
          (v) => v.valor_total,
          { formato: 'moeda', limite: 10 },
        ),
        agrupar('Vendas por status', vendas, (v) => v.status, undefined, {
          rotulos: STATUS_VENDA,
        }),
      ],
      colunas: [
        coluna('data', 'Data', 'dataHora'),
        coluna('cliente', 'Cliente'),
        coluna('status', 'Status'),
        coluna('itens', 'Itens', 'numero'),
        coluna('valor', 'Valor', 'moeda'),
      ],
      linhas: vendas.map((v) => ({
        data: v.dataVenda,
        cliente: v.cliente?.pessoa.nome ?? 'Venda balcão',
        status: rotulo(STATUS_VENDA, v.status),
        itens: v.itens.length,
        valor: v.valor_total,
      })),
    });
  }

  async compras(escopo: EscopoUsuario, filtro: FiltroRelatorio) {
    const periodo = resolverPeriodo(filtro.dataInicio, filtro.dataFim);
    const compras = await this.prisma.compra.findMany({
      where: {
        ...escopoWhere(escopo, filtro.filialId),
        dataCompra: { gte: periodo.inicio, lt: periodo.fim },
      },
      select: {
        dataCompra: true,
        status: true,
        valor_total: true,
        fornecedor: { select: { razao_social: true, nome_fantasia: true } },
        itens: {
          select: { quantidade: true, produto: { select: { nome: true } } },
        },
      },
      orderBy: { dataCompra: 'desc' },
    });

    const recebidas = compras.filter((c) => c.status === StatusCompra.recebida);
    const fornecedor = (c: (typeof compras)[number]) =>
      c.fornecedor
        ? (c.fornecedor.nome_fantasia ?? c.fornecedor.razao_social)
        : null;
    const total = soma(recebidas, (c) => c.valor_total);

    return this.responder('Relatório de compras', periodo, {
      indicadores: [
        indicador('Compras recebidas', recebidas.length),
        indicador('Total comprado', total, 'moeda'),
        indicador(
          'Compra média',
          recebidas.length ? total / recebidas.length : 0,
          'moeda',
        ),
        indicador(
          'Rascunhos',
          compras.filter((c) => c.status === StatusCompra.rascunho).length,
        ),
        indicador(
          'Canceladas',
          compras.filter((c) => c.status === StatusCompra.cancelada).length,
        ),
      ],
      grupos: [
        porDia(
          'Compras recebidas por dia',
          periodo,
          recebidas,
          (c) => c.dataCompra,
          (c) => c.valor_total,
          'moeda',
        ),
        agrupar('Por fornecedor', recebidas, fornecedor, (c) => c.valor_total, {
          formato: 'moeda',
          limite: 10,
        }),
        agrupar(
          'Produtos mais comprados (quantidade)',
          recebidas.flatMap((c) => c.itens),
          (i) => i.produto.nome,
          (i) => i.quantidade,
          { limite: 10 },
        ),
        agrupar('Compras por status', compras, (c) => c.status, undefined, {
          rotulos: STATUS_COMPRA,
        }),
      ],
      colunas: [
        coluna('data', 'Data', 'data'),
        coluna('fornecedor', 'Fornecedor'),
        coluna('status', 'Status'),
        coluna('itens', 'Itens', 'numero'),
        coluna('valor', 'Valor', 'moeda'),
      ],
      linhas: compras.map((c) => ({
        data: c.dataCompra,
        fornecedor: fornecedor(c) ?? '—',
        status: rotulo(STATUS_COMPRA, c.status),
        itens: c.itens.length,
        valor: c.valor_total,
      })),
    });
  }

  /** Base: vencimento no periodo (ou criacao, para lancamentos sem vencimento). */
  async financeiro(escopo: EscopoUsuario, filtro: FiltroRelatorio) {
    const periodo = resolverPeriodo(filtro.dataInicio, filtro.dataFim);
    const noPeriodo = { gte: periodo.inicio, lt: periodo.fim };
    const lancamentos = await this.prisma.financeiroLancamento.findMany({
      where: {
        ...escopoWhere(escopo, filtro.filialId),
        OR: [
          { vencimento: noPeriodo },
          { vencimento: null, createdAt: noPeriodo },
        ],
      },
      select: {
        tipo: true,
        categoria: true,
        descricao: true,
        valor: true,
        vencimento: true,
        pagoEm: true,
        status: true,
        forma_pagamento: true,
        createdAt: true,
      },
      orderBy: [{ vencimento: 'asc' }, { createdAt: 'asc' }],
    });

    const ativos = lancamentos.filter(
      (l) => l.status !== StatusFinanceiro.cancelado,
    );
    const pagos = ativos.filter((l) => l.status === StatusFinanceiro.pago);
    const receitas = ativos.filter((l) => l.tipo === TipoFinanceiro.receita);
    const despesas = ativos.filter((l) => l.tipo === TipoFinanceiro.despesa);
    const recebido = soma(
      pagos.filter((l) => l.tipo === TipoFinanceiro.receita),
      (l) => l.valor,
    );
    const pago = soma(
      pagos.filter((l) => l.tipo === TipoFinanceiro.despesa),
      (l) => l.valor,
    );
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencido = soma(
      ativos.filter(
        (l) =>
          l.status === StatusFinanceiro.pendente &&
          l.vencimento &&
          l.vencimento < hoje,
      ),
      (l) => (l.tipo === TipoFinanceiro.receita ? l.valor : -l.valor),
    );

    return this.responder('Relatório financeiro', periodo, {
      indicadores: [
        indicador(
          'Receitas previstas',
          soma(receitas, (l) => l.valor),
          'moeda',
        ),
        indicador('Recebido', recebido, 'moeda'),
        indicador(
          'Despesas previstas',
          soma(despesas, (l) => l.valor),
          'moeda',
        ),
        indicador('Pago', pago, 'moeda'),
        indicador('Saldo realizado', recebido - pago, 'moeda'),
        indicador('Vencido em aberto (receber − pagar)', vencido, 'moeda'),
      ],
      grupos: [
        porDia(
          'Saldo realizado por dia',
          periodo,
          pagos,
          (l) => l.pagoEm,
          (l) => (l.tipo === TipoFinanceiro.receita ? l.valor : -l.valor),
          'moeda',
        ),
        agrupar(
          'Receitas por categoria',
          receitas,
          (l) => l.categoria,
          (l) => l.valor,
          { formato: 'moeda', limite: 10 },
        ),
        agrupar(
          'Despesas por categoria',
          despesas,
          (l) => l.categoria,
          (l) => l.valor,
          { formato: 'moeda', limite: 10 },
        ),
        agrupar(
          'Realizado por forma de pagamento',
          pagos,
          (l) => l.forma_pagamento,
          (l) => l.valor,
          { formato: 'moeda', rotulos: FORMAS_PAGAMENTO },
        ),
      ],
      colunas: [
        coluna('vencimento', 'Vencimento', 'data'),
        coluna('tipo', 'Tipo'),
        coluna('descricao', 'Descrição'),
        coluna('categoria', 'Categoria'),
        coluna('status', 'Status'),
        coluna('pagoEm', 'Pago em', 'data'),
        coluna('valor', 'Valor', 'moeda'),
      ],
      linhas: lancamentos.map((l) => ({
        vencimento: l.vencimento,
        tipo: rotulo(TIPOS_FINANCEIRO, l.tipo),
        descricao: l.descricao,
        categoria: l.categoria,
        status: rotulo(STATUS_FINANCEIRO, l.status),
        pagoEm: l.pagoEm,
        valor: l.valor,
      })),
    });
  }

  /** Cadastros de pessoas: totais atuais e novos cadastros no periodo. */
  async pessoas(escopo: EscopoUsuario, filtro: FiltroRelatorio) {
    const periodo = resolverPeriodo(filtro.dataInicio, filtro.dataFim);
    const { empresaId, filialId } = escopoWhere(escopo, filtro.filialId);
    const where = {
      ...(empresaId && { filial: { empresaId } }),
      ...(filialId && { filialId }),
    };

    const pessoas = await this.prisma.pessoa.findMany({
      where,
      select: {
        nome: true,
        cpf: true,
        email: true,
        genero: true,
        status: true,
        createdAt: true,
        data_nascimento: true,
        cliente: { select: { convenio: { select: { nome: true } } } },
        funcionario: { select: { id: true } },
        optometrista: { select: { id: true } },
        oftalmologista: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const tipo = (p: (typeof pessoas)[number]) =>
      p.optometrista
        ? 'Optometrista'
        : p.oftalmologista
          ? 'Oftalmologista'
          : p.funcionario
            ? 'Funcionário'
            : p.cliente
              ? 'Cliente'
              : 'Outros';
    const novos = pessoas.filter(
      (p) => p.createdAt >= periodo.inicio && p.createdAt < periodo.fim,
    );
    const clientes = pessoas.filter((p) => p.cliente);
    const mesAtual = new Date().getMonth();

    return this.responder('Relatório de pessoas', periodo, {
      indicadores: [
        indicador('Pessoas cadastradas', pessoas.length),
        indicador('Clientes', clientes.length),
        indicador('Novos no período', novos.length),
        indicador('Ativos', pessoas.filter((p) => p.status === 'ativo').length),
        indicador(
          'Aniversariantes do mês',
          pessoas.filter((p) => p.data_nascimento?.getMonth() === mesAtual)
            .length,
        ),
      ],
      grupos: [
        porDia('Novos cadastros por dia', periodo, novos, (p) => p.createdAt),
        agrupar('Por tipo de cadastro', pessoas, tipo),
        agrupar(
          'Clientes por convênio',
          clientes,
          (p) => p.cliente?.convenio?.nome ?? 'Particular',
        ),
        agrupar('Por gênero', pessoas, (p) => p.genero),
      ],
      colunas: [
        coluna('cadastro', 'Cadastro', 'data'),
        coluna('nome', 'Nome'),
        coluna('tipo', 'Tipo'),
        coluna('cpf', 'CPF'),
        coluna('email', 'E-mail'),
        coluna('status', 'Status'),
      ],
      linhas: novos.map((p) => ({
        cadastro: p.createdAt,
        nome: p.nome,
        tipo: tipo(p),
        cpf: p.cpf,
        email: p.email,
        status: p.status === 'ativo' ? 'Ativo' : 'Inativo',
      })),
    });
  }

  /** Posicao de estoque atual e desempenho de vendas no periodo. */
  async produtos(escopo: EscopoUsuario, filtro: FiltroRelatorio) {
    const periodo = resolverPeriodo(filtro.dataInicio, filtro.dataFim);
    const escopoFilial = escopoWhere(escopo, filtro.filialId);

    const [produtos, vendidos] = await Promise.all([
      this.prisma.produto.findMany({
        where: {
          ...(escopoFilial.empresaId && { empresaId: escopoFilial.empresaId }),
        },
        select: {
          id: true,
          nome: true,
          sku: true,
          tipo: true,
          ativo: true,
          preco_custo: true,
          preco_venda: true,
          estoque_itens: {
            where: { estoque: escopoFilial },
            select: { quantidade: true, minimo: true },
          },
        },
        orderBy: { nome: 'asc' },
      }),
      this.prisma.vendaItem.findMany({
        where: {
          produtoId: { not: null },
          venda: {
            ...escopoFilial,
            status: StatusVenda.finalizada,
            dataVenda: { gte: periodo.inicio, lt: periodo.fim },
          },
        },
        select: {
          produtoId: true,
          quantidade: true,
          valor_unitario: true,
          desconto: true,
        },
      }),
    ]);

    const vendasPorProduto = new Map<
      string,
      { quantidade: number; receita: number }
    >();
    for (const item of vendidos) {
      const atual = vendasPorProduto.get(item.produtoId!) ?? {
        quantidade: 0,
        receita: 0,
      };
      atual.quantidade += item.quantidade;
      atual.receita +=
        item.quantidade * item.valor_unitario - (item.desconto ?? 0);
      vendasPorProduto.set(item.produtoId!, atual);
    }

    const linhas = produtos.map((p) => {
      const estoque = soma(p.estoque_itens, (e) => e.quantidade);
      const minimo = soma(p.estoque_itens, (e) => e.minimo ?? 0);
      const venda = vendasPorProduto.get(p.id) ?? { quantidade: 0, receita: 0 };
      return {
        produto: p.nome,
        sku: p.sku,
        tipo: rotulo(TIPOS_PRODUTO, p.tipo),
        estoque,
        minimo,
        vendidos: venda.quantidade,
        receita: venda.receita,
        custoEstoque: estoque * (p.preco_custo ?? 0),
        precoVenda: p.preco_venda,
        ativo: p.ativo === 'ativo',
      };
    });
    const controlados = linhas.filter((l) => l.tipo !== TIPOS_PRODUTO.servico);

    return this.responder('Relatório de produtos', periodo, {
      indicadores: [
        indicador('Produtos ativos', linhas.filter((l) => l.ativo).length),
        indicador(
          'Unidades em estoque',
          soma(controlados, (l) => l.estoque),
        ),
        indicador(
          'Valor do estoque (custo)',
          soma(controlados, (l) => l.custoEstoque),
          'moeda',
        ),
        indicador(
          'Abaixo do mínimo',
          controlados.filter((l) => l.minimo > 0 && l.estoque < l.minimo)
            .length,
        ),
        indicador(
          'Unidades vendidas no período',
          soma(linhas, (l) => l.vendidos),
        ),
      ],
      grupos: [
        agrupar(
          'Mais vendidos (receita)',
          linhas.filter((l) => l.receita > 0),
          (l) => l.produto,
          (l) => l.receita,
          { formato: 'moeda', limite: 10 },
        ),
        agrupar(
          'Valor do estoque por tipo',
          controlados,
          (l) => l.tipo,
          (l) => l.custoEstoque,
          { formato: 'moeda' },
        ),
        agrupar('Produtos por tipo', linhas, (l) => l.tipo),
      ],
      colunas: [
        coluna('produto', 'Produto'),
        coluna('sku', 'SKU'),
        coluna('tipo', 'Tipo'),
        coluna('estoque', 'Estoque', 'numero'),
        coluna('minimo', 'Mínimo', 'numero'),
        coluna('vendidos', 'Vendidos', 'numero'),
        coluna('receita', 'Receita', 'moeda'),
        coluna('precoVenda', 'Preço de venda', 'moeda'),
      ],
      linhas: linhas
        .sort((a, b) => b.receita - a.receita)
        .map(({ ativo: _ativo, custoEstoque: _custo, ...linha }) => linha),
    });
  }

  async agendas(escopo: EscopoUsuario, filtro: FiltroRelatorio) {
    const periodo = resolverPeriodo(filtro.dataInicio, filtro.dataFim);
    const agendas = await this.prisma.agenda.findMany({
      where: {
        ...escopoWhere(escopo, filtro.filialId),
        ...(escopo.profissionalId && { profissionalId: escopo.profissionalId }),
        dataHora: { gte: periodo.inicio, lt: periodo.fim },
      },
      select: {
        dataHora: true,
        status: true,
        pessoa: { select: { nome: true } },
        profissional: SELECT_PROFISSIONAL,
      },
      orderBy: { dataHora: 'asc' },
    });

    const conta = (status: StatusAgenda) =>
      agendas.filter((a) => a.status === status).length;
    const encerrados =
      conta(StatusAgenda.concluido) + conta(StatusAgenda.falta);

    return this.responder('Relatório de agendas', periodo, {
      indicadores: [
        indicador('Agendamentos', agendas.length),
        indicador('Concluídos', conta(StatusAgenda.concluido)),
        indicador('Faltas', conta(StatusAgenda.falta)),
        indicador(
          'Taxa de faltas',
          encerrados ? (conta(StatusAgenda.falta) / encerrados) * 100 : 0,
          'percentual',
        ),
        indicador('Cancelados', conta(StatusAgenda.cancelado)),
      ],
      grupos: [
        porDia('Agendamentos por dia', periodo, agendas, (a) => a.dataHora),
        agrupar('Por status', agendas, (a) => a.status, undefined, {
          rotulos: STATUS_AGENDA,
        }),
        agrupar('Por profissional', agendas, (a) =>
          nomeUsuario(a.profissional),
        ),
      ],
      colunas: [
        coluna('data', 'Data', 'dataHora'),
        coluna('paciente', 'Paciente'),
        coluna('profissional', 'Profissional'),
        coluna('status', 'Status'),
      ],
      linhas: agendas.map((a) => ({
        data: a.dataHora,
        paciente: a.pessoa?.nome ?? null,
        profissional: nomeUsuario(a.profissional),
        status: rotulo(STATUS_AGENDA, a.status),
      })),
    });
  }

  async consultas(escopo: EscopoUsuario, filtro: FiltroRelatorio) {
    const periodo = resolverPeriodo(filtro.dataInicio, filtro.dataFim);
    const consultas = await this.prisma.atendimento.findMany({
      where: {
        ...escopoWhere(escopo, filtro.filialId),
        ...(escopo.profissionalId && { profissionalId: escopo.profissionalId }),
        dataAtendimento: { gte: periodo.inicio, lt: periodo.fim },
      },
      select: {
        dataAtendimento: true,
        status: true,
        paciente: { select: { nome: true } },
        profissional: SELECT_PROFISSIONAL,
        convenio: { select: { nome: true } },
      },
      orderBy: { dataAtendimento: 'asc' },
    });

    const conta = (status: StatusAtendimento) =>
      consultas.filter((c) => c.status === status).length;
    const pacientes = new Set(consultas.map((c) => c.paciente.nome)).size;

    return this.responder('Relatório de consultas', periodo, {
      indicadores: [
        indicador('Consultas', consultas.length),
        indicador('Concluídas', conta(StatusAtendimento.concluido)),
        indicador(
          'Em espera/andamento',
          conta(StatusAtendimento.em_espera) +
            conta(StatusAtendimento.em_andamento),
        ),
        indicador('Canceladas', conta(StatusAtendimento.cancelado)),
        indicador('Pacientes atendidos', pacientes),
      ],
      grupos: [
        porDia(
          'Consultas por dia',
          periodo,
          consultas,
          (c) => c.dataAtendimento,
        ),
        agrupar('Por profissional', consultas, (c) =>
          nomeUsuario(c.profissional),
        ),
        agrupar(
          'Por convênio',
          consultas,
          (c) => c.convenio?.nome ?? 'Particular',
        ),
        agrupar('Por status', consultas, (c) => c.status, undefined, {
          rotulos: STATUS_ATENDIMENTO,
        }),
      ],
      colunas: [
        coluna('data', 'Data', 'dataHora'),
        coluna('paciente', 'Paciente'),
        coluna('profissional', 'Profissional'),
        coluna('convenio', 'Convênio'),
        coluna('status', 'Status'),
      ],
      linhas: consultas.map((c) => ({
        data: c.dataAtendimento,
        paciente: c.paciente.nome,
        profissional: nomeUsuario(c.profissional),
        convenio: c.convenio?.nome ?? 'Particular',
        status: rotulo(STATUS_ATENDIMENTO, c.status),
      })),
    });
  }

  /** Ordens de servico abertas no periodo. */
  async fluxoOrdens(escopo: EscopoUsuario, filtro: FiltroRelatorio) {
    const periodo = resolverPeriodo(filtro.dataInicio, filtro.dataFim);
    const ordens = await this.prisma.ordemServico.findMany({
      where: {
        ...escopoWhere(escopo, filtro.filialId),
        createdAt: { gte: periodo.inicio, lt: periodo.fim },
      },
      select: {
        numero: true,
        status: true,
        valor_total: true,
        createdAt: true,
        previsao_entrega: true,
        data_entrega: true,
        cliente: { select: { pessoa: { select: { nome: true } } } },
        laboratorio: { select: { nome: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const agora = new Date();
    const encerrada = (status: StatusOrdemServico) =>
      status === StatusOrdemServico.finalizada ||
      status === StatusOrdemServico.cancelada;
    const atrasada = (o: (typeof ordens)[number]) =>
      !encerrada(o.status) &&
      !o.data_entrega &&
      !!o.previsao_entrega &&
      o.previsao_entrega < agora;
    const entregues = ordens.filter((o) => o.data_entrega);
    const diasEntrega = entregues.map(
      (o) => (o.data_entrega!.getTime() - o.createdAt.getTime()) / 86_400_000,
    );

    return this.responder('Relatório de fluxo de ordens', periodo, {
      indicadores: [
        indicador('Ordens abertas no período', ordens.length),
        indicador(
          'Finalizadas',
          ordens.filter((o) => o.status === StatusOrdemServico.finalizada)
            .length,
        ),
        indicador('Em atraso', ordens.filter(atrasada).length),
        indicador(
          'Valor total',
          soma(
            ordens.filter((o) => o.status !== StatusOrdemServico.cancelada),
            (o) => o.valor_total,
          ),
          'moeda',
        ),
        indicador(
          'Prazo médio de entrega',
          diasEntrega.length
            ? soma(diasEntrega, (d) => d) / diasEntrega.length
            : 0,
          'dias',
        ),
      ],
      grupos: [
        porDia('Ordens por dia', periodo, ordens, (o) => o.createdAt),
        agrupar('Por status', ordens, (o) => o.status, undefined, {
          rotulos: STATUS_OS,
        }),
        agrupar(
          'Por laboratório',
          ordens,
          (o) => o.laboratorio?.nome ?? 'Sem laboratório',
        ),
      ],
      colunas: [
        coluna('numero', 'Número'),
        coluna('abertura', 'Abertura', 'data'),
        coluna('cliente', 'Cliente'),
        coluna('laboratorio', 'Laboratório'),
        coluna('status', 'Status'),
        coluna('previsao', 'Previsão', 'data'),
        coluna('entrega', 'Entrega', 'data'),
        coluna('valor', 'Valor', 'moeda'),
      ],
      linhas: ordens.map((o) => ({
        numero: o.numero,
        abertura: o.createdAt,
        cliente: o.cliente?.pessoa.nome ?? null,
        laboratorio: o.laboratorio?.nome ?? null,
        status: atrasada(o)
          ? `${rotulo(STATUS_OS, o.status)} (atrasada)`
          : rotulo(STATUS_OS, o.status),
        previsao: o.previsao_entrega,
        entrega: o.data_entrega,
        valor: o.valor_total,
      })),
    });
  }

  private responder(
    titulo: string,
    periodo: Periodo,
    conteudo: {
      indicadores: IndicadorRelatorio[];
      grupos: GrupoRelatorio[];
      colunas: ColunaRelatorio[];
      linhas: Relatorio['linhas']['itens'];
    },
  ): ResponseJson {
    const ultimoDia = new Date(periodo.fim);
    ultimoDia.setDate(ultimoDia.getDate() - 1);

    const data: Relatorio = {
      titulo,
      periodo: { inicio: diaIso(periodo.inicio), fim: diaIso(ultimoDia) },
      indicadores: conteudo.indicadores,
      grupos: conteudo.grupos.filter((grupo) => grupo.itens.length > 0),
      linhas: {
        colunas: conteudo.colunas,
        itens: conteudo.linhas.slice(0, LIMITE_LINHAS),
        total: conteudo.linhas.length,
        truncado: conteudo.linhas.length > LIMITE_LINHAS,
      },
    };

    return { status: 200, message: `${titulo} gerado.`, data };
  }
}
