import { BadRequestException } from '@nestjs/common';
import type { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import {
  ColunaRelatorio,
  FormatoValor,
  GrupoRelatorio,
  IndicadorRelatorio,
  Periodo,
} from './interfaces/relatorio.interface';

/** Maximo de linhas detalhadas devolvidas (os totais consideram tudo). */
export const LIMITE_LINHAS = 500;

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Periodo informado (AAAA-MM-DD, inclusivo) ou o mes atual. */
export function resolverPeriodo(
  dataInicio?: string,
  dataFim?: string,
): Periodo {
  for (const data of [dataInicio, dataFim]) {
    const utc = data ? new Date(`${data}T00:00:00Z`) : undefined;
    const valida =
      !data ||
      (DATA_ISO.test(data) &&
        !Number.isNaN(utc!.getTime()) &&
        utc!.toISOString().slice(0, 10) === data);
    if (!valida) {
      throw new BadRequestException(
        'As datas devem ser válidas no formato AAAA-MM-DD.',
      );
    }
  }

  const hoje = new Date();
  const inicio = dataInicio
    ? new Date(`${dataInicio}T00:00:00`)
    : new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimDia = dataFim
    ? new Date(`${dataFim}T00:00:00`)
    : new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  const fim = new Date(fimDia);
  fim.setDate(fim.getDate() + 1);

  if (fim <= inicio) {
    throw new BadRequestException(
      'A data final deve ser igual ou posterior à inicial.',
    );
  }

  return { inicio, fim };
}

/**
 * Filtro de empresa/filial: usuario com filial ve so a dela; sem filial, a
 * filial escolhida (dentro da empresa) ou a empresa toda; superadmin ve tudo.
 */
export function escopoWhere(
  escopo: EscopoUsuario,
  filialId?: string,
): { empresaId?: string; filialId?: string } {
  return {
    ...(escopo.empresaId && { empresaId: escopo.empresaId }),
    ...((escopo.filialId ?? filialId) && {
      filialId: escopo.filialId ?? filialId,
    }),
  };
}

export const diaIso = (data: Date) => {
  const local = new Date(data.getTime() - data.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

export const arredondar = (valor: number) => Math.round(valor * 100) / 100;

export const indicador = (
  label: string,
  valor: number,
  formato: FormatoValor = 'numero',
): IndicadorRelatorio => ({ label, valor: arredondar(valor), formato });

/** Soma valores por chave e devolve os maiores primeiro. */
export function agrupar<T>(
  titulo: string,
  itens: T[],
  chave: (item: T) => string | null | undefined,
  valor: (item: T) => number = () => 1,
  opcoes: {
    formato?: FormatoValor;
    limite?: number;
    rotulos?: Record<string, string>;
  } = {},
): GrupoRelatorio {
  const mapa = new Map<string, { valor: number; quantidade: number }>();

  for (const item of itens) {
    const label = chave(item) || 'Não informado';
    const atual = mapa.get(label) ?? { valor: 0, quantidade: 0 };
    atual.valor += valor(item);
    atual.quantidade += 1;
    mapa.set(label, atual);
  }

  const ordenados = [...mapa.entries()]
    .map(([label, dados]) => ({
      label: opcoes.rotulos?.[label] ?? label,
      valor: arredondar(dados.valor),
      quantidade: dados.quantidade,
    }))
    .sort((a, b) => b.valor - a.valor);

  return {
    titulo,
    formato: opcoes.formato ?? 'numero',
    itens: opcoes.limite ? ordenados.slice(0, opcoes.limite) : ordenados,
  };
}

/** Periodos maiores que isso viram serie mensal (legivel no grafico). */
const DIAS_SERIE_DIARIA = 62;
const DIAS_MAXIMOS_SERIE = 3660;

/**
 * Serie em ordem cronologica, incluindo dias (ou meses, em periodos longos)
 * sem movimento. O titulo "por dia" vira "por mês" quando agrupado por mes.
 */
export function porDia<T>(
  titulo: string,
  periodo: Periodo,
  itens: T[],
  data: (item: T) => Date | null | undefined,
  valor: (item: T) => number = () => 1,
  formato: FormatoValor = 'numero',
): GrupoRelatorio {
  const dias = (periodo.fim.getTime() - periodo.inicio.getTime()) / 86_400_000;
  const mensal = dias > DIAS_SERIE_DIARIA;
  const chave = (quando: Date) =>
    mensal ? diaIso(quando).slice(0, 7) : diaIso(quando);

  const mapa = new Map<string, number>();
  for (
    let dia = new Date(periodo.inicio), n = 0;
    dia < periodo.fim && n < DIAS_MAXIMOS_SERIE;
    dia.setDate(dia.getDate() + 1), n++
  ) {
    mapa.set(chave(dia), 0);
  }

  for (const item of itens) {
    const quando = data(item);
    if (!quando) continue;
    const ponto = chave(quando);
    if (mapa.has(ponto)) mapa.set(ponto, (mapa.get(ponto) ?? 0) + valor(item));
  }

  return {
    titulo: mensal ? titulo.replace('por dia', 'por mês') : titulo,
    formato,
    serie: true,
    itens: [...mapa.entries()].map(([label, total]) => ({
      label,
      valor: arredondar(total),
    })),
  };
}

export const coluna = (
  chave: string,
  label: string,
  formato: ColunaRelatorio['formato'] = 'texto',
): ColunaRelatorio => ({ chave, label, formato });
